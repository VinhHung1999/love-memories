import prisma from '../utils/prisma';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';
import { createNotification } from '../utils/notifications';
import { AppError } from '../types/errors';

export const mediaInclude = {
  sender: { select: { id: true, name: true, avatar: true } },
  recipient: { select: { id: true, name: true, avatar: true } },
  photos: true,
  audio: true,
} as const;

async function getPartner(
  senderId: string,
  coupleId: string,
): Promise<{ id: string; name: string } | null> {
  return prisma.user.findFirst({
    where: { coupleId, id: { not: senderId } },
    select: { id: true, name: true },
  });
}

export async function listReceived(userId: string) {
  return prisma.loveLetter.findMany({
    where: { recipientId: userId, status: { in: ['DELIVERED', 'READ'] } },
    include: mediaInclude,
    orderBy: { deliveredAt: 'desc' },
  });
}

export async function listSent(userId: string) {
  return prisma.loveLetter.findMany({
    where: { senderId: userId },
    include: mediaInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.loveLetter.count({
    where: { recipientId: userId, status: 'DELIVERED' },
  });
}

export async function getOne(id: string, userId: string) {
  const letter = await prisma.loveLetter.findUnique({ where: { id }, include: mediaInclude });
  if (!letter) throw new AppError(404, 'Letter not found');

  if (letter.senderId !== userId && letter.recipientId !== userId) {
    throw new AppError(403, 'Forbidden');
  }

  // Recipients cannot see DRAFT/SCHEDULED (surprise!)
  if (
    letter.recipientId === userId &&
    (letter.status === 'DRAFT' || letter.status === 'SCHEDULED')
  ) {
    throw new AppError(404, 'Letter not found');
  }

  // Auto-mark READ if recipient and DELIVERED
  if (letter.recipientId === userId && letter.status === 'DELIVERED') {
    return prisma.loveLetter.update({
      where: { id: letter.id },
      data: { status: 'READ', readAt: new Date() },
      include: mediaInclude,
    });
  }

  return letter;
}

export async function create(
  userId: string,
  coupleId: string,
  data: {
    title: string;
    content: string;
    mood?: string;
    scheduledAt?: string;
    sendNow?: boolean;
  },
) {
  const partner = await getPartner(userId, coupleId);
  if (!partner) throw new AppError(400, 'No partner found');

  let status: 'DRAFT' | 'SCHEDULED' | 'DELIVERED' = 'DRAFT';
  let deliveredAt: Date | undefined;
  let scheduledAt: Date | undefined;

  if (data.sendNow) {
    status = 'DELIVERED';
    deliveredAt = new Date();
  } else if (data.scheduledAt) {
    const scheduled = new Date(data.scheduledAt);
    if (scheduled <= new Date()) {
      status = 'DELIVERED';
      deliveredAt = new Date();
    } else {
      status = 'SCHEDULED';
      scheduledAt = scheduled;
    }
  }

  const letter = await prisma.loveLetter.create({
    data: {
      coupleId,
      senderId: userId,
      recipientId: partner.id,
      title: data.title,
      content: data.content,
      mood: data.mood,
      status,
      scheduledAt: scheduledAt ?? null,
      deliveredAt: deliveredAt ?? null,
    },
    include: mediaInclude,
  });

  if (status === 'DELIVERED') {
    const senderUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    await createNotification(
      partner.id,
      'love_letter',
      `Thư tình mới từ ${senderUser?.name ?? 'người ấy'} 💌`,
      data.title,
      '/love-letters',
    ).catch(() => {});
  }

  return letter;
}

export async function update(
  id: string,
  userId: string,
  coupleId: string,
  data: {
    title?: string;
    content?: string;
    mood?: string;
    scheduledAt?: string | null;
  },
) {
  const letter = await prisma.loveLetter.findFirst({ where: { id, coupleId } });
  if (!letter) throw new AppError(404, 'Letter not found');
  if (letter.senderId !== userId) throw new AppError(404, 'Letter not found');
  if (letter.status !== 'DRAFT' && letter.status !== 'SCHEDULED') {
    throw new AppError(400, 'Only DRAFT or SCHEDULED letters can be edited');
  }

  const scheduledAt =
    data.scheduledAt !== undefined
      ? data.scheduledAt
        ? new Date(data.scheduledAt)
        : null
      : undefined;

  const newStatus = scheduledAt
    ? 'SCHEDULED'
    : letter.status === 'SCHEDULED'
      ? 'DRAFT'
      : letter.status;

  return prisma.loveLetter.update({
    where: { id: letter.id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.content && { content: data.content }),
      ...(data.mood !== undefined && { mood: data.mood }),
      ...(scheduledAt !== undefined && { scheduledAt }),
      status: newStatus as 'DRAFT' | 'SCHEDULED',
    },
    include: mediaInclude,
  });
}

export async function send(id: string, userId: string, coupleId: string) {
  const letter = await prisma.loveLetter.findFirst({ where: { id, coupleId } });
  if (!letter) throw new AppError(404, 'Letter not found');
  if (letter.senderId !== userId) throw new AppError(404, 'Letter not found');
  if (letter.status !== 'DRAFT' && letter.status !== 'SCHEDULED') {
    throw new AppError(400, 'Letter already sent');
  }

  const updated = await prisma.loveLetter.update({
    where: { id: letter.id },
    data: { status: 'DELIVERED', deliveredAt: new Date(), scheduledAt: null },
    include: mediaInclude,
  });

  const senderUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  await createNotification(
    letter.recipientId,
    'love_letter',
    `Thư tình mới từ ${senderUser?.name ?? 'người ấy'} 💌`,
    letter.title,
    '/love-letters',
  ).catch(() => {});

  return updated;
}

export async function remove(id: string, userId: string, coupleId: string) {
  const letter = await prisma.loveLetter.findFirst({ where: { id, coupleId } });
  if (!letter) throw new AppError(404, 'Letter not found');
  if (letter.senderId !== userId) throw new AppError(404, 'Letter not found');
  if (letter.status !== 'DRAFT' && letter.status !== 'SCHEDULED') {
    throw new AppError(400, 'Only DRAFT or SCHEDULED letters can be deleted');
  }
  await prisma.loveLetter.delete({ where: { id: letter.id } });
}

export async function uploadPhotos(
  id: string,
  userId: string,
  coupleId: string,
  files: Express.Multer.File[],
) {
  const letter = await prisma.loveLetter.findFirst({
    where: { id, coupleId },
    include: { photos: true },
  });
  if (!letter) throw new AppError(404, 'Letter not found');
  if (letter.senderId !== userId) throw new AppError(404, 'Letter not found');
  if (!files || files.length === 0) throw new AppError(400, 'No photos uploaded');
  if (letter.photos.length + files.length > 5) {
    throw new AppError(
      400,
      `Max 5 photos per letter. Currently has ${letter.photos.length}.`,
    );
  }

  return Promise.all(
    files.map(async (file) => {
      const { filename, url } = await uploadToCdn(file.buffer, file.originalname, file.mimetype);
      return prisma.letterPhoto.create({ data: { letterId: letter.id, filename, url } });
    }),
  );
}

export async function deletePhoto(id: string, userId: string, coupleId: string, photoId: string) {
  const letter = await prisma.loveLetter.findFirst({ where: { id, coupleId } });
  if (!letter) throw new AppError(404, 'Letter not found');
  if (letter.senderId !== userId) throw new AppError(404, 'Letter not found');
  if (letter.status !== 'DRAFT' && letter.status !== 'SCHEDULED') {
    throw new AppError(400, 'Only DRAFT or SCHEDULED letters can have photos removed');
  }

  const photo = await prisma.letterPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.letterId !== id) throw new AppError(404, 'Photo not found');

  await deleteFromCdn(photo.url);
  await prisma.letterPhoto.delete({ where: { id: photo.id } });
}

export async function uploadAudio(
  id: string,
  userId: string,
  coupleId: string,
  file: Express.Multer.File,
  duration?: number,
) {
  const letter = await prisma.loveLetter.findFirst({
    where: { id, coupleId },
    include: { audio: true },
  });
  if (!letter) throw new AppError(404, 'Letter not found');
  if (letter.senderId !== userId) throw new AppError(404, 'Letter not found');
  if (letter.audio.length > 0) {
    throw new AppError(400, 'Letter already has a voice memo. Delete it first.');
  }

  const { filename, url } = await uploadToCdn(file.buffer, file.originalname, file.mimetype);
  return prisma.letterAudio.create({
    data: { letterId: letter.id, filename, url, duration: duration ?? null },
  });
}

export async function deleteAudio(id: string, userId: string, coupleId: string, audioId: string) {
  const letter = await prisma.loveLetter.findFirst({ where: { id, coupleId } });
  if (!letter) throw new AppError(404, 'Letter not found');
  if (letter.senderId !== userId) throw new AppError(404, 'Letter not found');
  if (letter.status !== 'DRAFT' && letter.status !== 'SCHEDULED') {
    throw new AppError(400, 'Only DRAFT or SCHEDULED letters can have audio removed');
  }

  const audio = await prisma.letterAudio.findUnique({ where: { id: audioId } });
  if (!audio || audio.letterId !== id) throw new AppError(404, 'Audio not found');

  await deleteFromCdn(audio.url);
  await prisma.letterAudio.delete({ where: { id: audio.id } });
}
