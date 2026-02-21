import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = Router();

// GET /api/tags — list all tag metadata
router.get('/', async (_req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
    res.json(tags);
  } catch {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// PUT /api/tags/:name — upsert tag icon/color
router.put('/:name', async (req: Request<{ name: string }>, res: Response) => {
  const { name } = req.params;
  const { icon, color } = req.body as { icon?: string; color?: string };
  try {
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name, icon: icon || '🏷️', color: color || null },
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
