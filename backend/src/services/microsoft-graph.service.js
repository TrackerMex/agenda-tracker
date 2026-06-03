import { Client } from '@microsoft/microsoft-graph-client';

const MS_ENABLED = process.env.ENABLE_OUTLOOK_CALENDAR !== 'false';
const CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';
const REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/auth/outlook/callback';

const AUTHORITY = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0`;
const AUTHORIZE_URL = `${AUTHORITY}/authorize`;
const TOKEN_URL = `${AUTHORITY}/token`;

const SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'Calendars.ReadWrite',
];

export function isEnabled() {
  if (!MS_ENABLED) {
    return { enabled: false, reason: 'feature flag ENABLE_OUTLOOK_CALENDAR=false' };
  }
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return { enabled: false, reason: 'MICROSOFT_CLIENT_ID o MICROSOFT_CLIENT_SECRET no configurados (auto-degrade activo)' };
  }
  return { enabled: true };
}

export function getAuthUrl({ state, codeChallenge }) {
  const status = isEnabled();
  if (!status.enabled) {
    return { url: null, reason: status.reason };
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    response_mode: 'query',
    scope: SCOPES.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return { url: `${AUTHORIZE_URL}?${params.toString()}`, reason: null };
}

async function postForm(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Microsoft token endpoint responded ${res.status}: ${text}`);
  }
  return JSON.parse(text);
}

export async function exchangeCode({ code, codeVerifier }) {
  const status = isEnabled();
  if (!status.enabled) {
    return { tokens: null, reason: status.reason };
  }

  try {
    const data = await postForm(TOKEN_URL, {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    });

    return {
      tokens: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
        idToken: data.id_token,
      },
      reason: null,
    };
  } catch (error) {
    console.error('[microsoft-graph] Error exchanging code:', error.message);
    return { tokens: null, reason: error.message };
  }
}

export async function refreshAccessToken(refreshToken) {
  const status = isEnabled();
  if (!status.enabled) {
    return { tokens: null, reason: status.reason };
  }
  if (!refreshToken) {
    return { tokens: null, reason: 'refreshToken vacio' };
  }

  try {
    const data = await postForm(TOKEN_URL, {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: SCOPES.join(' '),
    });

    return {
      tokens: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
      },
      reason: null,
    };
  } catch (error) {
    console.error('[microsoft-graph] Error refreshing access token:', error.message);
    return { tokens: null, reason: error.message };
  }
}

export async function fetchUserProfile(accessToken) {
  const status = isEnabled();
  if (!status.enabled || !accessToken) {
    return { profile: null, reason: status.enabled ? 'accessToken vacio' : status.reason };
  }

  try {
    const client = Client.init({ authProvider: (done) => done(null, accessToken) });
    const me = await client.api('/me').select('id,mail,userPrincipalName,givenName,surname,displayName').get();
    const email = me.mail || me.userPrincipalName;
    return {
      profile: {
        providerId: me.id,
        email,
        nombre: me.givenName || (me.displayName || email || '').split(' ')[0] || 'Usuario',
        apellido: me.surname || (me.displayName || '').split(' ').slice(1).join(' ') || '',
      },
      reason: null,
    };
  } catch (error) {
    console.error('[microsoft-graph] Error fetching user profile:', error.message);
    return { profile: null, reason: error.message };
  }
}

function getClient(accessToken) {
  return Client.init({ authProvider: (done) => done(null, accessToken) });
}

function buildEventBody(capacitacion) {
  const start = `${capacitacion.fecha}T${capacitacion.hora_inicio}:00`;
  const [hh, mm] = String(capacitacion.hora_inicio).split(':').map((v) => Number(v));
  const totalMinutes = (hh * 60) + (mm || 0) + Number(capacitacion.duracion_minutos || 60);
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
  const end = `${capacitacion.fecha}T${endTime}`;
  const tz = process.env.TZ || 'America/Mexico_City';

  const body = [
    capacitacion.descripcion || '',
    '',
    capacitacion.area ? `Area: ${capacitacion.area.nombre}` : '',
    capacitacion.capacitador ? `Capacitador: ${capacitacion.capacitador.nombre} ${capacitacion.capacitador.apellido}` : '',
  ].filter(Boolean).join('\n');

  const event = {
    subject: capacitacion.nombre,
    body: { contentType: 'Text', content: body },
    start: { dateTime: start, timeZone: tz },
    end: { dateTime: end, timeZone: tz },
  };

  if (capacitacion.plataforma) {
    event.location = { displayName: String(capacitacion.plataforma) };
  }

  if (/teams/i.test(capacitacion.plataforma || '')) {
    event.isOnlineMeeting = true;
    event.onlineMeetingProvider = 'teamsForBusiness';
  }

  return event;
}

export async function createEvent({ userTokens, capacitacion }) {
  const status = isEnabled();
  if (!status.enabled) {
    console.log(`[microsoft-graph] SKIP createEvent cap=${capacitacion.id} reason="${status.reason}"`);
    return { eventId: null, reason: status.reason, sent: false };
  }
  if (!userTokens?.accessToken) {
    console.log(`[microsoft-graph] SKIP createEvent cap=${capacitacion.id} reason="user no vinculado con Outlook"`);
    return { eventId: null, reason: 'user no vinculado con Outlook', sent: false };
  }

  try {
    const client = getClient(userTokens.accessToken);
    const data = await client.api('/me/events').post(buildEventBody(capacitacion));
    console.log(`[microsoft-graph] createEvent cap=${capacitacion.id} eventId=${data.id}`);
    return { eventId: data.id, reason: null, sent: true };
  } catch (error) {
    console.error(`[microsoft-graph] Error createEvent cap=${capacitacion.id}:`, error.message);
    return { eventId: null, reason: error.message, sent: false };
  }
}

export async function updateEvent({ userTokens, eventId, capacitacion }) {
  const status = isEnabled();
  if (!status.enabled) {
    console.log(`[microsoft-graph] SKIP updateEvent cap=${capacitacion.id} eventId=${eventId} reason="${status.reason}"`);
    return { sent: false, reason: status.reason };
  }
  if (!userTokens?.accessToken || !eventId) {
    console.log(`[microsoft-graph] SKIP updateEvent cap=${capacitacion.id} eventId=${eventId} reason="user no vinculado o eventId vacio"`);
    return { sent: false, reason: 'user no vinculado o eventId vacio' };
  }

  try {
    const client = getClient(userTokens.accessToken);
    await client.api(`/me/events/${eventId}`).patch(buildEventBody(capacitacion));
    console.log(`[microsoft-graph] updateEvent cap=${capacitacion.id} eventId=${eventId}`);
    return { sent: true, reason: null };
  } catch (error) {
    console.error(`[microsoft-graph] Error updateEvent cap=${capacitacion.id} eventId=${eventId}:`, error.message);
    return { sent: false, reason: error.message };
  }
}

export async function deleteEvent({ userTokens, eventId }) {
  const status = isEnabled();
  if (!status.enabled) {
    console.log(`[microsoft-graph] SKIP deleteEvent eventId=${eventId} reason="${status.reason}"`);
    return { sent: false, reason: status.reason };
  }
  if (!userTokens?.accessToken || !eventId) {
    console.log(`[microsoft-graph] SKIP deleteEvent eventId=${eventId} reason="user no vinculado o eventId vacio"`);
    return { sent: false, reason: 'user no vinculado o eventId vacio' };
  }

  try {
    const client = getClient(userTokens.accessToken);
    await client.api(`/me/events/${eventId}`).delete();
    console.log(`[microsoft-graph] deleteEvent eventId=${eventId}`);
    return { sent: true, reason: null };
  } catch (error) {
    if (error.statusCode === 404) {
      console.log(`[microsoft-graph] deleteEvent eventId=${eventId} already gone (404)`);
      return { sent: true, reason: 'already deleted' };
    }
    console.error(`[microsoft-graph] Error deleteEvent eventId=${eventId}:`, error.message);
    return { sent: false, reason: error.message };
  }
}

export function getMicrosoftStatus() {
  return isEnabled();
}
