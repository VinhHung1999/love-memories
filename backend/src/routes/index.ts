import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { momentRoutes } from './moments';
import { foodSpotRoutes } from './foodspots';
import { mapRoutes } from './map';
import { sprintRoutes } from './sprints';
import { goalRoutes } from './goals';
import { settingsRoutes } from './settings';
import { tagRoutes } from './tags';
import { authRoutes } from './auth';
import { recipeRoutes } from './recipes';
import { cookingSessionRoutes } from './cookingSessions';
import { aiRoutes } from './ai';
import { achievementRoutes } from './achievements';
import { profileRoutes } from './profile';
import { proxyImageRoute, proxyAudioRoute } from './proxy';
import { notificationRoutes } from './notifications';
import { pushRoutes } from './push';
import { dateWishRoutes } from './dateWishes';
import { datePlanRoutes } from './datePlans';
import { geocodeRoutes, resolveLocationRoute } from './location';
import { loveLetterRoutes } from './loveLetters';
import { recapRoutes } from './recap';
import { expenseRoutes } from './expenses';
import { coupleRoutes } from './couple';
import { shareRoutes } from './share';

const router = Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/resolve-location', resolveLocationRoute);
router.use('/geocode', geocodeRoutes);
// proxy-audio is public: <audio src> can't send Authorization headers.
// Security: endpoint validates URL must start with CDN_BASE_URL (our own CDN only).
router.use('/proxy-audio', proxyAudioRoute);

// Protected routes
router.use('/proxy-image', requireAuth, proxyImageRoute);
router.use('/moments', requireAuth, momentRoutes);
router.use('/foodspots', requireAuth, foodSpotRoutes);
router.use('/map', requireAuth, mapRoutes);
router.use('/sprints', requireAuth, sprintRoutes);
router.use('/goals', requireAuth, goalRoutes);
router.use('/settings', requireAuth, settingsRoutes);
router.use('/tags', requireAuth, tagRoutes);
router.use('/recipes', requireAuth, recipeRoutes);
router.use('/cooking-sessions', requireAuth, cookingSessionRoutes);
router.use('/ai', requireAuth, aiRoutes);
router.use('/achievements', requireAuth, achievementRoutes);
router.use('/profile', requireAuth, profileRoutes);
router.use('/notifications', requireAuth, notificationRoutes);
router.use('/push', requireAuth, pushRoutes);
router.use('/date-wishes', requireAuth, dateWishRoutes);
router.use('/date-plans', requireAuth, datePlanRoutes);
router.use('/love-letters', requireAuth, loveLetterRoutes);
router.use('/recap', requireAuth, recapRoutes);
router.use('/expenses', requireAuth, expenseRoutes);
router.use('/couple', requireAuth, coupleRoutes);
router.use('/share', shareRoutes);

export default router;
