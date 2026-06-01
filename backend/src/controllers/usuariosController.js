import { z } from 'zod';
import { getUsuarioById, listUsuarios, updateUsuario } from '../services/usuarios.service.js';

const idSchema = z.coerce.number().int().positive();

const listSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const updateUsuarioSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  nombre: z.string().min(1).max(100).optional(),
  apellido: z.string().min(1).max(100).optional(),
  area_id: z.coerce.number().int().positive().optional(),
  activo: z.boolean().optional(),
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
    const query = listSchema.parse(req.query);
    const result = await listUsuarios(query);
    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function show(req, res) {
  try {
    const id = idSchema.parse(req.params.id);
    const data = await getUsuarioById(id);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function update(req, res) {
  try {
    const id = idSchema.parse(req.params.id);
    const payload = updateUsuarioSchema.parse(req.body);
    const data = await updateUsuario(id, payload);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}
