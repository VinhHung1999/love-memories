import prisma from '../utils/prisma';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';
import { createNotification, getPartnerUserId } from '../utils/notifications';
import { AppError } from '../types/errors';

export const sessionInclude = {
  recipes: {
    include: { recipe: { include: { photos: true } } },
    orderBy: { order: 'asc' as const },
  },
  items: { orderBy: { ingredient: 'asc' as const } },
  steps: { orderBy: [{ recipeId: 'asc' as const }, { stepIndex: 'asc' as const }] },
  photos: { orderBy: { createdAt: 'asc' as const } },
};

export async function getActive(coupleId: string) {
  return prisma.cookingSession.findFirst({
    where: { coupleId, status: { not: 'completed' } },
    include: sessionInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function list(coupleId: string) {
  return prisma.cookingSession.findMany({
    where: { coupleId },
    include: sessionInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOne(id: string) {
  const session = await prisma.cookingSession.findUnique({ where: { id }, include: sessionInclude });
  if (!session) throw new AppError(404, 'Session not found');
  return session;
}

export async function create(coupleId: string, recipeIds: string[]) {
  // Guard: reject if an active session already exists
  const existing = await prisma.cookingSession.findFirst({
    where: { coupleId, status: { not: 'completed' } },
  });
  if (existing) {
    throw new AppError(409, 'An active session already exists');
  }

  // Fetch recipes in order
  const recipes = await Promise.all(
    recipeIds.map((id, idx) =>
      prisma.recipe.findUnique({ where: { id } }).then((r) => ({ recipe: r, order: idx })),
    ),
  );

  const missing = recipes.find(({ recipe }) => !recipe);
  if (missing) throw new AppError(404, 'One or more recipes not found');

  // Merge shopping items — unique by ingredient string (case-insensitive dedup), carry price
  const seen = new Set<string>();
  const uniqueItems: { ingredient: string; price: number | null }[] = [];
  for (const { recipe } of recipes) {
    recipe!.ingredients.forEach((ing, idx) => {
      const key = ing.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push({ ingredient: ing.trim(), price: recipe!.ingredientPrices[idx] ?? null });
      }
    });
  }

  return prisma.cookingSession.create({
    data: {
      coupleId,
      status: 'selecting',
      recipes: {
        create: recipes.map(({ recipe, order }) => ({ recipeId: recipe!.id, order })),
      },
      items: { create: uniqueItems.map(({ ingredient, price }) => ({ ingredient, price })) },
      steps: {
        create: recipes.flatMap(({ recipe }) =>
          recipe!.steps.map((content, stepIndex) => ({
            recipeId: recipe!.id,
            stepIndex,
            content,
            durationSeconds: recipe!.stepDurations[stepIndex] ?? null,
          })),
        ),
      },
    },
    include: sessionInclude,
  });
}

export async function updateStatus(
  id: string,
  data: { status: string; notes?: string },
  userId?: string,
  coupleId?: string,
) {
  const updateData: Record<string, unknown> = { status: data.status };

  if (data.status === 'cooking') updateData.startedAt = new Date();
  if (data.status === 'completed') {
    updateData.completedAt = new Date();
    const session = await prisma.cookingSession.findUnique({ where: { id } });
    if (session?.startedAt) {
      updateData.totalTimeMs = Date.now() - session.startedAt.getTime();
    }
  }
  if (data.notes !== undefined) updateData.notes = data.notes;

  const session = await prisma.cookingSession.update({
    where: { id },
    data: updateData,
    include: sessionInclude,
  });

  // Notify other user when session completed (fire-and-forget)
  if (data.status === 'completed' && userId && coupleId) {
    void (async () => {
      const otherUserId = await getPartnerUserId(userId, coupleId);
      if (otherUserId) {
        await createNotification(
          otherUserId,
          'cooking_completed',
          'Nấu xong!',
          'Phiên nấu ăn hoàn thành!',
          '/what-to-eat',
        );
      }
    })();
  }

  return session;
}

export async function toggleItem(itemId: string, checked: boolean) {
  return prisma.cookingSessionItem.update({
    where: { id: itemId },
    data: { checked, checkedAt: checked ? new Date() : null },
  });
}

export async function toggleStep(itemId: string, checked: boolean, checkedBy?: string) {
  return prisma.cookingSessionStep.update({
    where: { id: itemId },
    data: {
      checked,
      checkedBy: checked ? (checkedBy ?? null) : null,
      checkedAt: checked ? new Date() : null,
    },
  });
}

export async function uploadPhotos(sessionId: string, files: Express.Multer.File[]) {
  const session = await prisma.cookingSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new AppError(404, 'Session not found');
  if (!files || files.length === 0) throw new AppError(400, 'No files uploaded');
  return Promise.all(
    files.map(async (file) => {
      const { filename, url } = await uploadToCdn(file.buffer, file.originalname);
      return prisma.cookingSessionPhoto.create({ data: { sessionId, filename, url } });
    }),
  );
}

export async function rate(id: string, rating: number) {
  return prisma.cookingSession.update({
    where: { id },
    data: { rating },
    include: sessionInclude,
  });
}

export async function remove(id: string) {
  const session = await prisma.cookingSession.findUnique({
    where: { id },
    include: { photos: true },
  });
  if (!session) throw new AppError(404, 'Session not found');
  await Promise.all(session.photos.map((p) => deleteFromCdn(p.filename)));
  await prisma.cookingSession.delete({ where: { id } });
}
