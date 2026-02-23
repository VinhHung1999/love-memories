import prisma from './prisma';
import { sendPushNotification } from '../routes/push';

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message, link: link ?? null },
    });
    // Also send push notification
    await sendPushNotification(userId, title, message, link);
  } catch {
    // Non-blocking — notification failures must not break main operations
  }
}

export async function getOtherUserId(currentUserId: string): Promise<string | null> {
  const users = await prisma.user.findMany({ select: { id: true } });
  return users.find((u) => u.id !== currentUserId)?.id ?? null;
}
