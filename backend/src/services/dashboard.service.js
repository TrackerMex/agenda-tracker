import { and, count, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  areas,
  capacitaciones,
  registrosCapacitacion,
  roles,
  usuarios,
  usuariosRoles,
} from '../db/schema.ts';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatArea(area) {
  return {
    id: area.id,
    nombre: area.nombre,
    descripcion: area.descripcion,
    jefe_id: area.jefeId,
  };
}

function formatCapacitacionSummary(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    fecha: row.fecha,
    hora_inicio: row.horaInicio,
    duracion_minutos: row.duracionMinutos,
    plataforma: row.plataforma,
    area_id: row.areaId,
    capacitador_id: row.capacitadorId,
    max_participantes: row.maxParticipantes,
    inscritos: row.inscritos ?? 0,
    estado: row.estado,
  };
}

function ensureCanViewArea(actor, area) {
  if (!actor) {
    const error = new Error('Autenticacion requerida');
    error.statusCode = 401;
    throw error;
  }
  const roles = actor.roles || [];
  if (roles.includes('admin')) return;
  if (roles.includes('jefe_area') && Number(actor.area_id) === Number(area.id)) return;
  const error = new Error('Solo el jefe del area o un administrador puede ver este dashboard');
  error.statusCode = 403;
  throw error;
}

async function countPersonal(areaId) {
  const [row] = await db
    .select({ total: count() })
    .from(usuarios)
    .where(and(eq(usuarios.areaId, Number(areaId)), eq(usuarios.activo, true)));
  return Number(row?.total || 0);
}

async function countCapacitadores(areaId) {
  const [row] = await db
    .select({ total: sql`COUNT(DISTINCT ${usuarios.id})` })
    .from(usuarios)
    .innerJoin(usuariosRoles, eq(usuariosRoles.usuarioId, usuarios.id))
    .innerJoin(roles, eq(roles.id, usuariosRoles.rolId))
    .where(
      and(
        eq(usuarios.areaId, Number(areaId)),
        eq(usuarios.activo, true),
        inArray(roles.nombre, ['capacitador', 'jefe_area', 'admin']),
      ),
    );
  return Number(row?.total || 0);
}

async function countCapsByState(areaId) {
  const rows = await db
    .select({ estado: capacitaciones.estado, total: count() })
    .from(capacitaciones)
    .where(eq(capacitaciones.areaId, Number(areaId)))
    .groupBy(capacitaciones.estado);

  const map = { programada: 0, completada: 0, cancelada: 0 };
  for (const row of rows) {
    map[row.estado] = Number(row.total || 0);
  }
  return map;
}

async function countInscritosTotal(areaId) {
  const [row] = await db
    .select({ total: sql`COUNT(${registrosCapacitacion.id})` })
    .from(registrosCapacitacion)
    .innerJoin(capacitaciones, eq(capacitaciones.id, registrosCapacitacion.capacitacionId))
    .where(eq(capacitaciones.areaId, Number(areaId)));
  return Number(row?.total || 0);
}

async function listCapsForArea(areaId, { estado, fechaGte, fechaLt }) {
  const conditions = [eq(capacitaciones.areaId, Number(areaId))];

  if (estado) conditions.push(eq(capacitaciones.estado, estado));
  if (fechaGte) conditions.push(gte(capacitaciones.fecha, fechaGte));
  if (fechaLt) conditions.push(lt(capacitaciones.fecha, fechaLt));

  const rows = await db
    .select({
      id: capacitaciones.id,
      nombre: capacitaciones.nombre,
      fecha: capacitaciones.fecha,
      horaInicio: capacitaciones.horaInicio,
      duracionMinutos: capacitaciones.duracionMinutos,
      plataforma: capacitaciones.plataforma,
      areaId: capacitaciones.areaId,
      capacitadorId: capacitaciones.capacitadorId,
      maxParticipantes: capacitaciones.maxParticipantes,
      estado: capacitaciones.estado,
      inscritos: sql`(
        SELECT COUNT(*)::int FROM ${registrosCapacitacion}
        WHERE ${registrosCapacitacion.capacitacionId} = ${capacitaciones.id}
      )`,
    })
    .from(capacitaciones)
    .where(and(...conditions))
    .orderBy(capacitaciones.fecha, capacitaciones.horaInicio);

  return rows.map(formatCapacitacionSummary);
}

export async function getAreaDashboard(areaId, actor) {
  const [area] = await db.select().from(areas).where(eq(areas.id, Number(areaId)));
  if (!area) {
    const error = new Error('Area no encontrada');
    error.statusCode = 404;
    throw error;
  }

  ensureCanViewArea(actor, area);

  const today = todayIso();

  const [
    personasTotal,
    capacitadores,
    capsByState,
    inscritosTotal,
    capsFuturas,
    capsRealizadas,
    capsCerradas,
  ] = await Promise.all([
    countPersonal(area.id),
    countCapacitadores(area.id),
    countCapsByState(area.id),
    countInscritosTotal(area.id),
    listCapsForArea(area.id, { estado: 'programada', fechaGte: today }),
    listCapsForArea(area.id, { estado: 'programada', fechaLt: today }),
    listCapsForArea(area.id, { estado: undefined }).then((all) =>
      all.filter((c) => c.estado === 'completada' || c.estado === 'cancelada'),
    ),
  ]);

  return {
    area: formatArea(area),
    stats: {
      personas_total: personasTotal,
      capacitadores,
      caps_programadas: capsByState.programada,
      inscriptos_total: inscritosTotal,
    },
    capacitaciones: {
      futuras: capsFuturas,
      realizadas: capsRealizadas,
      cerradas: capsCerradas,
    },
  };
}

async function listMisProximas(usuarioId, limit = 5) {
  const today = todayIso();
  const rows = await db
    .select({
      id: capacitaciones.id,
      nombre: capacitaciones.nombre,
      fecha: capacitaciones.fecha,
      horaInicio: capacitaciones.horaInicio,
      duracionMinutos: capacitaciones.duracionMinutos,
      plataforma: capacitaciones.plataforma,
      areaId: capacitaciones.areaId,
      capacitadorId: capacitaciones.capacitadorId,
      maxParticipantes: capacitaciones.maxParticipantes,
      estado: capacitaciones.estado,
      registrados_en: registrosCapacitacion.registradoEn,
    })
    .from(registrosCapacitacion)
    .innerJoin(capacitaciones, eq(capacitaciones.id, registrosCapacitacion.capacitacionId))
    .where(
      and(
        eq(registrosCapacitacion.usuarioId, Number(usuarioId)),
        eq(capacitaciones.estado, 'programada'),
        gte(capacitaciones.fecha, today),
      ),
    )
    .orderBy(capacitaciones.fecha, capacitaciones.horaInicio)
    .limit(limit);

  return rows.map((row) => ({
    ...formatCapacitacionSummary(row),
    registrado_en: row.registrados_en,
  }));
}

async function countInscripcionesByState(usuarioId) {
  const rows = await db
    .select({ estado: capacitaciones.estado, total: count() })
    .from(registrosCapacitacion)
    .innerJoin(capacitaciones, eq(capacitaciones.id, registrosCapacitacion.capacitacionId))
    .where(eq(registrosCapacitacion.usuarioId, Number(usuarioId)))
    .groupBy(capacitaciones.estado);

  const map = { programada: 0, completada: 0, cancelada: 0 };
  for (const row of rows) {
    map[row.estado] = Number(row.total || 0);
  }
  return map;
}

async function countProximasActivas(usuarioId) {
  const today = todayIso();
  const [row] = await db
    .select({ total: count() })
    .from(registrosCapacitacion)
    .innerJoin(capacitaciones, eq(capacitaciones.id, registrosCapacitacion.capacitacionId))
    .where(
      and(
        eq(registrosCapacitacion.usuarioId, Number(usuarioId)),
        eq(capacitaciones.estado, 'programada'),
        gte(capacitaciones.fecha, today),
      ),
    );
  return Number(row?.total || 0);
}

async function sumCuposLibres() {
  const today = todayIso();
  const [row] = await db
    .select({
      total: sql`COALESCE(SUM(${capacitaciones.maxParticipantes} - (
        SELECT COUNT(*)::int FROM ${registrosCapacitacion}
        WHERE ${registrosCapacitacion.capacitacionId} = ${capacitaciones.id}
      )), 0)::int`,
    })
    .from(capacitaciones)
    .where(
      and(eq(capacitaciones.estado, 'programada'), gte(capacitaciones.fecha, today)),
    );
  return Number(row?.total || 0);
}

export async function getUsuarioDashboard(actor) {
  if (!actor) {
    const error = new Error('Autenticacion requerida');
    error.statusCode = 401;
    throw error;
  }

  const [inscripcionesByState, proximasActivas, cuposLibres, misProximas] = await Promise.all([
    countInscripcionesByState(actor.id),
    countProximasActivas(actor.id),
    sumCuposLibres(),
    listMisProximas(actor.id, 5),
  ]);

  const inscripcionesTotales =
    inscripcionesByState.programada + inscripcionesByState.completada + inscripcionesByState.cancelada;

  return {
    stats: {
      inscripciones_totales: inscripcionesTotales,
      proximas_activas: proximasActivas,
      completadas: inscripcionesByState.completada,
      cupos_libres: cuposLibres,
    },
    mis_proximas_capacitaciones: misProximas,
  };
}
