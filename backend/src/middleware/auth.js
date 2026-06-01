import { getAuthenticatedUser, verifyAccessToken } from '../services/auth.service.js';

export async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token requerido',
    });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    const user = await getAuthenticatedUser(payload.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autorizado',
      });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Token invalido o expirado',
    });
  }
}
