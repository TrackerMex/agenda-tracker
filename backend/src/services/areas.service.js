import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { areas, roles, usuarios, usuariosRoles } from '../db/schema.ts';

function formatArea(area) {
  return {
    id: area.id,
    nombre: area.nombre,
    descripcion: area.descripcion,
    jefe_id: area.jefeId,
    created_at: area.createdAt,
    updated_at: area.updatedAt,
  };
}

function formatPersonal(user, roleNames = []) {
  return {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    area_id: user.areaId,
    activo: user.activo,
    roles: roleNames,
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

export async function listAreas() {
  const rows = await db.select().from(areas).orderBy(areas.id);
  return rows.map(formatArea);
}

export async function getAreaById(id) {
  const [area] = await db.select().from(areas).where(eq(areas.id, Number(id)));

  if (!area) {
    const error = new Error('Area no encontrada');
    error.statusCode = 404;
    throw error;
  }

  return formatArea(area);
}

export async function createArea({ nombre, descripcion, jefe_id }) {
  try {
    const [createdArea] = await db
      .insert(areas)
      .values({
        nombre,
        descripcion: descripcion || null,
        jefeId: jefe_id ? Number(jefe_id) : null,
      })
      .returning();

    return formatArea(createdArea);
  } catch (error) {
    if (error.cause?.code === '23505' || error.code === '23505') {
      error.statusCode = 409;
      error.message = 'Ya existe un area con ese nombre';
    }
    throw error;
  }
}

export async function updateArea(id, { nombre, descripcion, jefe_id }) {
  const values = {};

  if (nombre !== undefined) values.nombre = nombre;
  if (descripcion !== undefined) values.descripcion = descripcion;
  if (jefe_id !== undefined) values.jefeId = jefe_id === null ? null : Number(jefe_id);

  const [updatedArea] = await db.update(areas).set(values).where(eq(areas.id, Number(id))).returning();

  if (!updatedArea) {
    const error = new Error('Area no encontrada');
    error.statusCode = 404;
    throw error;
  }

  return formatArea(updatedArea);
}

export async function getAreaPersonal(areaId) {
  await getAreaById(areaId);

  const areaUsers = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.areaId, Number(areaId)))
    .orderBy(usuarios.id);
  const rolesByUser = await roleMapForUsers(areaUsers.map((user) => user.id));

  return areaUsers.map((user) => formatPersonal(user, rolesByUser.get(user.id) || []));
}
