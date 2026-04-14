import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as AuthController from '../controllers/AuthController';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', requireAuth, AuthController.logout);
router.get('/me', requireAuth, AuthController.me);
router.delete('/account', requireAuth, AuthController.deleteAccount);
router.post('/send-verification', requireAuth, AuthController.sendVerification);
router.get('/verify-email', AuthController.verifyEmail);

router.post('/google', AuthController.googleAuth);
router.post('/google/complete', AuthController.googleComplete);
router.post('/google/link', requireAuth, AuthController.googleLink);

router.post('/apple', AuthController.appleAuth);
router.post('/apple/complete', AuthController.appleComplete);

export const authRoutes = router;
