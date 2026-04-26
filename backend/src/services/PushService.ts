import * as fs from 'fs';
import apn from 'apn';
import webpush from 'web-push';
import prisma from '../utils/prisma';

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@memoura.app',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || '',
);

// D75 (Sprint 65 Build 95 hot-fix): direct APNs via the `apn` library,
// replacing the Firebase Admin send path. Mobile clients register via
// `Notifications.getDevicePushTokenAsync()` which returns the raw APNs
// hex token (NOT an FCM registration token), and Firebase Admin's
// `messaging().send({ token })` only accepts FCM-formatted tokens —
// every send we tried before this fix returned `messaging/invalid-
// argument`. Switch to `apn.Provider` so we talk to APNs directly with
// the raw token. Apple .p8 key + IDs come from env (Lu set on dev +
// prod 2026-04-26).
let apnProviderSingleton: apn.Provider | null = null;
function getApnProvider(): apn.Provider | null {
  if (apnProviderSingleton) return apnProviderSingleton;
  const keyPath = process.env.APNS_KEY_PATH;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  if (!keyPath || !keyId || !teamId) return null;
  try {
    apnProviderSingleton = new apn.Provider({
      token: {
        key: fs.readFileSync(keyPath),
        keyId,
        teamId,
      },
      production: process.env.APNS_PRODUCTION === 'true',
    });
    return apnProviderSingleton;
  } catch {
    apnProviderSingleton = null;
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

// Note: Notification — Send APNs push to all mobile devices of a user.
// D75 (Sprint 65 Build 95 hot-fix): direct APNs via `apn.Provider`. The
// previous Firebase Admin path rejected every send because the mobile
// client registers raw APNs hex tokens, not FCM tokens. APNs response
// `reason: 'BadDeviceToken' | 'Unregistered'` triggers a token prune
// so a user who reinstalled stops getting failed sends forever.
export async function sendMobilePushNotification(userId: string, title: string, body: string, link?: string): Promise<void> {
  try {
    const provider = getApnProvider();
    if (!provider) return;
    const topic = process.env.APNS_BUNDLE_ID;
    if (!topic) return;

    const tokens = await prisma.mobilePushToken.findMany({ where: { userId } });
    if (tokens.length === 0) return;

    const note = new apn.Notification();
    note.alert = { title, body };
    note.sound = 'default';
    note.topic = topic;
    note.payload = { link: link ?? '/', type: 'notification' };
    note.contentAvailable = true;

    const tokenStrings = tokens.map((t) => t.token);
    const result = await provider.send(note, tokenStrings);

    for (const fail of result.failed) {
      const reason = (fail.response as { reason?: string } | undefined)?.reason;
      if (reason === 'BadDeviceToken' || reason === 'Unregistered') {
        await prisma.mobilePushToken.deleteMany({
          where: { token: fail.device },
        });
      }
    }
  } catch {
    // Non-blocking
  }
}
