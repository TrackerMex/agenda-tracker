import { Router } from 'express';
import { index, show, update } from '../controllers/usuariosController.js';
import { auth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(auth);

router.get('/', requirePermission('usuario:ver'), index);
router.get('/:id', requirePermission('usuario:ver'), show);
router.put('/:id', requirePermission('usuario:editar'), update);

export default router;
