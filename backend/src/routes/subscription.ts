import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as SubscriptionController from '../controllers/SubscriptionController';

const router = Router();

router.get('/status', requireAuth, SubscriptionController.getStatus);
router.post('/webhook', SubscriptionController.webhook); // No auth — uses webhook secret

export const subscriptionRoutes = router;
