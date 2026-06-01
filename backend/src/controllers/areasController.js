import { z } from 'zod';
import { createArea, getAreaById, getAreaPersonal, listAreas, updateArea } from '../services/areas.service.js';

const idSchema = z.coerce.number().int().positive();

const createAreaSchema = z.object({
  nombre: z.string().min(2).max(100),
  descripcion: z.string().max(1000).optional(),
  jefe_id: z.coerce.number().int().positive().optional(),
});

const updateAreaSchema = createAreaSchema.partial();

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

export async function index(_req, res) {
  try {
    const data = await listAreas();
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function show(req, res) {
  try {
    const id = idSchema.parse(req.params.id);
    const data = await getAreaById(id);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function personal(req, res) {
  try {
    const id = idSchema.parse(req.params.id);
    const data = await getAreaPersonal(id);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function store(req, res) {
  try {
    const payload = createAreaSchema.parse(req.body);
    const data = await createArea(payload);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function update(req, res) {
  try {
    const id = idSchema.parse(req.params.id);
    const payload = updateAreaSchema.parse(req.body);
    const data = await updateArea(id, payload);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}
