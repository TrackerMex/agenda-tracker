import { Router } from 'express';
import {
  asistencia,
  desregistrar,
  destroy,
  index,
  registrar,
  show,
  store,
  update,
} from '../controllers/capacitacionesController.js';
import { auth } from '../middleware/auth.js';
import { requireAnyPermission, requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(auth);

router.get('/', requirePermission('capacitacion:ver'), index);
router.get('/:id', requirePermission('capacitacion:ver'), show);
router.post('/', requirePermission('capacitacion:crear'), store);
router.put('/:id', requireAnyPermission(['capacitacion:editar', 'capacitacion:marcar_asistencia']), update);
router.delete('/:id', requireAnyPermission(['capacitacion:eliminar', 'capacitacion:marcar_asistencia']), destroy);
router.post('/:id/registrar', requirePermission('capacitacion:registrarse'), registrar);
router.delete('/:id/registrar/:usuario_id', requirePermission('capacitacion:registrarse'), desregistrar);
router.put('/:id/registrar/:usuario_id/asistencia', requirePermission('capacitacion:marcar_asistencia'), asistencia);

export default router;
