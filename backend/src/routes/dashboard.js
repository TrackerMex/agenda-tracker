import { Router } from 'express';
import { area, usuario } from '../controllers/dashboardController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.get('/area/:id', area);
router.get('/usuario', usuario);

export default router;
