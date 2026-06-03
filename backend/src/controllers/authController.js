import { z } from 'zod';
import { loginUser, oauthCallbackLogin, oauthLogin, refreshSession, registerUser } from '../services/auth.service.js';
import * as oauthService from '../services/oauth.service.js';
import * as googleCalendar from '../services/google-calendar.service.js';
import * as microsoftGraph from '../services/microsoft-graph.service.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
  area_id: z.coerce.number().int().positive(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const oauthSchema = z.object({
  provider_id: z.string().min(1),
  email: z.string().email(),
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
  area_id: z.coerce.number().int().positive(),
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function buildCallbackUrl({ provider, params }) {
  const search = new URLSearchParams(params).toString();
  return `${FRONTEND_URL}/auth/${provider}-callback?${search}`;
}

function sendAuthResponse(res, session, status = 200) {
  return res.status(status).json({
    success: true,
    token: session.token,
    refreshToken: session.refreshToken,
    user: session.user,
  });
}

function handleError(res, error) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Datos invalidos',
      errors: error.flatten().fieldErrors,
    });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
  });
}

export async function register(req, res) {
  try {
    const payload = registerSchema.parse(req.body);
    const session = await registerUser(payload);
    return sendAuthResponse(res, session, 201);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function login(req, res) {
  try {
    const payload = loginSchema.parse(req.body);
    const session = await loginUser(payload);
    return sendAuthResponse(res, session);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function refresh(req, res) {
  try {
    const payload = refreshSchema.parse(req.body);
    const session = await refreshSession(payload.refreshToken);
    return sendAuthResponse(res, session);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function google(req, res) {
  try {
    const payload = oauthSchema.parse(req.body);
    const session = await oauthLogin('google', payload);
    return sendAuthResponse(res, session);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function outlook(req, res) {
  try {
    const payload = oauthSchema.parse(req.body);
    const session = await oauthLogin('outlook', payload);
    return sendAuthResponse(res, session);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function googleLogin(req, res) {
  const status = googleCalendar.getGoogleStatus();
  if (!status.enabled) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth no esta disponible',
      reason: status.reason,
    });
  }

  const { url, reason } = await oauthService.getAuthorizationUrl('google');
  if (!url) {
    return res.status(503).json({
      success: false,
      message: 'No se pudo generar la URL de autorizacion de Google',
      reason: reason || 'desconocido',
    });
  }

  return res.redirect(url);
}

export async function googleCallback(req, res) {
  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    const target = buildCallbackUrl({ provider: 'google', params: { success: '0', error: String(oauthError) } });
    return res.redirect(target);
  }

  if (!code || !state) {
    return res.status(400).json({ success: false, message: 'Faltan parametros code o state' });
  }

  try {
    const { tokens, profile, reason } = await oauthService.handleCallback({
      provider: 'google',
      code: String(code),
      state: String(state),
    });

    if (!profile) {
      const target = buildCallbackUrl({ provider: 'google', params: { success: '0', error: reason || 'no_profile' } });
      return res.redirect(target);
    }

    const session = await oauthCallbackLogin({ provider: 'google', profile, tokens });
    const target = buildCallbackUrl({
      provider: 'google',
      params: {
        success: '1',
        token: session.token,
        refreshToken: session.refreshToken,
        userId: String(session.user.id),
      },
    });
    return res.redirect(target);
  } catch (error) {
    console.error('[auth] googleCallback error:', error.message);
    const target = buildCallbackUrl({ provider: 'google', params: { success: '0', error: 'server_error' } });
    return res.redirect(target);
  }
};

export async function outlookLogin(req, res) {
  const status = microsoftGraph.getMicrosoftStatus();
  if (!status.enabled) {
    return res.status(503).json({
      success: false,
      message: 'Outlook OAuth no esta disponible',
      reason: status.reason,
    });
  }

  const { url, reason } = await oauthService.getAuthorizationUrl('outlook');
  if (!url) {
    return res.status(503).json({
      success: false,
      message: 'No se pudo generar la URL de autorizacion de Outlook',
      reason: reason || 'desconocido',
    });
  }

  return res.redirect(url);
}

export async function outlookCallback(req, res) {
  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    const target = buildCallbackUrl({ provider: 'outlook', params: { success: '0', error: String(oauthError) } });
    return res.redirect(target);
  }

  if (!code || !state) {
    return res.status(400).json({ success: false, message: 'Faltan parametros code o state' });
  }

  try {
    const { tokens, profile, reason } = await oauthService.handleCallback({
      provider: 'outlook',
      code: String(code),
      state: String(state),
    });

    if (!profile) {
      const target = buildCallbackUrl({ provider: 'outlook', params: { success: '0', error: reason || 'no_profile' } });
      return res.redirect(target);
    }

    const session = await oauthCallbackLogin({ provider: 'outlook', profile, tokens });
    const target = buildCallbackUrl({
      provider: 'outlook',
      params: {
        success: '1',
        token: session.token,
        refreshToken: session.refreshToken,
        userId: String(session.user.id),
      },
    });
    return res.redirect(target);
  } catch (error) {
    console.error('[auth] outlookCallback error:', error.message);
    const target = buildCallbackUrl({ provider: 'outlook', params: { success: '0', error: 'server_error' } });
    return res.redirect(target);
  }
}

export async function integrationsStatus(_req, res) {
  return res.json({
    success: true,
    google: googleCalendar.getGoogleStatus(),
    outlook: microsoftGraph.getMicrosoftStatus(),
  });
}
