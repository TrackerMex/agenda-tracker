import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { areas, roles, usuarios, usuariosRoles } from '../db/schema.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'development_jwt_secret_change_me';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'development_refresh_secret_change_me';
const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || '30d';
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      areaId: user.areaId,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      type: 'refresh',
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRE }
  );
}

function publicUser(user, roleNames = []) {
  return {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    apellido: user.apellido,
    area_id: user.areaId,
    activo: user.activo,
    roles: roleNames,
  };
}

async function getRoleNamesForUser(userId) {
  const rows = await db
    .select({ nombre: roles.nombre })
    .from(usuariosRoles)
    .innerJoin(roles, eq(usuariosRoles.rolId, roles.id))
    .where(eq(usuariosRoles.usuarioId, userId));

  return rows.map((row) => row.nombre);
}

async function getUserByEmail(email) {
  const [user] = await db.select().from(usuarios).where(eq(usuarios.email, email.toLowerCase()));
  return user;
}

async function getUserById(id) {
  const [user] = await db.select().from(usuarios).where(eq(usuarios.id, Number(id)));
  return user;
}

async function assignDefaultRole(userId) {
  const [defaultRole] = await db.select().from(roles).where(eq(roles.nombre, 'usuario'));

  if (!defaultRole) {
    return;
  }

  await db
    .insert(usuariosRoles)
    .values({ usuarioId: userId, rolId: defaultRole.id })
    .onConflictDoNothing();
}

async function ensureAreaExists(areaId) {
  const [area] = await db.select().from(areas).where(eq(areas.id, Number(areaId)));
  if (!area) {
    const error = new Error('Area no encontrada');
    error.statusCode = 400;
    throw error;
  }
}

function issueSession(user, roleNames) {
  return {
    token: signToken(user),
    refreshToken: signRefreshToken(user),
    user: publicUser(user, roleNames),
  };
}

export async function registerUser({ email, password, nombre, apellido, area_id }) {
  const normalizedEmail = email.toLowerCase();
  const existing = await getUserByEmail(normalizedEmail);

  if (existing) {
    const error = new Error('El email ya esta registrado');
    error.statusCode = 409;
    throw error;
  }

  await ensureAreaExists(area_id);

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const [createdUser] = await db
    .insert(usuarios)
    .values({
      email: normalizedEmail,
      password: hashedPassword,
      nombre,
      apellido,
      areaId: Number(area_id),
    })
    .returning();

  await assignDefaultRole(createdUser.id);
  const roleNames = await getRoleNamesForUser(createdUser.id);

  return issueSession(createdUser, roleNames);
}

export async function loginUser({ email, password }) {
  const user = await getUserByEmail(email.toLowerCase());

  if (!user || !user.password || !user.activo) {
    const error = new Error('Credenciales invalidas');
    error.statusCode = 401;
    throw error;
  }

  let isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword && user.password === password) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await db.update(usuarios).set({ password: hashedPassword }).where(eq(usuarios.id, user.id));
    isValidPassword = true;
  }

  if (!isValidPassword) {
    const error = new Error('Credenciales invalidas');
    error.statusCode = 401;
    throw error;
  }

  const roleNames = await getRoleNamesForUser(user.id);
  return issueSession(user, roleNames);
}

export async function refreshSession(refreshToken) {
  try {
    const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    if (payload.type !== 'refresh') {
      const error = new Error('Refresh token invalido');
      error.statusCode = 401;
      throw error;
    }

    const user = await getUserById(payload.sub);
    if (!user || !user.activo) {
      const error = new Error('Usuario no encontrado o inactivo');
      error.statusCode = 401;
      throw error;
    }

    const roleNames = await getRoleNamesForUser(user.id);
    return issueSession(user, roleNames);
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    error.message = error.message || 'Refresh token invalido';
    throw error;
  }
}

async function findOrCreateOAuthUser({ provider, providerId, email, nombre, apellido, area_id }) {
  const normalizedEmail = email.toLowerCase();
  const providerField = provider === 'google' ? 'googleId' : 'outlookId';
  const existing = await getUserByEmail(normalizedEmail);

  if (existing) {
    const [updatedUser] = await db
      .update(usuarios)
      .set({ [providerField]: providerId })
      .where(eq(usuarios.id, existing.id))
      .returning();
    return updatedUser;
  }

  await ensureAreaExists(area_id);

  const [createdUser] = await db
    .insert(usuarios)
    .values({
      email: normalizedEmail,
      password: null,
      nombre,
      apellido,
      areaId: Number(area_id),
      [providerField]: providerId,
    })
    .returning();

  await assignDefaultRole(createdUser.id);
  return createdUser;
}

export async function oauthLogin(provider, payload) {
  const user = await findOrCreateOAuthUser({
    provider,
    providerId: payload.provider_id,
    email: payload.email,
    nombre: payload.nombre,
    apellido: payload.apellido,
    area_id: payload.area_id,
  });
  const roleNames = await getRoleNamesForUser(user.id);
  return issueSession(user, roleNames);
}

export async function findOrCreateOAuthUserWithTokens({ provider, profile, tokens }) {
  const providerField = provider === 'google' ? 'googleId' : 'outlookId';
  const tokenFields = provider === 'google'
    ? {
        googleAccessToken: tokens.accessToken,
        googleRefreshToken: tokens.refreshToken ?? null,
        googleTokenExpiresAt: tokens.expiresAt ?? null,
      }
    : {
        outlookAccessToken: tokens.accessToken,
        outlookRefreshToken: tokens.refreshToken ?? null,
        outlookTokenExpiresAt: tokens.expiresAt ?? null,
      };

  const normalizedEmail = (profile.email || '').toLowerCase();
  if (!normalizedEmail) {
    const error = new Error('El perfil OAuth no incluye email');
    error.statusCode = 400;
    throw error;
  }

  const existing = await getUserByEmail(normalizedEmail);

  if (existing) {
    const [updatedUser] = await db
      .update(usuarios)
      .set({
        [providerField]: profile.providerId,
        ...tokenFields,
        updatedAt: sql`now()`,
      })
      .where(eq(usuarios.id, existing.id))
      .returning();
    const roleNames = await getRoleNamesForUser(updatedUser.id);
    return { user: updatedUser, roleNames, created: false };
  }

  const area = await pickDefaultArea();
  if (!area) {
    const error = new Error('No hay areas registradas para asignar al usuario OAuth');
    error.statusCode = 500;
    throw error;
  }

  const [createdUser] = await db
    .insert(usuarios)
    .values({
      email: normalizedEmail,
      password: null,
      nombre: profile.nombre || normalizedEmail.split('@')[0],
      apellido: profile.apellido || '',
      areaId: area.id,
      [providerField]: profile.providerId,
      ...tokenFields,
    })
    .returning();

  await assignDefaultRole(createdUser.id);
  const roleNames = await getRoleNamesForUser(createdUser.id);
  return { user: createdUser, roleNames, created: true };
}

async function pickDefaultArea() {
  const [area] = await db.select().from(areas).orderBy(areas.id).limit(1);
  return area || null;
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function oauthCallbackLogin({ provider, profile, tokens }) {
  const { user, roleNames } = await findOrCreateOAuthUserWithTokens({ provider, profile, tokens });
  return issueSession(user, roleNames);
}

export async function getAuthenticatedUser(userId) {
  const user = await getUserById(userId);

  if (!user || !user.activo) {
    return null;
  }

  const roleNames = await getRoleNamesForUser(user.id);
  return publicUser(user, roleNames);
}
