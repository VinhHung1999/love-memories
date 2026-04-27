import prisma from './prisma';
import { sendPushNotification, sendMobilePushNotification } from '../services/PushService';

// Note: Notification — Central function to create an in-app notification AND
// dispatch push to ALL channels: Web Push (PWA) + FCM (mobile iOS/Android).
// This is non-blocking: errors are caught silently so the main operation
// (creating a moment, recipe, etc.) is never affected by notification failures.
// Sprint 67 hot-fix — structured logging across the notification path
// (DB insert + web push + mobile push) for prod observability. Outer
// catch keeps the silent-fail guarantee for callers, but the error is
// now logged before being swallowed.
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
): Promise<void> {
  console.log(
    '[NOTI] start',
    JSON.stringify({
      userId,
      type,
      titlePreview: title.slice(0, 40),
      link: link ?? null,
    }),
  );
  try {
    // Note: Notification — Save to database (appears in NotificationsScreen)
    const created = await prisma.notification.create({
      data: { userId, type, title, message, link: link ?? null },
    });
    console.log(
      '[NOTI] db_inserted',
      JSON.stringify({ notificationId: created.id, userId, type }),
    );
    // Note: Notification — Send to Web Push (browser/PWA) + APNs (mobile) in parallel
    await Promise.allSettled([
      sendPushNotification(userId, title, message, link),
      sendMobilePushNotification(userId, title, message, link),
    ]);
  } catch (e) {
    console.error(
      '[NOTI] error',
      JSON.stringify({
        userId,
        type,
        message: (e as Error).message,
        stack: (e as Error).stack?.split('\n').slice(0, 4).join(' | '),
      }),
    );
  }
}

export async function getPartnerUserId(currentUserId: string, coupleId: string): Promise<string | null> {
  const partner = await prisma.user.findFirst({
    where: { coupleId, id: { not: currentUserId } },
    select: { id: true },
  });
  return partner?.id ?? null;
}
