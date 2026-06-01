import { Router } from 'express';
import { index, personal, show, store, update } from '../controllers/areasController.js';
import { auth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(auth);

router.get('/', requirePermission('area:ver'), index);
router.get('/:id', requirePermission('area:ver'), show);
router.get('/:id/personal', requirePermission('usuario:ver'), personal);
router.post('/', requirePermission('area:crear'), store);
router.put('/:id', requirePermission('area:editar'), update);

export default router;
