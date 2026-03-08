import { Router } from 'express';
import * as NotificationController from '../controllers/NotificationController';

const router = Router();

router.get('/', NotificationController.list);
router.get('/unread-count', NotificationController.unreadCount);
router.put('/read-all', NotificationController.markAllRead);
router.put('/:id/read', NotificationController.markRead);
router.delete('/:id', NotificationController.remove);

export { router as notificationRoutes };
