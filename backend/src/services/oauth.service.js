import crypto from 'node:crypto';
import * as googleCalendar from './google-calendar.service.js';
import * as microsoftGraph from './microsoft-graph.service.js';

const STATE_TTL_MS = 10 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const stateStore = new Map();
let cleanupTimer = null;

function base64UrlEncode(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateCodeVerifier() {
  return base64UrlEncode(crypto.randomBytes(32));
}

function generateCodeChallenge(codeVerifier) {
  return base64UrlEncode(
    crypto.createHash('sha256').update(codeVerifier).digest(),
  );
}

function generateState() {
  return base64UrlEncode(crypto.randomBytes(24));
}

function ensureCleanupTimer() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of stateStore.entries()) {
      if (entry.expiresAt < now) {
        stateStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  cleanupTimer.unref?.();
}

function buildProviderAuthUrl(provider, { state, codeChallenge }) {
  if (provider === 'google') {
    return googleCalendar.getAuthUrl({ state, codeChallenge });
  }
  if (provider === 'outlook' || provider === 'microsoft') {
    return microsoftGraph.getAuthUrl({ state, codeChallenge });
  }
  return { url: null, reason: `provider no soportado: ${provider}` };
}

async function exchangeProviderCode(provider, { code, codeVerifier }) {
  if (provider === 'google') {
    const { tokens } = await googleCalendar.exchangeCode({ code, codeVerifier });
    if (!tokens) {
      return { tokens: null, reason: googleCalendar.isEnabled().reason };
    }
    return {
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope,
        tokenType: tokens.token_type,
        idToken: tokens.id_token,
      },
      reason: null,
    };
  }

  if (provider === 'outlook' || provider === 'microsoft') {
    return microsoftGraph.exchangeCode({ code, codeVerifier });
  }

  return { tokens: null, reason: `provider no soportado: ${provider}` };
}

async function fetchProviderProfile(provider, accessToken) {
  if (provider === 'google') {
    return googleCalendar.fetchUserProfile(accessToken);
  }
  if (provider === 'outlook' || provider === 'microsoft') {
    return microsoftGraph.fetchUserProfile(accessToken);
  }
  return { profile: null, reason: `provider no soportado: ${provider}` };
}

export function createAuthState(provider) {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  stateStore.set(state, {
    provider,
    codeVerifier,
    expiresAt: Date.now() + STATE_TTL_MS,
  });
  ensureCleanupTimer();

  return { state, codeVerifier, codeChallenge };
}

export function consumeState(state) {
  const entry = stateStore.get(state);
  if (!entry) {
    return { provider: null, codeVerifier: null, reason: 'state invalido o expirado' };
  }
  stateStore.delete(state);
  if (entry.expiresAt < Date.now()) {
    return { provider: null, codeVerifier: null, reason: 'state expirado' };
  }
  return { provider: entry.provider, codeVerifier: entry.codeVerifier, reason: null };
}

export async function getAuthorizationUrl(provider) {
  if (provider !== 'google' && provider !== 'outlook') {
    return { url: null, reason: `provider no soportado: ${provider}` };
  }

  const { state, codeChallenge } = createAuthState(provider);
  const { url, reason } = buildProviderAuthUrl(provider, { state, codeChallenge });

  if (!url) {
    return { url: null, reason: reason || 'no se pudo generar URL de autorizacion' };
  }

  return { url, state, reason: null };
}

export async function handleCallback({ provider, code, state }) {
  const consumed = consumeState(state);
  if (!consumed.provider) {
    return { tokens: null, profile: null, reason: consumed.reason || 'state invalido' };
  }
  if (consumed.provider !== provider) {
    return { tokens: null, profile: null, reason: 'state pertenece a otro provider' };
  }

  const { tokens, reason: exchangeReason } = await exchangeProviderCode(provider, {
    code,
    codeVerifier: consumed.codeVerifier,
  });
  if (!tokens) {
    return { tokens: null, profile: null, reason: exchangeReason || 'no se pudo intercambiar el codigo' };
  }

  const { profile, reason: profileReason } = await fetchProviderProfile(provider, tokens.accessToken);
  if (!profile) {
    return { tokens, profile: null, reason: profileReason || 'no se pudo obtener el perfil del usuario' };
  }

  return { tokens, profile, reason: null };
}

export function getStateStoreSize() {
  return stateStore.size;
}
