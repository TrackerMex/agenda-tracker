import { z } from 'zod';
import {
  cancelCapacitacion,
  createCapacitacion,
  getCapacitacionById,
  listCapacitaciones,
  listCapacitacionesByArea,
  listCapacitacionesByUsuario,
  markAsistencia,
  registerToCapacitacion,
  unregisterFromCapacitacion,
  updateCapacitacion,
} from '../services/capacitaciones.service.js';

const idSchema = z.coerce.number().int().positive();

const estadoSchema = z.enum(['programada', 'completada', 'cancelada']);

const listSchema = z.object({
  area_id: z.coerce.number().int().positive().optional(),
  estado: estadoSchema.optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const capacitacionSchema = z.object({
  nombre: z.string().min(5).max(255),
  descripcion: z.string().max(2000).optional(),
  area_id: z.coerce.number().int().positive(),
  capacitador_id: z.coerce.number().int().positive(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  duracion_minutos: z.coerce.number().int().positive(),
  plataforma: z.string().min(2).max(100),
  max_participantes: z.coerce.number().int().min(5),
});

const updateCapacitacionSchema = capacitacionSchema.extend({
  estado: estadoSchema.optional(),
}).partial();

const asistenciaSchema = z.object({
  asistio: z.boolean(),
  comentarios: z.string().max(2000).optional(),
});

function handleError(res, error) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Datos invalidos',
      errors: error.flatten().fieldErrors,
      issues: error.issues,
    });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
  });
}

export async function index(req, res) {
  try {
    const filters = listSchema.parse(req.query);
    const data = await listCapacitaciones(filters);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function show(req, res) {
  try {
    const id = idSchema.parse(req.params.id);
    const data = await getCapacitacionById(id);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function byArea(req, res) {
  try {
    const id = idSchema.parse(req.params.id);
    const data = await listCapacitacionesByArea(id);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function byUsuario(req, res) {
  try {
    const id = idSchema.parse(req.params.id);
    const data = await listCapacitacionesByUsuario(id);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function store(req, res) {
  try {
    const payload = capacitacionSchema.parse(req.body);
    const data = await createCapacitacion(payload);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function update(req, res) {
  try {
    const id = idSchema.parse(req.params.id);
    const payload = updateCapacitacionSchema.parse(req.body);
    const data = await updateCapacitacion(id, payload, req.user);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function destroy(req, res) {
  try {
    const id = idSchema.parse(req.params.id);
    const data = await cancelCapacitacion(id, req.user);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function registrar(req, res) {
  try {
    const id = idSchema.parse(req.params.id);
    const data = await registerToCapacitacion(id, req.user.id);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function desregistrar(req, res) {
  try {
    const capacitacionId = idSchema.parse(req.params.id);
    const usuarioId = idSchema.parse(req.params.usuario_id);
    const data = await unregisterFromCapacitacion(capacitacionId, usuarioId, req.user);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function asistencia(req, res) {
  try {
    const capacitacionId = idSchema.parse(req.params.id);
    const usuarioId = idSchema.parse(req.params.usuario_id);
    const payload = asistenciaSchema.parse(req.body);
    const data = await markAsistencia(capacitacionId, usuarioId, payload);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}
