import { Router } from 'express';
import { google, login, outlook, refresh, register } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', google);
router.post('/outlook', outlook);
router.post('/refresh', refresh);
router.get('/me', auth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

export default router;
