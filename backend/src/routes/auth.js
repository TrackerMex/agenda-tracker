import { Router } from 'express';
import {
  google,
  googleCallback,
  googleLogin,
  integrationsStatus,
  login,
  outlook,
  outlookCallback,
  outlookLogin,
  refresh,
  register,
} from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', google);
router.post('/outlook', outlook);
router.post('/refresh', refresh);

router.get('/google/login', googleLogin);
router.get('/google/callback', googleCallback);
router.get('/outlook/login', outlookLogin);
router.get('/outlook/callback', outlookCallback);
router.get('/integrations/status', integrationsStatus);

router.get('/me', auth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

export default router;
