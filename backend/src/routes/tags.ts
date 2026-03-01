import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/tags — list all tag metadata for couple
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { coupleId } = req.user!;
    const tags = await prisma.tag.findMany({ where: { coupleId }, orderBy: { name: 'asc' } });
    res.json(tags);
  } catch {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// PUT /api/tags/:name — upsert tag icon/color for couple
router.put('/:name', async (req: AuthRequest & { params: { name: string } }, res: Response) => {
  const { coupleId } = req.user!;
  const { name } = req.params;
  const { icon, color } = req.body as { icon?: string; color?: string };
  try {
    const tag = await prisma.tag.upsert({
      where: { name_coupleId: { name, coupleId } },
      create: { name, icon: icon || '🏷️', color: color || null, coupleId },
      update: {
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
      },
    });
    res.json(tag);
  } catch {
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

export { router as tagRoutes };
