import { Router } from 'express';
import { asistencia, desregistrar, registrar } from '../controllers/registrosController.js';
import { auth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.post('/:id/registrar', requirePermission('capacitacion:registrarse'), registrar);
router.delete('/:id/registrar/:usuario_id', requirePermission('capacitacion:registrarse'), desregistrar);
router.put('/:id/registrar/:usuario_id/asistencia', requirePermission('capacitacion:marcar_asistencia'), asistencia);

export default router;
