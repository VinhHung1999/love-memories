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

export async function update(
  coupleId: string,
  name?: string,
  anniversaryDate?: string | null,
  color?: string | null,
) {
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (anniversaryDate !== undefined) {
    updateData.anniversaryDate = anniversaryDate ? new Date(anniversaryDate) : null;
  }
  if (color !== undefined) updateData.color = color;

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

// T289: lets a returning user resume their pending invite without re-creating
// the couple. PairCreate calls this on mount: 200 → render code-ready state,
// 404 → render Create CTA, 409 → user already paired (gate handles routing).
export async function getMyInvite(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coupleId: true },
  });
  if (!user) throw new AppError(404, 'User not found');
  if (!user.coupleId) throw new AppError(404, 'No pending invite', 'NO_INVITE');

  const couple = await prisma.couple.findUnique({
    where: { id: user.coupleId },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
  });
  if (!couple) throw new AppError(404, 'No pending invite', 'NO_INVITE');
  if (couple._count.users >= 2) {
    throw new AppError(409, 'Already paired', 'ALREADY_PAIRED');
  }

  return {
    inviteCode: couple.inviteCode,
    createdAt: couple.createdAt,
    couple: { id: couple.id, name: couple.name },
  };
}

export async function validateInvite(code: string) {
  const couple = await prisma.couple.findUnique({ where: { inviteCode: code } });
  if (!couple) return { valid: false, error: 'Invalid invite code' };

  const [count, partner] = await Promise.all([
    prisma.user.count({ where: { coupleId: couple.id } }),
    prisma.user.findFirst({ where: { coupleId: couple.id }, select: { name: true, avatar: true } }),
  ]);

  if (count >= 2) return { valid: false, error: 'This couple is already full' };
  return { valid: true, coupleName: couple.name, partnerName: partner?.name ?? '', partnerAvatar: partner?.avatar ?? null };
}

export async function createCouple(userId: string, name?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { coupleId: true } });
  if (!user) throw new AppError(404, 'User not found');
  if (user.coupleId) throw new AppError(400, 'You are already part of a couple');

  const inviteCode = crypto.randomBytes(4).toString('hex');
  const trimmedName = name?.trim();
  const couple = await prisma.couple.create({
    data: { name: trimmedName && trimmedName.length > 0 ? trimmedName : null, inviteCode },
  });
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { coupleId: couple.id },
    select: { id: true, email: true, name: true, avatar: true, coupleId: true, googleId: true, onboardingComplete: true },
  });
  return { ...updated, inviteCode: couple.inviteCode };
}

export async function joinCouple(userId: string, inviteCode: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { coupleId: true } });
  if (!user) throw new AppError(404, 'User not found');
  if (user.coupleId) throw new AppError(400, 'You are already part of a couple');

  const couple = await prisma.couple.findUnique({ where: { inviteCode } });
  if (!couple) throw new AppError(400, 'Invalid invite code');
  const count = await prisma.user.count({ where: { coupleId: couple.id } });
  if (count >= 2) throw new AppError(400, 'This couple already has 2 members');

  const [updated, partner] = await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: { coupleId: couple.id },
      select: { id: true, email: true, name: true, avatar: true, coupleId: true, googleId: true, onboardingComplete: true },
    }),
    prisma.user.findFirst({
      where: { coupleId: couple.id, id: { not: userId } },
      select: { name: true },
    }),
  ]);
  return { ...updated, partnerName: partner?.name ?? null };
}
