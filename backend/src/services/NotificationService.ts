import prisma from '../utils/prisma';
import { AppError } from '../types/errors';

export async function list(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function unreadCount(userId: string) {
  const count = await prisma.notification.count({ where: { userId, read: false } });
  return { count };
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  return { ok: true };
}

export async function markRead(id: string) {
  try {
    return await prisma.notification.update({ where: { id }, data: { read: true } });
  } catch {
    throw new AppError(404, 'Notification not found');
  }
}

export async function remove(id: string) {
  try {
    await prisma.notification.delete({ where: { id } });
  } catch {
    throw new AppError(404, 'Notification not found');
  }
}
