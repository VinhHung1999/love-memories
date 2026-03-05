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

// Note: Notification — Firebase Admin SDK initialization for mobile push.
// Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to Firebase service account JSON,
// OR FIREBASE_SERVICE_ACCOUNT_JSON env var containing the JSON string directly.
// If neither is set, FCM sending is silently skipped (no crash).
let firebaseAdmin: typeof import('firebase-admin') | null = null;
async function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;
  try {
    firebaseAdmin = (await import('firebase-admin')).default;
    if (firebaseAdmin.apps.length === 0) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountJson) {
        // Note: Notification — parse service account from env var (useful for deployment)
        const credential = firebaseAdmin.credential.cert(JSON.parse(serviceAccountJson));
        firebaseAdmin.initializeApp({ credential });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Note: Notification — auto-discover from file path in env var
        firebaseAdmin.initializeApp();
      } else {
        // No credentials configured — FCM will be silently skipped
        firebaseAdmin = null;
        return null;
      }
    }
    return firebaseAdmin;
  } catch {
    // firebase-admin not installed or init failed — skip FCM
    firebaseAdmin = null;
    return null;
  }
}

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

// Note: Notification — Register mobile device FCM token.
// Called by the mobile app on every launch / token refresh.
// Upserts: if token already exists, update userId + deviceType.
// POST /api/push/mobile-subscribe { token: string, deviceType: "ios" | "android" }
router.post('/mobile-subscribe', async (req: AuthRequest, res: Response) => {
  try {
    const { token, deviceType } = req.body as { token: string; deviceType: string };
    if (!token || !deviceType) {
      res.status(400).json({ error: 'token and deviceType required' }); return;
    }
    await prisma.mobilePushToken.upsert({
      where: { token },
      create: { userId: req.user!.userId, token, deviceType },
      update: { userId: req.user!.userId, deviceType },
    });
    res.status(201).json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to save mobile push token' });
  }
});

// Note: Notification — Unregister mobile device FCM token (e.g. on logout).
// POST /api/push/mobile-unsubscribe { token: string }
router.post('/mobile-unsubscribe', async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body as { token: string };
    await prisma.mobilePushToken.deleteMany({ where: { token } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to remove mobile push token' });
  }
});

export { router as pushRoutes };

// Note: Notification — Send Web Push to all browser subscriptions of a user.
// Uses W3C Push API via web-push library (for PWA / desktop browser).
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

// Note: Notification — Send FCM push to all mobile devices of a user.
// Uses Firebase Admin SDK to send via FCM (Firebase Cloud Messaging).
// FCM delivers to both iOS (via APNs) and Android natively.
// If Firebase is not configured, this function silently does nothing.
export async function sendMobilePushNotification(
  userId: string,
  title: string,
  body: string,
  link?: string,
): Promise<void> {
  try {
    const admin = await getFirebaseAdmin();
    if (!admin) return; // Firebase not configured — skip silently

    const tokens = await prisma.mobilePushToken.findMany({ where: { userId } });
    if (tokens.length === 0) return;

    // Note: Notification — Build the FCM message payload.
    // `notification` = displayed by OS when app is background/killed.
    // `data` = custom data delivered to app's onMessage handler (used for navigation).
    const results = await Promise.allSettled(
      tokens.map((t) =>
        admin.messaging().send({
          token: t.token,
          notification: { title, body },
          data: { link: link ?? '/', type: 'notification' },
          // Note: Notification — APNs config for iOS: sound + badge increment
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
          // Note: Notification — Android config: high priority ensures wake-up delivery
          android: {
            priority: 'high' as const,
            notification: {
              sound: 'default',
              channelId: 'default',
            },
          },
        }),
      ),
    );

    // Note: Notification — Clean up invalid/expired tokens.
    // FCM returns specific error codes for tokens that are no longer valid.
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        const errorCode = (result.reason as any)?.code;
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token'
        ) {
          await prisma.mobilePushToken.deleteMany({ where: { token: tokens[i].token } });
        }
      }
    }
  } catch {
    // Non-blocking — mobile push failures must not break main operations
  }
}
