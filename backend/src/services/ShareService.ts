import crypto from 'crypto';
import prisma from '../utils/prisma';
import { AppError } from '../types/errors';

const CDN_BASE_URL = process.env.CDN_BASE_URL;
const VALID_TYPES = ['moment', 'letter', 'recipe'];

export async function create(type: string, targetId: string, coupleId: string) {
  if (!type || !targetId || !VALID_TYPES.includes(type)) {
    throw new AppError(400, 'type (moment|letter|recipe) and targetId required');
  }

  if (type === 'moment') {
    const item = await prisma.moment.findFirst({ where: { id: targetId, coupleId } });
    if (!item) throw new AppError(404, 'Moment not found');
  } else if (type === 'letter') {
    const item = await prisma.loveLetter.findFirst({ where: { id: targetId, coupleId } });
    if (!item) throw new AppError(404, 'Letter not found');
    if (item.status === 'DRAFT' || item.status === 'SCHEDULED') {
      throw new AppError(400, 'Only DELIVERED or READ letters can be shared');
    }
  } else if (type === 'recipe') {
    const item = await prisma.recipe.findFirst({ where: { id: targetId, coupleId } });
    if (!item) throw new AppError(404, 'Recipe not found');
  }

  const token = crypto.randomBytes(32).toString('hex');
  return prisma.shareLink.create({ data: { token, type, targetId, coupleId } });
}

export async function list(coupleId: string) {
  return prisma.shareLink.findMany({
    where: { coupleId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function revoke(token: string, coupleId: string) {
  const link = await prisma.shareLink.findUnique({ where: { token } });
  if (!link || link.coupleId !== coupleId) throw new AppError(404, 'Share link not found');
  await prisma.shareLink.delete({ where: { id: link.id } });
}

export async function getToken(token: string) {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: { couple: { select: { name: true } } },
  });
  if (!link) throw new AppError(404, 'Share link not found');
  if (link.expiresAt && link.expiresAt < new Date()) throw new AppError(410, 'Share link expired');

  await prisma.shareLink.update({ where: { id: link.id }, data: { viewCount: { increment: 1 } } });

  let data: unknown = null;
  if (link.type === 'moment') {
    data = await prisma.moment.findUnique({
      where: { id: link.targetId },
      include: { photos: true, audios: true },
    });
  } else if (link.type === 'letter') {
    data = await prisma.loveLetter.findUnique({
      where: { id: link.targetId },
      include: { photos: true, audio: true, sender: { select: { name: true } } },
    });
  } else if (link.type === 'recipe') {
    data = await prisma.recipe.findUnique({
      where: { id: link.targetId },
      include: { photos: true },
    });
  }

  if (!data) throw new AppError(404, 'Shared item not found');

  return { type: link.type, data, coupleName: link.couple.name, sharedAt: link.createdAt };
}

export async function getTokenImage(token: string, url: string) {
  const link = await prisma.shareLink.findUnique({ where: { token } });
  if (!link) throw new AppError(404, 'Share link not found');
  if (link.expiresAt && link.expiresAt < new Date()) throw new AppError(410, 'Share link expired');
  if (typeof url !== 'string' || (CDN_BASE_URL && !url.startsWith(CDN_BASE_URL))) {
    throw new AppError(400, 'Invalid or disallowed url');
  }
  return url;
}
