import { google } from 'googleapis';

const GOOGLE_ENABLED = process.env.ENABLE_GOOGLE_CALENDAR !== 'false';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
];

let oauth2Client = null;

function getOAuth2Client() {
  if (oauth2Client !== null) return oauth2Client;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    oauth2Client = false;
    return false;
  }

  oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  return oauth2Client;
}

export function isEnabled() {
  if (!GOOGLE_ENABLED) {
    return { enabled: false, reason: 'feature flag ENABLE_GOOGLE_CALENDAR=false' };
  }
  const client = getOAuth2Client();
  if (!client) {
    return { enabled: false, reason: 'GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no configurados (auto-degrade activo)' };
  }
  return { enabled: true };
}

export function getAuthUrl({ state, codeChallenge }) {
  const status = isEnabled();
  if (!status.enabled) {
    return { url: null, reason: status.reason };
  }

  const url = getOAuth2Client().generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return { url, reason: null };
}

export async function exchangeCode({ code, codeVerifier }) {
  const status = isEnabled();
  if (!status.enabled) {
    return { tokens: null, reason: status.reason };
  }

  try {
    const { tokens } = await getOAuth2Client().getToken({ code, codeVerifier });
    return { tokens, reason: null };
  } catch (error) {
    console.error('[google-calendar] Error exchanging code:', error.message);
    return { tokens: null, reason: error.message };
  }
}

export async function fetchUserProfile(accessToken) {
  const status = isEnabled();
  if (!status.enabled || !accessToken) {
    return { profile: null, reason: status.enabled ? 'accessToken vacio' : status.reason };
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: 'v2', auth });
    const { data } = await oauth2.userinfo.get();
    return {
      profile: {
        providerId: data.id,
        email: data.email,
        nombre: data.given_name || (data.email || '').split('@')[0],
        apellido: data.family_name || '',
      },
      reason: null,
    };
  } catch (error) {
    console.error('[google-calendar] Error fetching user profile:', error.message);
    return { profile: null, reason: error.message };
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
    const client = getOAuth2Client();
    client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await client.refreshAccessToken();
    return { tokens: credentials, reason: null };
  } catch (error) {
    console.error('[google-calendar] Error refreshing access token:', error.message);
    return { tokens: null, reason: error.message };
  }
}

function getAuthorizedClient({ accessToken, refreshToken }) {
  const client = getOAuth2Client();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return client;
}

function buildEventResource(capacitacion) {
  const start = `${capacitacion.fecha}T${capacitacion.hora_inicio}:00`;
  const [hh, mm] = String(capacitacion.hora_inicio).split(':').map((v) => Number(v));
  const totalMinutes = (hh * 60) + (mm || 0) + Number(capacitacion.duracion_minutos || 60);
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
  const end = `${capacitacion.fecha}T${endTime}`;

  const description = [
    capacitacion.descripcion || '',
    '',
    capacitacion.area ? `Area: ${capacitacion.area.nombre}` : '',
    capacitacion.capacitador ? `Capacitador: ${capacitacion.capacitador.nombre} ${capacitacion.capacitador.apellido}` : '',
  ].filter(Boolean).join('\n');

  const event = {
    summary: capacitacion.nombre,
    description,
    start: { dateTime: start, timeZone: process.env.TZ || 'America/Mexico_City' },
    end: { dateTime: end, timeZone: process.env.TZ || 'America/Mexico_City' },
  };

  if (capacitacion.plataforma) {
    event.location = String(capacitacion.plataforma);
  }

  if (/meet/i.test(capacitacion.plataforma || '')) {
    event.conferenceData = {
      createRequest: {
        requestId: `cap-${capacitacion.id}-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  return event;
}

export async function createEvent({ userTokens, capacitacion }) {
  const status = isEnabled();
  if (!status.enabled) {
    console.log(`[google-calendar] SKIP createEvent cap=${capacitacion.id} reason="${status.reason}"`);
    return { eventId: null, reason: status.reason, sent: false };
  }
  if (!userTokens?.accessToken) {
    console.log(`[google-calendar] SKIP createEvent cap=${capacitacion.id} reason="user no vinculado con Google"`);
    return { eventId: null, reason: 'user no vinculado con Google', sent: false };
  }

  try {
    const auth = getAuthorizedClient(userTokens);
    const calendar = google.calendar({ version: 'v3', auth });
    const requestBody = buildEventResource(capacitacion);
    const params = /meet/i.test(capacitacion.plataforma || '')
      ? { conferenceDataVersion: 1 }
      : {};

    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      requestBody,
      ...params,
    });

    console.log(`[google-calendar] createEvent cap=${capacitacion.id} eventId=${data.id}`);
    return { eventId: data.id, reason: null, sent: true };
  } catch (error) {
    console.error(`[google-calendar] Error createEvent cap=${capacitacion.id}:`, error.message);
    return { eventId: null, reason: error.message, sent: false };
  }
}

export async function updateEvent({ userTokens, eventId, capacitacion }) {
  const status = isEnabled();
  if (!status.enabled) {
    console.log(`[google-calendar] SKIP updateEvent cap=${capacitacion.id} eventId=${eventId} reason="${status.reason}"`);
    return { sent: false, reason: status.reason };
  }
  if (!userTokens?.accessToken || !eventId) {
    console.log(`[google-calendar] SKIP updateEvent cap=${capacitacion.id} eventId=${eventId} reason="user no vinculado o eventId vacio"`);
    return { sent: false, reason: 'user no vinculado o eventId vacio' };
  }

  try {
    const auth = getAuthorizedClient(userTokens);
    const calendar = google.calendar({ version: 'v3', auth });
    const requestBody = buildEventResource(capacitacion);

    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody,
    });

    console.log(`[google-calendar] updateEvent cap=${capacitacion.id} eventId=${eventId}`);
    return { sent: true, reason: null };
  } catch (error) {
    console.error(`[google-calendar] Error updateEvent cap=${capacitacion.id} eventId=${eventId}:`, error.message);
    return { sent: false, reason: error.message };
  }
}

export async function deleteEvent({ userTokens, eventId }) {
  const status = isEnabled();
  if (!status.enabled) {
    console.log(`[google-calendar] SKIP deleteEvent eventId=${eventId} reason="${status.reason}"`);
    return { sent: false, reason: status.reason };
  }
  if (!userTokens?.accessToken || !eventId) {
    console.log(`[google-calendar] SKIP deleteEvent eventId=${eventId} reason="user no vinculado o eventId vacio"`);
    return { sent: false, reason: 'user no vinculado o eventId vacio' };
  }

  try {
    const auth = getAuthorizedClient(userTokens);
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    console.log(`[google-calendar] deleteEvent eventId=${eventId}`);
    return { sent: true, reason: null };
  } catch (error) {
    if (error.code === 404 || error.status === 404) {
      console.log(`[google-calendar] deleteEvent eventId=${eventId} already gone (404)`);
      return { sent: true, reason: 'already deleted' };
    }
    console.error(`[google-calendar] Error deleteEvent eventId=${eventId}:`, error.message);
    return { sent: false, reason: error.message };
  }
}

export function getGoogleStatus() {
  return isEnabled();
}
