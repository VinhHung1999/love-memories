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
//
// Sprint 67 hot-fix — structured logging for prod debug. All log lines
// JSON-stringified for greppable pm2 output. Behaviour unchanged; only
// observability added.
export async function sendPushNotification(userId: string, title: string, body: string, link?: string): Promise<void> {
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    console.log(
      '[PUSH-WEB] start',
      JSON.stringify({ userId, subCount: subs.length, link: link ?? '/' }),
    );
    if (subs.length === 0) {
      console.log('[PUSH-WEB] result', JSON.stringify({ userId, subCount: 0 }));
      return;
    }
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: link ?? '/' },
    });
    let sent = 0;
    let removed410 = 0;
    const failures: { endpointHost: string; status?: number; message?: string }[] = [];
    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
          sent += 1;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          const message = (err as Error).message;
          let host = '?';
          try {
            host = new URL(sub.endpoint).host;
          } catch {
            /* ignore parse */
          }
          failures.push({ endpointHost: host, status, message });
          if (status === 410) {
            await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
            removed410 += 1;
          }
        }
      }),
    );
    console.log(
      '[PUSH-WEB] result',
      JSON.stringify({ userId, subCount: subs.length, sent, removed410, failures }),
    );
  } catch (e) {
    console.error(
      '[PUSH-WEB] error',
      JSON.stringify({
        userId,
        message: (e as Error).message,
        stack: (e as Error).stack?.split('\n').slice(0, 4).join(' | '),
      }),
    );
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
    const topic = process.env.APNS_BUNDLE_ID;
    if (!provider) {
      console.log(
        '[PUSH-MOBILE] start',
        JSON.stringify({ userId, skipped: 'no_provider' }),
      );
      return;
    }
    if (!topic) {
      console.log(
        '[PUSH-MOBILE] start',
        JSON.stringify({ userId, skipped: 'no_topic' }),
      );
      return;
    }

    const tokens = await prisma.mobilePushToken.findMany({ where: { userId } });
    console.log(
      '[PUSH-MOBILE] start',
      JSON.stringify({
        userId,
        topic,
        prod: process.env.APNS_PRODUCTION,
        tokenCount: tokens.length,
        link: link ?? '/',
      }),
    );
    if (tokens.length === 0) {
      console.log(
        '[PUSH-MOBILE] result',
        JSON.stringify({ userId, sent: 0, failed: 0, prunedZombies: 0 }),
      );
      return;
    }

    const note = new apn.Notification();
    note.alert = { title, body };
    note.sound = 'default';
    note.topic = topic;
    note.payload = { link: link ?? '/', type: 'notification' };
    note.contentAvailable = true;

    const tokenStrings = tokens.map((t) => t.token);
    const result = await provider.send(note, tokenStrings);

    let prunedZombies = 0;
    for (const fail of result.failed) {
      const reason = (fail.response as { reason?: string } | undefined)?.reason;
      if (reason === 'BadDeviceToken' || reason === 'Unregistered') {
        await prisma.mobilePushToken.deleteMany({
          where: { token: fail.device },
        });
        prunedZombies += 1;
      }
    }

    console.log(
      '[PUSH-MOBILE] result',
      JSON.stringify({
        userId,
        sent: result.sent.length,
        failed: result.failed.length,
        prunedZombies,
        sentDevices: result.sent.map((s) => s.device.slice(0, 16)),
        failures: result.failed.map((f) => ({
          device: f.device.slice(0, 16),
          status: f.status,
          reason: (f.response as { reason?: string } | undefined)?.reason,
          error: (f as { error?: { message?: string } }).error?.message,
        })),
      }),
    );
  } catch (e) {
    console.error(
      '[PUSH-MOBILE] error',
      JSON.stringify({
        userId,
        message: (e as Error).message,
        stack: (e as Error).stack?.split('\n').slice(0, 6).join(' | '),
      }),
    );
  }
}
