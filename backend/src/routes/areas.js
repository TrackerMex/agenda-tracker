import { Router } from 'express';
import { byArea } from '../controllers/capacitacionesController.js';
import { index, personal, show, store, update } from '../controllers/areasController.js';
import { auth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.get('/', index);
router.get('/:id/personal', auth, requirePermission('usuario:ver'), personal);
router.get('/:id/capacitaciones', auth, requirePermission('capacitacion:ver'), byArea);
router.get('/:id', auth, requirePermission('area:ver'), show);
router.post('/', auth, requirePermission('area:crear'), store);
router.put('/:id', auth, requirePermission('area:editar'), update);

export default router;
