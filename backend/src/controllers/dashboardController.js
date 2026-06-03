import { z } from 'zod';
import { getAreaDashboard, getUsuarioDashboard } from '../services/dashboard.service.js';

const idSchema = z.coerce.number().int().positive();

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

export async function area(req, res) {
  try {
    const id = idSchema.parse(req.params.id);
    const data = await getAreaDashboard(id, req.user);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function usuario(req, res) {
  try {
    const data = await getUsuarioDashboard(req.user);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
}
