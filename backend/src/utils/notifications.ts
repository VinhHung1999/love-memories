import prisma from './prisma';
import { sendPushNotification, sendMobilePushNotification } from '../routes/push';

// Note: Notification — Central function to create an in-app notification AND
// dispatch push to ALL channels: Web Push (PWA) + FCM (mobile iOS/Android).
// This is non-blocking: errors are caught silently so the main operation
// (creating a moment, recipe, etc.) is never affected by notification failures.
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
): Promise<void> {
  try {
    // Note: Notification — Save to database (appears in NotificationsScreen)
    await prisma.notification.create({
      data: { userId, type, title, message, link: link ?? null },
    });
    // Note: Notification — Send to Web Push (browser/PWA) + FCM (mobile) in parallel
    await Promise.allSettled([
      sendPushNotification(userId, title, message, link),
      sendMobilePushNotification(userId, title, message, link),
    ]);
  } catch {
    // Non-blocking — notification failures must not break main operations
  }
}

export async function getPartnerUserId(currentUserId: string, coupleId: string): Promise<string | null> {
  const partner = await prisma.user.findFirst({
    where: { coupleId, id: { not: currentUserId } },
    select: { id: true },
  });
  return partner?.id ?? null;
}
