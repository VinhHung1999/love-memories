import prisma from '../utils/prisma';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';

const userSelect = { id: true, email: true, name: true, avatar: true };

export async function updateName(userId: string, name: string) {
  return prisma.user.update({ where: { id: userId }, data: { name }, select: userSelect });
}

export async function updateAvatar(userId: string, file: Express.Multer.File) {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } });
  if (existing?.avatar) {
    const oldFilename = existing.avatar.split('/').pop();
    if (oldFilename) await deleteFromCdn(oldFilename).catch(() => {});
  }
  const { url } = await uploadToCdn(file.buffer, file.originalname);
  return prisma.user.update({ where: { id: userId }, data: { avatar: url }, select: userSelect });
}
