import prisma from '../utils/prisma';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';
import { createNotification, getPartnerUserId } from '../utils/notifications';
import { AppError } from '../types/errors';
import type { z } from 'zod';
import type { createRecipeSchema, updateRecipeSchema } from '../validators/recipeSchemas';

type CreateData = z.infer<typeof createRecipeSchema>;
type UpdateData = z.infer<typeof updateRecipeSchema>;

const recipeInclude = { photos: true, foodSpot: { select: { id: true, name: true } } };

export async function list(coupleId: string) {
  return prisma.recipe.findMany({ where: { coupleId }, include: recipeInclude, orderBy: { createdAt: 'desc' } });
}

export async function getOne(id: string, coupleId: string) {
  const recipe = await prisma.recipe.findFirst({ where: { id, coupleId }, include: recipeInclude });
  if (!recipe) throw new AppError(404, 'Recipe not found');
  return recipe;
}

export async function create(coupleId: string, userId: string, data: CreateData) {
  const recipe = await prisma.recipe.create({ data: { ...data, coupleId }, include: recipeInclude });
  // Notify partner (fire-and-forget)
  const otherUserId = await getPartnerUserId(userId, coupleId);
  const author = (await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name ?? 'Ai đó';
  if (otherUserId) {
    await createNotification(otherUserId, 'new_recipe', 'Công thức mới', `${author} thêm công thức: ${recipe.title}`, '/recipes');
  }
  return recipe;
}

export async function update(id: string, coupleId: string, data: UpdateData) {
  const existing = await prisma.recipe.findFirst({ where: { id, coupleId } });
  if (!existing) throw new AppError(404, 'Recipe not found');
  return prisma.recipe.update({ where: { id }, data, include: recipeInclude });
}

export async function remove(id: string, coupleId: string) {
  const recipe = await prisma.recipe.findFirst({ where: { id, coupleId }, include: { photos: true } });
  if (!recipe) throw new AppError(404, 'Recipe not found');
  await Promise.all(recipe.photos.map((p) => deleteFromCdn(p.url)));
  await prisma.recipe.delete({ where: { id } });
}

export async function addPhotos(id: string, coupleId: string, files: Express.Multer.File[]) {
  if (!files || files.length === 0) throw new AppError(400, 'No files uploaded');
  const recipe = await prisma.recipe.findFirst({ where: { id, coupleId } });
  if (!recipe) throw new AppError(404, 'Recipe not found');
  return Promise.all(
    files.map(async (file) => {
      const { filename, url } = await uploadToCdn(file.buffer, file.originalname, file.mimetype);
      return prisma.recipePhoto.create({ data: { recipeId: id, filename, url } });
    })
  );
}

export async function deletePhoto(photoId: string, coupleId: string) {
  const photo = await prisma.recipePhoto.findUnique({
    where: { id: photoId },
    include: { recipe: { select: { coupleId: true } } },
  });
  if (!photo || photo.recipe.coupleId !== coupleId) throw new AppError(404, 'Photo not found');
  await deleteFromCdn(photo.url);
  await prisma.recipePhoto.delete({ where: { id: photoId } });
}
