import crypto from 'crypto';
import prisma from '../utils/prisma';
import { AppError } from '../types/errors';

const coupleInclude = {
  users: { select: { id: true, name: true, email: true, avatar: true } },
};

export async function getCouple(coupleId: string) {
  const couple = await prisma.couple.findUnique({ where: { id: coupleId }, include: coupleInclude });
  if (!couple) throw new AppError(404, 'Couple not found');
  return couple;
}

export async function update(coupleId: string, name?: string, anniversaryDate?: string | null) {
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (anniversaryDate !== undefined) {
    updateData.anniversaryDate = anniversaryDate ? new Date(anniversaryDate) : null;
  }

  const couple = await prisma.couple.update({
    where: { id: coupleId },
    data: updateData,
    include: coupleInclude,
  });

  if (anniversaryDate !== undefined) {
    const value = anniversaryDate || '';
    await prisma.appSetting.upsert({
      where: { key_coupleId: { key: 'relationship-start-date', coupleId } },
      update: { value },
      create: { key: 'relationship-start-date', coupleId, value },
    });
  }

  return couple;
}

export async function generateInvite(coupleId: string) {
  const inviteCode = crypto.randomBytes(4).toString('hex');
  await prisma.couple.update({ where: { id: coupleId }, data: { inviteCode } });
  return { inviteCode };
}
