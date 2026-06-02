import { z } from 'zod';
import { loginUser, oauthLogin, refreshSession, registerUser } from '../services/auth.service.js';

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
