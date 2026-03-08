import prisma from '../utils/prisma';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';
import { createNotification, getPartnerUserId } from '../utils/notifications';
import { AppError } from '../types/errors';

const momentIncludeFull = {
  photos: true,
  audios: { orderBy: { createdAt: 'asc' as const } },
  comments: {
    orderBy: { createdAt: 'asc' as const },
    include: { user: { select: { name: true, avatar: true } } },
  },
  reactions: { orderBy: { createdAt: 'asc' as const } },
};

export async function list(coupleId: string) {
  return prisma.moment.findMany({
    where: { coupleId },
    include: { photos: true, audios: true },
    orderBy: { date: 'desc' },
  });
}

export async function getOne(id: string) {
  const moment = await prisma.moment.findUnique({
    where: { id },
    include: momentIncludeFull,
  });
  if (!moment) throw new AppError(404, 'Moment not found');
  return moment;
}

export async function create(
  coupleId: string,
  currentUserId: string,
  data: Record<string, unknown>,
) {
  const moment = await prisma.moment.create({
    data: { ...(data as any), coupleId },
    include: { photos: true },
  });
  // Notify partner (fire-and-forget after response)
  void (async () => {
    const otherUserId = await getPartnerUserId(currentUserId, coupleId);
    const author =
      (await prisma.user.findUnique({ where: { id: currentUserId }, select: { name: true } }))
        ?.name ?? 'Ai đó';
    if (otherUserId) {
      await createNotification(
        otherUserId,
        'new_moment',
        'Kỷ niệm mới',
        `${author} đã thêm kỷ niệm: ${moment.title}`,
        `/moments/${moment.id}`,
      );
    }
  })();
  return moment;
}

export async function update(id: string, data: Record<string, unknown>) {
  return prisma.moment.update({
    where: { id },
    data: data as object,
    include: { photos: true },
  });
}

export async function remove(id: string) {
  const moment = await prisma.moment.findUnique({
    where: { id },
    include: { photos: true, audios: true },
  });
  if (!moment) throw new AppError(404, 'Moment not found');
  await Promise.all([
    ...moment.photos.map((photo) => deleteFromCdn(photo.url)),
    ...moment.audios.map((audio) => deleteFromCdn(audio.url)),
  ]);
  await prisma.moment.delete({ where: { id } });
}

export async function uploadPhotos(momentId: string, files: Express.Multer.File[]) {
  const moment = await prisma.moment.findUnique({ where: { id: momentId } });
  if (!moment) throw new AppError(404, 'Moment not found');
  if (!files || files.length === 0) throw new AppError(400, 'No files uploaded');
  return Promise.all(
    files.map(async (file) => {
      const { filename, url } = await uploadToCdn(file.buffer, file.originalname, file.mimetype);
      return prisma.momentPhoto.create({ data: { momentId, filename, url } });
    }),
  );
}

export async function deletePhoto(photoId: string) {
  const photo = await prisma.momentPhoto.findUnique({ where: { id: photoId } });
  if (!photo) throw new AppError(404, 'Photo not found');
  await deleteFromCdn(photo.url);
  await prisma.momentPhoto.delete({ where: { id: photoId } });
}

export async function uploadAudio(
  momentId: string,
  file: Express.Multer.File,
  duration: number | null,
) {
  const moment = await prisma.moment.findUnique({ where: { id: momentId } });
  if (!moment) throw new AppError(404, 'Moment not found');
  const { filename, url } = await uploadToCdn(file.buffer, file.originalname, file.mimetype);
  return prisma.momentAudio.create({ data: { momentId, filename, url, duration } });
}

export async function deleteAudio(audioId: string) {
  const audio = await prisma.momentAudio.findUnique({ where: { id: audioId } });
  if (!audio) throw new AppError(404, 'Audio not found');
  await deleteFromCdn(audio.url);
  await prisma.momentAudio.delete({ where: { id: audioId } });
}

export async function listComments(momentId: string) {
  return prisma.momentComment.findMany({
    where: { momentId },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { name: true, avatar: true } } },
  });
}

export async function addComment(
  momentId: string,
  userId: string | null,
  coupleId: string | null,
  author: string,
  content: string,
) {
  const moment = await prisma.moment.findUnique({ where: { id: momentId } });
  if (!moment) throw new AppError(404, 'Moment not found');
  const comment = await prisma.momentComment.create({
    data: { momentId, userId, author, content },
    include: { user: { select: { name: true, avatar: true } } },
  });
  // Notify partner (fire-and-forget)
  if (userId && coupleId) {
    void (async () => {
      const otherUserId = await getPartnerUserId(userId, coupleId);
      const preview = content.length > 50 ? `${content.slice(0, 50)}…` : content;
      if (otherUserId) {
        await createNotification(
          otherUserId,
          'new_comment',
          'Bình luận mới',
          `${author} bình luận: ${preview}`,
          `/moments/${momentId}`,
        );
      }
    })();
  }
  return comment;
}

export async function deleteComment(commentId: string) {
  await prisma.momentComment.delete({ where: { id: commentId } });
}

export async function toggleReaction(
  momentId: string,
  emoji: string,
  author: string,
  userId?: string,
  coupleId?: string,
) {
  const moment = await prisma.moment.findUnique({ where: { id: momentId } });
  if (!moment) throw new AppError(404, 'Moment not found');

  const existing = await prisma.momentReaction.findUnique({
    where: { momentId_emoji_author: { momentId, emoji, author } },
  });

  const isAdding = !existing;
  if (existing) {
    await prisma.momentReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.momentReaction.create({ data: { momentId, emoji, author } });
  }

  const reactions = await prisma.momentReaction.findMany({
    where: { momentId },
    orderBy: { createdAt: 'asc' },
  });

  // Notify other user only when adding (not removing) a reaction
  if (isAdding && userId && coupleId) {
    void (async () => {
      const otherUserId = await getPartnerUserId(userId, coupleId);
      if (otherUserId) {
        await createNotification(
          otherUserId,
          'new_reaction',
          'Cảm xúc mới',
          `${author} đã ${emoji} kỷ niệm của bạn`,
          `/moments/${momentId}`,
        );
      }
    })();
  }

  return reactions;
}
