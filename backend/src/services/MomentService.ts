import prisma from '../utils/prisma';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';
import { createNotification, getPartnerUserId } from '../utils/notifications';
import { AppError } from '../types/errors';

const authorSelect = { select: { id: true, name: true } } as const;

const momentIncludeFull = {
  photos: true,
  audios: { orderBy: { createdAt: 'asc' as const } },
  comments: {
    orderBy: { createdAt: 'asc' as const },
    include: { user: { select: { name: true, avatar: true } } },
  },
  reactions: { orderBy: { createdAt: 'asc' as const } },
  author: authorSelect,
};

export async function list(coupleId: string) {
  return prisma.moment.findMany({
    where: { coupleId },
    include: { photos: true, audios: true, author: authorSelect },
    orderBy: { date: 'desc' },
  });
}

export async function getOne(id: string, coupleId: string) {
  const moment = await prisma.moment.findFirst({
    where: { id, coupleId },
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
    data: { ...(data as any), coupleId, authorId: currentUserId },
    include: { photos: true, author: authorSelect },
  });
  // Notify partner (fire-and-forget after response)
  void (async () => {
    const otherUserId = await getPartnerUserId(currentUserId, coupleId);
    const author =
      (await prisma.user.findUnique({ where: { id: currentUserId }, select: { name: true } }))
        ?.name ?? 'Ai đó';
    if (otherUserId) {
      // D73 (Sprint 65 Build 95 hot-fix): conversational push copy.
      // Title leads with the actor's name + verb + emoji; body holds the
      // moment title (or caption preview if the user shipped without a
      // title and the BE auto-derived one feels generic).
      const captionPreview = momentCaptionPreview(moment.caption, moment.title);
      await createNotification(
        otherUserId,
        'new_moment',
        `${author} vừa thêm khoảnh khắc 📸`,
        captionPreview,
        `/moments/${moment.id}`,
      );
    }
  })();
  return moment;
}

// D73 — preview helper for moment captions / titles in push payloads.
// Falls back to the title when caption is empty, then to a generic
// fallback when both are empty.
function momentCaptionPreview(
  caption: string | null | undefined,
  title: string | null | undefined,
): string {
  const cap = (caption ?? '').trim();
  if (cap.length > 0) {
    return cap.length > 80 ? `${cap.slice(0, 80)}…` : cap;
  }
  const ti = (title ?? '').trim();
  if (ti.length > 0) return ti.length > 80 ? `${ti.slice(0, 80)}…` : ti;
  return 'Một khoảnh khắc mới';
}

export async function update(id: string, coupleId: string, data: Record<string, unknown>) {
  const existing = await prisma.moment.findFirst({ where: { id, coupleId } });
  if (!existing) throw new AppError(404, 'Moment not found');
  return prisma.moment.update({
    where: { id },
    data: data as object,
    include: { photos: true, author: authorSelect },
  });
}

export async function remove(id: string, coupleId: string) {
  const moment = await prisma.moment.findFirst({
    where: { id, coupleId },
    include: { photos: true, audios: true },
  });
  if (!moment) throw new AppError(404, 'Moment not found');
  await Promise.all([
    ...moment.photos.map((photo) => deleteFromCdn(photo.url)),
    ...moment.audios.map((audio) => deleteFromCdn(audio.url)),
  ]);
  await prisma.moment.delete({ where: { id } });
}

export async function uploadPhotos(momentId: string, coupleId: string, files: Express.Multer.File[]) {
  const moment = await prisma.moment.findFirst({ where: { id: momentId, coupleId } });
  if (!moment) throw new AppError(404, 'Moment not found');
  if (!files || files.length === 0) throw new AppError(400, 'No files uploaded');
  return Promise.all(
    files.map(async (file) => {
      const { filename, url } = await uploadToCdn(file.buffer, file.originalname, file.mimetype);
      return prisma.momentPhoto.create({ data: { momentId, filename, url } });
    }),
  );
}

export async function deletePhoto(photoId: string, coupleId: string) {
  const photo = await prisma.momentPhoto.findUnique({
    where: { id: photoId },
    include: { moment: { select: { coupleId: true } } },
  });
  if (!photo || photo.moment.coupleId !== coupleId) throw new AppError(404, 'Photo not found');
  await deleteFromCdn(photo.url);
  await prisma.momentPhoto.delete({ where: { id: photoId } });
}

export async function uploadAudio(
  momentId: string,
  coupleId: string,
  file: Express.Multer.File,
  duration: number | null,
) {
  const moment = await prisma.moment.findFirst({ where: { id: momentId, coupleId } });
  if (!moment) throw new AppError(404, 'Moment not found');
  const { filename, url } = await uploadToCdn(file.buffer, file.originalname, file.mimetype);
  return prisma.momentAudio.create({ data: { momentId, filename, url, duration } });
}

export async function deleteAudio(audioId: string, coupleId: string) {
  const audio = await prisma.momentAudio.findUnique({
    where: { id: audioId },
    include: { moment: { select: { coupleId: true } } },
  });
  if (!audio || audio.moment.coupleId !== coupleId) throw new AppError(404, 'Audio not found');
  await deleteFromCdn(audio.url);
  await prisma.momentAudio.delete({ where: { id: audioId } });
}

export async function listComments(momentId: string, coupleId: string) {
  const moment = await prisma.moment.findFirst({ where: { id: momentId, coupleId } });
  if (!moment) throw new AppError(404, 'Moment not found');
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
  const moment = await prisma.moment.findFirst({
    where: { id: momentId, ...(coupleId ? { coupleId } : {}) },
  });
  if (!moment) throw new AppError(404, 'Moment not found');
  const comment = await prisma.momentComment.create({
    data: { momentId, userId, author, content },
    include: { user: { select: { name: true, avatar: true } } },
  });
  // Notify partner (fire-and-forget)
  if (userId && coupleId) {
    void (async () => {
      const otherUserId = await getPartnerUserId(userId, coupleId);
      const trimmed = content.trim();
      const preview =
        trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
      if (otherUserId) {
        // D73 — conversational push copy.
        await createNotification(
          otherUserId,
          'new_comment',
          `${author} vừa bình luận 💬`,
          `"${preview}"`,
          `/moments/${momentId}`,
        );
      }
    })();
  }
  return comment;
}

export async function deleteComment(
  commentId: string,
  userId: string | null,
  coupleId: string,
) {
  const comment = await prisma.momentComment.findUnique({
    where: { id: commentId },
    include: { moment: { select: { coupleId: true } } },
  });
  if (!comment || comment.moment.coupleId !== coupleId) {
    throw new AppError(404, 'Comment not found');
  }
  // T401 — owner-only delete. Legacy comments with null userId stay
  // deletable by any couple member for backfill safety. New comments
  // always carry userId from requireAuth, so the 403 bites partners.
  if (comment.userId && comment.userId !== userId) {
    throw new AppError(403, 'Not your comment');
  }
  await prisma.momentComment.delete({ where: { id: commentId } });
}

export async function toggleReaction(
  momentId: string,
  emoji: string,
  author: string,
  userId?: string,
  coupleId?: string,
) {
  const moment = await prisma.moment.findFirst({
    where: { id: momentId, ...(coupleId ? { coupleId } : {}) },
  });
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
        // D73 — conversational push copy. Reactions don't carry a body
        // beyond the headline, so the message is empty (a single space
        // because some clients render an empty string as "(null)").
        await createNotification(
          otherUserId,
          'new_reaction',
          `${author} ${emoji} khoảnh khắc của bạn`,
          ' ',
          `/moments/${momentId}`,
        );
      }
    })();
  }

  return reactions;
}
