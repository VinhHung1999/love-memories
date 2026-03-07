import { Router } from 'express';
import * as PushController from '../controllers/PushController';

const router = Router();

router.get('/vapid-key', PushController.getVapidKey);
router.post('/subscribe', PushController.subscribe);
router.post('/unsubscribe', PushController.unsubscribe);
router.post('/mobile-subscribe', PushController.mobileSubscribe);
router.post('/mobile-unsubscribe', PushController.mobileUnsubscribe);

export { router as pushRoutes };

// Re-export for any consumers that import from this module
export { sendPushNotification, sendMobilePushNotification } from '../services/PushService';
