import webpush from 'web-push';
import prisma from '../utils/prisma';

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@memoura.app',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || '',
);

// Firebase Admin — lazy singleton
let firebaseAdmin: typeof import('firebase-admin') | null = null;
async function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;
  try {
    firebaseAdmin = (await import('firebase-admin')).default;
    if (firebaseAdmin.apps.length === 0) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountJson) {
        const credential = firebaseAdmin.credential.cert(JSON.parse(serviceAccountJson));
        firebaseAdmin.initializeApp({ credential });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        firebaseAdmin.initializeApp();
      } else {
        firebaseAdmin = null;
        return null;
      }
    }
    return firebaseAdmin;
  } catch {
    firebaseAdmin = null;
    return null;
  }
}

export function getVapidPublicKey() {
  return { publicKey: process.env.VAPID_PUBLIC_KEY || '' };
}

export async function subscribe(userId: string, endpoint: string, keys: { p256dh: string; auth: string }) {
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId, p256dh: keys.p256dh, auth: keys.auth },
  });
}

export async function unsubscribe(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function mobileSubscribe(userId: string, token: string, deviceType: string) {
  await prisma.mobilePushToken.upsert({
    where: { token },
    create: { userId, token, deviceType },
    update: { userId, deviceType },
  });
}

export async function mobileUnsubscribe(token: string) {
  await prisma.mobilePushToken.deleteMany({ where: { token } });
}

// Note: Notification — Send Web Push to all browser subscriptions of a user.
export async function sendPushNotification(userId: string, title: string, body: string, link?: string): Promise<void> {
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
export async function sendMobilePushNotification(userId: string, title: string, body: string, link?: string): Promise<void> {
  try {
    const admin = await getFirebaseAdmin();
    if (!admin) return;

    const tokens = await prisma.mobilePushToken.findMany({ where: { userId } });
    if (tokens.length === 0) return;

    const results = await Promise.allSettled(
      tokens.map((t) =>
        admin.messaging().send({
          token: t.token,
          notification: { title, body },
          data: { link: link ?? '/', type: 'notification' },
          apns: { payload: { aps: { sound: 'default', badge: 1 } } },
          android: { priority: 'high' as const, notification: { sound: 'default', channelId: 'default' } },
        }),
      ),
    );

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
    // Non-blocking
  }
}
