import { Router } from 'express';
import type { Response } from 'express';
import webpush from 'web-push';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@love-scrum.hungphu.work',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || '',
);

// GET /api/push/vapid-key — expose public key to frontend
router.get('/vapid-key', (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

// POST /api/push/subscribe
router.post('/subscribe', async (req: AuthRequest, res: Response) => {
  try {
    const { endpoint, keys } = req.body as { endpoint: string; keys: { p256dh: string; auth: string } };
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ error: 'Invalid subscription' }); return;
    }
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId: req.user!.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { userId: req.user!.userId, p256dh: keys.p256dh, auth: keys.auth },
    });
    res.status(201).json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// POST /api/push/unsubscribe
router.post('/unsubscribe', async (req: AuthRequest, res: Response) => {
  try {
    const { endpoint } = req.body as { endpoint: string };
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

export { router as pushRoutes };

// Helper: send push to all subscriptions of a user
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  link?: string,
): Promise<void> {
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: link ?? '/' },
    });
    await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        ).catch(async (err) => {
          // 410 Gone = subscription expired, remove it
          if (err.statusCode === 410) {
            await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
          }
        }),
      ),
    );
  } catch {
    // Non-blocking
  }
}
