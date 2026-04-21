import prisma from '../utils/prisma';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';

const userSelect = { id: true, email: true, name: true, avatar: true };

export async function updateName(userId: string, name: string) {
  return prisma.user.update({ where: { id: userId }, data: { name }, select: userSelect });
}

export async function updateAvatar(userId: string, file: Express.Multer.File) {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } });
  if (existing?.avatar) {
    await deleteFromCdn(existing.avatar).catch(() => {});
  }
  const { url } = await uploadToCdn(file.buffer, file.originalname, file.mimetype);
  return prisma.user.update({ where: { id: userId }, data: { avatar: url }, select: userSelect });
}

export async function getStats(coupleId: string) {
  // Letters: DELIVERED + READ only — drafts aren't "shared yet" (matches RecapService pattern).
  // Questions: distinct questionIds where at least one partner answered. Unique index is
  // [questionId, coupleId, userId] so a single question answered by both partners must only
  // count once — groupBy collapses the two rows.
  const [moments, letters, answeredGroups] = await Promise.all([
    prisma.moment.count({ where: { coupleId } }),
    prisma.loveLetter.count({ where: { coupleId, status: { in: ['DELIVERED', 'READ'] } } }),
    prisma.dailyQuestionResponse.groupBy({ by: ['questionId'], where: { coupleId } }),
  ]);

  return { moments, letters, questions: answeredGroups.length };
}
