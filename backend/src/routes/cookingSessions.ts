import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { upload } from '../middleware/upload';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';
import type { AuthRequest } from '../middleware/auth';
import { createNotification, getPartnerUserId } from '../utils/notifications';
import {
  createCookingSessionSchema,
  updateCookingSessionStatusSchema,
  toggleCookingItemSchema,
  toggleCookingStepSchema,
  ratingSchema,
} from '../utils/validation';

const router = Router();

type IdParam = { id: string };
type ItemParam = { id: string; itemId: string };
type StepParam = { id: string; stepId: string };

const sessionInclude = {
  recipes: {
    include: { recipe: { include: { photos: true } } },
    orderBy: { order: 'asc' as const },
  },
  items: { orderBy: { ingredient: 'asc' as const } },
  steps: { orderBy: [{ recipeId: 'asc' as const }, { stepIndex: 'asc' as const }] },
  photos: { orderBy: { createdAt: 'asc' as const } },
};

// GET /active — MUST be before /:id
router.get('/active', async (req: Request, res: Response) => {
  try {
    const { coupleId } = (req as AuthRequest).user!;
    const session = await prisma.cookingSession.findFirst({
      where: { coupleId, status: { not: 'completed' } },
      include: sessionInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(session ?? null);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch active session' });
  }
});

// GET all sessions (history)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { coupleId } = (req as AuthRequest).user!;
    const sessions = await prisma.cookingSession.findMany({
      where: { coupleId },
      include: sessionInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(sessions);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET single session
router.get('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const session = await prisma.cookingSession.findUnique({
      where: { id: req.params.id },
      include: sessionInclude,
    });
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
    res.json(session);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// POST create session — auto-generate shopping items + steps from selected recipes
router.post('/', async (req: Request, res: Response) => {
  try {
    const { recipeIds } = createCookingSessionSchema.parse(req.body);

    const { userId: currentUserId, coupleId } = (req as AuthRequest).user!;
    // Guard: reject if an active session already exists
    const existing = await prisma.cookingSession.findFirst({
      where: { coupleId, status: { not: 'completed' } },
    });
    if (existing) {
      res.status(409).json({ error: 'An active session already exists', sessionId: existing.id });
      return;
    }

    // Fetch recipes in order
    const recipes = await Promise.all(
      recipeIds.map((id, idx) =>
        prisma.recipe.findUnique({ where: { id } }).then((r) => ({ recipe: r, order: idx }))
      )
    );

    const missing = recipes.find(({ recipe }) => !recipe);
    if (missing) {
      res.status(404).json({ error: 'One or more recipes not found' });
      return;
    }

    // Merge shopping items — unique by ingredient string (case-insensitive dedup), carry price
    const seen = new Set<string>();
    const uniqueItems: { ingredient: string; price: number | null }[] = [];
    for (const { recipe } of recipes) {
      recipe!.ingredients.forEach((ing, idx) => {
        const key = ing.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueItems.push({
            ingredient: ing.trim(),
            price: recipe!.ingredientPrices[idx] ?? null,
          });
        }
      });
    }

    // Create session with all nested data
    const session = await prisma.cookingSession.create({
      data: {
        coupleId,
        status: 'selecting',
        recipes: {
          create: recipes.map(({ recipe, order }) => ({
            recipeId: recipe!.id,
            order,
          })),
        },
        items: {
          create: uniqueItems.map(({ ingredient, price }) => ({ ingredient, price })),
        },
        steps: {
          create: recipes.flatMap(({ recipe }) =>
            recipe!.steps.map((content, stepIndex) => ({
              recipeId: recipe!.id,
              stepIndex,
              content,
              durationSeconds: recipe!.stepDurations[stepIndex] ?? null,
            }))
          ),
        },
      },
      include: sessionInclude,
    });

    res.status(201).json(session);
  } catch (error: any) {
    if (error.name === 'ZodError') { res.status(400).json({ error: error.errors }); return; }
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PUT advance status
router.put('/:id/status', async (req: Request<IdParam>, res: Response) => {
  try {
    const data = updateCookingSessionStatusSchema.parse(req.body);
    const updateData: Record<string, unknown> = { status: data.status };

    if (data.status === 'cooking') updateData.startedAt = new Date();
    if (data.status === 'completed') {
      updateData.completedAt = new Date();
      const session = await prisma.cookingSession.findUnique({ where: { id: req.params.id } });
      if (session?.startedAt) {
        updateData.totalTimeMs = Date.now() - session.startedAt.getTime();
      }
    }
    if (data.notes !== undefined) updateData.notes = data.notes;

    const session = await prisma.cookingSession.update({
      where: { id: req.params.id },
      data: updateData,
      include: sessionInclude,
    });
    res.json(session);
    // Notify other user when session completed
    if (data.status === 'completed') {
      const cUser = (req as AuthRequest).user;
      if (cUser) {
        const otherUserId = await getPartnerUserId(cUser.userId, cUser.coupleId);
        if (otherUserId) {
          await createNotification(otherUserId, 'cooking_completed', 'Nấu xong!', 'Phiên nấu ăn hoàn thành!', '/what-to-eat');
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'ZodError') { res.status(400).json({ error: error.errors }); return; }
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// PUT toggle shopping item
router.put('/:id/items/:itemId', async (req: Request<ItemParam>, res: Response) => {
  try {
    const { checked } = toggleCookingItemSchema.parse(req.body);
    const item = await prisma.cookingSessionItem.update({
      where: { id: req.params.itemId },
      data: { checked, checkedAt: checked ? new Date() : null },
    });
    res.json(item);
  } catch (error: any) {
    if (error.name === 'ZodError') { res.status(400).json({ error: error.errors }); return; }
    res.status(500).json({ error: 'Failed to toggle item' });
  }
});

// PUT toggle cooking step
router.put('/:id/steps/:stepId', async (req: Request<StepParam>, res: Response) => {
  try {
    const { checked, checkedBy } = toggleCookingStepSchema.parse(req.body);
    const step = await prisma.cookingSessionStep.update({
      where: { id: req.params.stepId },
      data: {
        checked,
        checkedBy: checked ? (checkedBy ?? null) : null,
        checkedAt: checked ? new Date() : null,
      },
    });
    res.json(step);
  } catch (error: any) {
    if (error.name === 'ZodError') { res.status(400).json({ error: error.errors }); return; }
    res.status(500).json({ error: 'Failed to toggle step' });
  }
});

// POST upload photos
router.post('/:id/photos', upload.array('photos', 10), async (req: Request<IdParam>, res: Response) => {
  try {
    const session = await prisma.cookingSession.findUnique({ where: { id: req.params.id } });
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) { res.status(400).json({ error: 'No files uploaded' }); return; }
    const photos = await Promise.all(
      files.map(async (file) => {
        const { filename, url } = await uploadToCdn(file.buffer, file.originalname);
        return prisma.cookingSessionPhoto.create({
          data: { sessionId: req.params.id, filename, url },
        });
      })
    );
    res.status(201).json(photos);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// PATCH rate session
router.patch('/:id/rate', async (req: Request<IdParam>, res: Response) => {
  try {
    const { rating } = ratingSchema.parse(req.body);
    const session = await prisma.cookingSession.update({
      where: { id: req.params.id },
      data: { rating },
      include: sessionInclude,
    });
    res.json(session);
  } catch (error: any) {
    if (error.name === 'ZodError') { res.status(400).json({ error: error.errors }); return; }
    res.status(500).json({ error: 'Failed to rate session' });
  }
});

// DELETE session
router.delete('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const session = await prisma.cookingSession.findUnique({
      where: { id: req.params.id },
      include: { photos: true },
    });
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
    await Promise.all(session.photos.map((p) => deleteFromCdn(p.filename)));
    await prisma.cookingSession.delete({ where: { id: req.params.id } });
    res.json({ message: 'Session deleted' });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export { router as cookingSessionRoutes };
