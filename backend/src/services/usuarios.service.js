import bcrypt from 'bcryptjs';
import { count, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { roles, usuarios, usuariosRoles } from '../db/schema.ts';

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

function formatUser(user, roleNames = []) {
  return {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    apellido: user.apellido,
    area_id: user.areaId,
    activo: user.activo,
    google_id: user.googleId,
    outlook_id: user.outlookId,
    roles: roleNames,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

async function roleMapForUsers(userIds) {
  if (userIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      usuarioId: usuariosRoles.usuarioId,
      rol: roles.nombre,
    })
    .from(usuariosRoles)
    .innerJoin(roles, eq(usuariosRoles.rolId, roles.id));

  const map = new Map(userIds.map((id) => [id, []]));

  for (const row of rows) {
    if (map.has(row.usuarioId)) {
      map.get(row.usuarioId).push(row.rol);
    }
  }

  return map;
}

export async function listUsuarios({ page = 1, limit = 20 }) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const [totalRow] = await db.select({ total: count() }).from(usuarios);
  const rows = await db
    .select()
    .from(usuarios)
    .orderBy(usuarios.id)
    .limit(safeLimit)
    .offset(offset);
  const rolesByUser = await roleMapForUsers(rows.map((user) => user.id));

  return {
    data: rows.map((user) => formatUser(user, rolesByUser.get(user.id) || [])),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: totalRow.total,
      totalPages: Math.ceil(totalRow.total / safeLimit),
    },
  };
}

export async function getUsuarioById(id) {
  const [user] = await db.select().from(usuarios).where(eq(usuarios.id, Number(id)));

  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }

  const rolesByUser = await roleMapForUsers([user.id]);
  return formatUser(user, rolesByUser.get(user.id) || []);
}

export async function updateUsuario(id, payload) {
  const values = {};

  if (payload.email !== undefined) values.email = payload.email.toLowerCase();
  if (payload.password !== undefined) values.password = await bcrypt.hash(payload.password, BCRYPT_ROUNDS);
  if (payload.nombre !== undefined) values.nombre = payload.nombre;
  if (payload.apellido !== undefined) values.apellido = payload.apellido;
  if (payload.area_id !== undefined) values.areaId = Number(payload.area_id);
  if (payload.activo !== undefined) values.activo = payload.activo;
  values.updatedAt = sql`now()`;

  try {
    const [updatedUser] = await db.update(usuarios).set(values).where(eq(usuarios.id, Number(id))).returning();

    if (!updatedUser) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const rolesByUser = await roleMapForUsers([updatedUser.id]);
    return formatUser(updatedUser, rolesByUser.get(updatedUser.id) || []);
  } catch (error) {
    if (error.cause?.code === '23505' || error.code === '23505') {
      error.statusCode = 409;
      error.message = 'Ya existe un usuario con ese email';
    }
    throw error;
  }
}
