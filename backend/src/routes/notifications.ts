import { Router } from 'express';
import type { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

type IdParam = { id: string };

// GET /api/notifications — list for current user (newest first, limit 50)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.userId, read: false },
    });
    res.json({ count });
  } catch {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// PUT /api/notifications/read-all — mark all as read (must be before /:id)
router.put('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, read: false },
      data: { read: true },
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to mark all read' });
  }
});

// PUT /api/notifications/:id/read — mark single as read
router.put('/:id/read', async (req: AuthRequest & { params: IdParam }, res: Response) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json(notification);
  } catch {
    res.status(404).json({ error: 'Notification not found' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req: AuthRequest & { params: IdParam }, res: Response) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Notification not found' });
  }
});

export { router as notificationRoutes };
