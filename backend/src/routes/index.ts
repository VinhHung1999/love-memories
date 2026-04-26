import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireCouple } from '../middleware/requireCouple';
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
import { inviteRoutes } from './invite';
import { shareRoutes } from './share';
import { subscriptionRoutes } from './subscription';
import { dailyQuestionRoutes } from './dailyQuestions';
import { dailyVibeRoutes } from './dailyVibes';

const router = Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/resolve-location', resolveLocationRoute);
router.use('/geocode', geocodeRoutes);
// proxy-audio is public: <audio src> can't send Authorization headers.
// Security: endpoint validates URL must start with CDN_BASE_URL (our own CDN only).
router.use('/proxy-audio', proxyAudioRoute);

// Protected routes — requireCouple ensures user has completed onboarding
const rc = [requireAuth, requireCouple];
router.use('/proxy-image', requireAuth, proxyImageRoute);
router.use('/moments', ...rc, momentRoutes);
router.use('/foodspots', ...rc, foodSpotRoutes);
router.use('/map', ...rc, mapRoutes);
router.use('/sprints', ...rc, sprintRoutes);
router.use('/goals', ...rc, goalRoutes);
router.use('/settings', ...rc, settingsRoutes);
router.use('/tags', ...rc, tagRoutes);
router.use('/recipes', ...rc, recipeRoutes);
router.use('/cooking-sessions', ...rc, cookingSessionRoutes);
router.use('/ai', ...rc, aiRoutes);
router.use('/achievements', ...rc, achievementRoutes);
// /profile: requireAuth only — creator hits avatar picker on Personalize
// BEFORE POST /api/couple fires (T306 sequencing — couple created in
// Personalize.onSubmit). Adding requireCouple here breaks T319 onboarding
// avatar upload. Profile writes are per-user, not couple-scoped.
router.use('/profile', requireAuth, profileRoutes);
router.use('/notifications', ...rc, notificationRoutes);
router.use('/push', ...rc, pushRoutes);
router.use('/date-wishes', ...rc, dateWishRoutes);
router.use('/date-plans', ...rc, datePlanRoutes);
router.use('/love-letters', ...rc, loveLetterRoutes);
router.use('/recap', ...rc, recapRoutes);
router.use('/expenses', ...rc, expenseRoutes);
// /couple/validate-invite is public — needed during onboarding before user has auth token
import { validateInvite } from '../controllers/CoupleController';
router.get('/couple/validate-invite', validateInvite);
// /couple: requireAuth only — create/join routes need access before couple is set
router.use('/couple', requireAuth, coupleRoutes);
// /invite: requireAuth only — used during pairing wizard before couple is full
router.use('/invite', requireAuth, inviteRoutes);
router.use('/share', shareRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/daily-questions', ...rc, dailyQuestionRoutes);
router.use('/daily-vibes', ...rc, dailyVibeRoutes);

export default router;
