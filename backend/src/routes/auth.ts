import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as AuthController from '../controllers/AuthController';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', requireAuth, AuthController.logout);
router.get('/me', requireAuth, AuthController.me);

router.post('/google', AuthController.googleAuth);
router.post('/google/complete', AuthController.googleComplete);
router.post('/google/link', requireAuth, AuthController.googleLink);

export const authRoutes = router;
