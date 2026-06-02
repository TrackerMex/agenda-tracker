import { and, count, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { areas, capacitaciones, registrosCapacitacion, usuarios } from '../db/schema.ts';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function hasAdminRole(user) {
  return user.roles?.includes('admin');
}

function formatCapacitacion(row, extra = {}) {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    area_id: row.areaId,
    capacitador_id: row.capacitadorId,
    fecha: row.fecha,
    hora_inicio: row.horaInicio,
    duracion_minutos: row.duracionMinutos,
    plataforma: row.plataforma,
    max_participantes: row.maxParticipantes,
    google_calendar_event_id: row.googleCalendarEventId,
    outlook_calendar_event_id: row.outlookCalendarEventId,
    estado: row.estado,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    ...extra,
  };
}

function formatRegistro(row) {
  return {
    id: row.id,
    capacitacion_id: row.capacitacionId,
    usuario_id: row.usuarioId,
    registrado_en: row.registradoEn,
    asistio: row.asistio,
    comentarios: row.comentarios,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

async function ensureAreaExists(areaId) {
  const [area] = await db.select().from(areas).where(eq(areas.id, Number(areaId)));
  if (!area) {
    const error = new Error('Area no encontrada');
    error.statusCode = 400;
    throw error;
  }
  return area;
}

async function ensureUserExists(userId) {
  const [user] = await db.select().from(usuarios).where(eq(usuarios.id, Number(userId)));
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 400;
    throw error;
  }
  return user;
}

async function validateCapacitadorArea(areaId, capacitadorId) {
  const capacitador = await ensureUserExists(capacitadorId);

  if (capacitador.areaId !== Number(areaId)) {
    const error = new Error('El capacitador debe pertenecer al area de la capacitacion');
    error.statusCode = 400;
    throw error;
  }

  return capacitador;
}

async function getRegistroCount(capacitacionId) {
  const [row] = await db
    .select({ total: count() })
    .from(registrosCapacitacion)
    .where(eq(registrosCapacitacion.capacitacionId, Number(capacitacionId)));
  return row.total;
}

async function getCapacitacionRow(id) {
  const [capacitacion] = await db.select().from(capacitaciones).where(eq(capacitaciones.id, Number(id)));

  if (!capacitacion) {
    const error = new Error('Capacitacion no encontrada');
    error.statusCode = 404;
    throw error;
  }

  return capacitacion;
}

async function getCapacitadorInfo(id) {
  const [capacitador] = await db.select().from(usuarios).where(eq(usuarios.id, Number(id)));
  if (!capacitador) return null;
  return {
    id: capacitador.id,
    nombre: capacitador.nombre,
    apellido: capacitador.apellido,
    email: capacitador.email,
    area_id: capacitador.areaId,
  };
}

async function getAreaInfo(id) {
  const [area] = await db.select().from(areas).where(eq(areas.id, Number(id)));
  if (!area) return null;
  return {
    id: area.id,
    nombre: area.nombre,
    descripcion: area.descripcion,
  };
}

async function getRegistrosForCapacitacion(id) {
  const rows = await db
    .select({
      registro: registrosCapacitacion,
      usuario: usuarios,
    })
    .from(registrosCapacitacion)
    .innerJoin(usuarios, eq(registrosCapacitacion.usuarioId, usuarios.id))
    .where(eq(registrosCapacitacion.capacitacionId, Number(id)))
    .orderBy(registrosCapacitacion.id);

  return rows.map((row) => ({
    ...formatRegistro(row.registro),
    usuario: {
      id: row.usuario.id,
      nombre: row.usuario.nombre,
      apellido: row.usuario.apellido,
      email: row.usuario.email,
      area_id: row.usuario.areaId,
    },
  }));
}

export async function listCapacitaciones(filters = {}) {
  const conditions = [];

  if (filters.area_id) conditions.push(eq(capacitaciones.areaId, Number(filters.area_id)));
  if (filters.estado) conditions.push(eq(capacitaciones.estado, filters.estado));
  if (filters.fecha) conditions.push(eq(capacitaciones.fecha, filters.fecha));

  const rows = conditions.length > 0
    ? await db.select().from(capacitaciones).where(and(...conditions)).orderBy(capacitaciones.fecha, capacitaciones.horaInicio)
    : await db.select().from(capacitaciones).orderBy(capacitaciones.fecha, capacitaciones.horaInicio);
  const result = [];

  for (const row of rows) {
    result.push(formatCapacitacion(row, {
      inscritos: await getRegistroCount(row.id),
    }));
  }

  return result;
}

export async function listCapacitacionesByArea(areaId) {
  await ensureAreaExists(areaId);
  return listCapacitaciones({ area_id: areaId });
}

export async function getCapacitacionById(id) {
  const capacitacion = await getCapacitacionRow(id);
  const [area, capacitador, registros] = await Promise.all([
    getAreaInfo(capacitacion.areaId),
    getCapacitadorInfo(capacitacion.capacitadorId),
    getRegistrosForCapacitacion(capacitacion.id),
  ]);

  return formatCapacitacion(capacitacion, {
    area,
    capacitador,
    registros,
    inscritos: registros.length,
  });
}

export async function createCapacitacion(payload) {
  if (payload.fecha < todayIso()) {
    const error = new Error('La fecha debe ser hoy o posterior');
    error.statusCode = 400;
    throw error;
  }

  await ensureAreaExists(payload.area_id);
  await validateCapacitadorArea(payload.area_id, payload.capacitador_id);

  const [created] = await db
    .insert(capacitaciones)
    .values({
      nombre: payload.nombre,
      descripcion: payload.descripcion || null,
      areaId: Number(payload.area_id),
      capacitadorId: Number(payload.capacitador_id),
      fecha: payload.fecha,
      horaInicio: payload.hora_inicio,
      duracionMinutos: Number(payload.duracion_minutos),
      plataforma: payload.plataforma,
      maxParticipantes: Number(payload.max_participantes),
      estado: 'programada',
    })
    .returning();

  return getCapacitacionById(created.id);
}

export async function updateCapacitacion(id, payload, actor) {
  const current = await getCapacitacionRow(id);

  if (!hasAdminRole(actor) && current.capacitadorId !== actor.id && !actor.roles?.includes('jefe_area')) {
    const error = new Error('Solo el capacitador, jefe de area o admin puede editar esta capacitacion');
    error.statusCode = 403;
    throw error;
  }

  const nextAreaId = payload.area_id !== undefined ? Number(payload.area_id) : current.areaId;
  const nextCapacitadorId = payload.capacitador_id !== undefined ? Number(payload.capacitador_id) : current.capacitadorId;
  const nextFecha = payload.fecha ?? current.fecha;

  if (nextFecha < todayIso()) {
    const error = new Error('La fecha debe ser hoy o posterior');
    error.statusCode = 400;
    throw error;
  }

  await ensureAreaExists(nextAreaId);
  await validateCapacitadorArea(nextAreaId, nextCapacitadorId);

  const values = {
    updatedAt: sql`now()`,
  };

  if (payload.nombre !== undefined) values.nombre = payload.nombre;
  if (payload.descripcion !== undefined) values.descripcion = payload.descripcion;
  if (payload.area_id !== undefined) values.areaId = Number(payload.area_id);
  if (payload.capacitador_id !== undefined) values.capacitadorId = Number(payload.capacitador_id);
  if (payload.fecha !== undefined) values.fecha = payload.fecha;
  if (payload.hora_inicio !== undefined) values.horaInicio = payload.hora_inicio;
  if (payload.duracion_minutos !== undefined) values.duracionMinutos = Number(payload.duracion_minutos);
  if (payload.plataforma !== undefined) values.plataforma = payload.plataforma;
  if (payload.max_participantes !== undefined) values.maxParticipantes = Number(payload.max_participantes);
  if (payload.estado !== undefined) values.estado = payload.estado;

  const [updated] = await db.update(capacitaciones).set(values).where(eq(capacitaciones.id, Number(id))).returning();
  return getCapacitacionById(updated.id);
}

export async function cancelCapacitacion(id, actor) {
  const current = await getCapacitacionRow(id);

  if (!hasAdminRole(actor) && current.capacitadorId !== actor.id && !actor.roles?.includes('jefe_area')) {
    const error = new Error('Solo el capacitador, jefe de area o admin puede cancelar esta capacitacion');
    error.statusCode = 403;
    throw error;
  }

  const [updated] = await db
    .update(capacitaciones)
    .set({ estado: 'cancelada', updatedAt: sql`now()` })
    .where(eq(capacitaciones.id, Number(id)))
    .returning();

  return getCapacitacionById(updated.id);
}

export async function registerToCapacitacion(id, userId) {
  const capacitacion = await getCapacitacionRow(id);

  if (capacitacion.estado === 'cancelada') {
    const error = new Error('No puedes registrarte a una capacitacion cancelada');
    error.statusCode = 400;
    throw error;
  }

  const inscritos = await getRegistroCount(id);
  if (inscritos >= capacitacion.maxParticipantes) {
    const error = new Error('La capacitacion ya no tiene lugares disponibles');
    error.statusCode = 409;
    throw error;
  }

  try {
    const [registro] = await db
      .insert(registrosCapacitacion)
      .values({
        capacitacionId: Number(id),
        usuarioId: Number(userId),
      })
      .returning();

    return formatRegistro(registro);
  } catch (error) {
    if (error.cause?.code === '23505' || error.code === '23505') {
      error.statusCode = 409;
      error.message = 'Ya estas registrado en esta capacitacion';
    }
    throw error;
  }
}

export async function unregisterFromCapacitacion(capacitacionId, usuarioId, actor) {
  const isSelf = Number(usuarioId) === actor.id;

  if (!isSelf && !hasAdminRole(actor) && !actor.roles?.includes('jefe_area')) {
    const error = new Error('No puedes desregistrar a otro usuario');
    error.statusCode = 403;
    throw error;
  }

  const [deleted] = await db
    .delete(registrosCapacitacion)
    .where(
      and(
        eq(registrosCapacitacion.capacitacionId, Number(capacitacionId)),
        eq(registrosCapacitacion.usuarioId, Number(usuarioId))
      )
    )
    .returning();

  if (!deleted) {
    const error = new Error('Registro no encontrado');
    error.statusCode = 404;
    throw error;
  }

  return formatRegistro(deleted);
}

export async function markAsistencia(capacitacionId, usuarioId, payload) {
  const [updated] = await db
    .update(registrosCapacitacion)
    .set({
      asistio: payload.asistio,
      comentarios: payload.comentarios ?? null,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(registrosCapacitacion.capacitacionId, Number(capacitacionId)),
        eq(registrosCapacitacion.usuarioId, Number(usuarioId))
      )
    )
    .returning();

  if (!updated) {
    const error = new Error('Registro no encontrado');
    error.statusCode = 404;
    throw error;
  }

  return formatRegistro(updated);
}

export async function listCapacitacionesByUsuario(usuarioId) {
  await ensureUserExists(usuarioId);

  const rows = await db
    .select({ capacitacion: capacitaciones, registro: registrosCapacitacion })
    .from(registrosCapacitacion)
    .innerJoin(capacitaciones, eq(registrosCapacitacion.capacitacionId, capacitaciones.id))
    .where(eq(registrosCapacitacion.usuarioId, Number(usuarioId)))
    .orderBy(capacitaciones.fecha, capacitaciones.horaInicio);

  return rows.map((row) => ({
    ...formatCapacitacion(row.capacitacion),
    registro: formatRegistro(row.registro),
  }));
}
