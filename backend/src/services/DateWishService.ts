import prisma from '../utils/prisma';
import { createNotification, getPartnerUserId } from '../utils/notifications';
import type { z } from 'zod';
import type { createDateWishSchema, updateDateWishSchema, markDoneSchema } from '../validators/dateWishSchemas';
import { AppError } from '../types/errors';

type CreateData = z.infer<typeof createDateWishSchema>;
type UpdateData = z.infer<typeof updateDateWishSchema>;
type DoneData = z.infer<typeof markDoneSchema>;

export async function list(coupleId: string) {
  return prisma.dateWish.findMany({ where: { coupleId }, orderBy: { createdAt: 'desc' } });
}

export async function create(coupleId: string, userId: string, data: CreateData) {
  const wish = await prisma.dateWish.create({
    data: {
      coupleId,
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      address: data.address ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      url: data.url ?? null,
      tags: data.tags ?? [],
      createdBy: userId,
    },
  });
  // Notify partner (fire-and-forget)
  const otherUserId = await getPartnerUserId(userId, coupleId);
  if (otherUserId) {
    await createNotification(otherUserId, 'new_date_wish', 'Ước muốn mới', `Có ước muốn mới: ${wish.title}`, '/date-planner');
  }
  return wish;
}

export async function update(id: string, coupleId: string, data: UpdateData) {
  const existing = await prisma.dateWish.findFirst({ where: { id, coupleId } });
  if (!existing) throw new AppError(404, 'Date wish not found');
  return prisma.dateWish.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
      ...(data.url !== undefined && { url: data.url }),
      ...(data.tags !== undefined && { tags: data.tags }),
    },
  });
}

export async function markDone(id: string, coupleId: string, data: DoneData) {
  const existing = await prisma.dateWish.findFirst({ where: { id, coupleId } });
  if (!existing) throw new AppError(404, 'Date wish not found');
  return prisma.dateWish.update({
    where: { id },
    data: {
      done: true,
      doneAt: new Date(),
      ...(data.linkedMomentId !== undefined && { linkedMomentId: data.linkedMomentId }),
      ...(data.linkedFoodSpotId !== undefined && { linkedFoodSpotId: data.linkedFoodSpotId }),
    },
  });
}

export async function remove(id: string, coupleId: string) {
  const existing = await prisma.dateWish.findFirst({ where: { id, coupleId } });
  if (!existing) throw new AppError(404, 'Date wish not found');
  await prisma.dateWish.delete({ where: { id } });
}
