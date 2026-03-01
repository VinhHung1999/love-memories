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

export async function getPartnerUserId(currentUserId: string, coupleId: string): Promise<string | null> {
  const partner = await prisma.user.findFirst({
    where: { coupleId, id: { not: currentUserId } },
    select: { id: true },
  });
  return partner?.id ?? null;
}
