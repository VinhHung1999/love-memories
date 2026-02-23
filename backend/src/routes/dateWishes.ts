import { Router } from 'express';
import type { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

type IdParam = { id: string };

// GET / — list all wishes, newest first
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const wishes = await prisma.dateWish.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(wishes);
  } catch {
    res.status(500).json({ error: 'Failed to fetch date wishes' });
  }
});

// POST / — create wish
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, address, latitude, longitude, url, tags } = req.body as {
      title: string;
      description?: string;
      category: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      url?: string;
      tags?: string[];
    };
    if (!title || !category) {
      res.status(400).json({ error: 'title and category are required' });
      return;
    }
    const wish = await prisma.dateWish.create({
      data: {
        title,
        description: description ?? null,
        category,
        address: address ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        url: url ?? null,
        tags: tags ?? [],
        createdBy: req.user!.userId,
      },
    });
    res.status(201).json(wish);
  } catch {
    res.status(500).json({ error: 'Failed to create date wish' });
  }
});

// PUT /:id — update title/description/category
router.put('/:id', async (req: AuthRequest & { params: IdParam }, res: Response) => {
  try {
    const { title, description, category, address, latitude, longitude, url, tags } = req.body as {
      title?: string;
      description?: string;
      category?: string;
      address?: string;
      latitude?: number | null;
      longitude?: number | null;
      url?: string;
      tags?: string[];
    };
    const wish = await prisma.dateWish.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(address !== undefined && { address }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(url !== undefined && { url }),
        ...(tags !== undefined && { tags }),
      },
    });
    res.json(wish);
  } catch {
    res.status(500).json({ error: 'Failed to update date wish' });
  }
});

// PUT /:id/done — mark done, optionally link moment/foodspot
router.put('/:id/done', async (req: AuthRequest & { params: IdParam }, res: Response) => {
  try {
    const { linkedMomentId, linkedFoodSpotId } = req.body as {
      linkedMomentId?: string | null;
      linkedFoodSpotId?: string | null;
    };
    const wish = await prisma.dateWish.update({
      where: { id: req.params.id },
      data: {
        done: true,
        doneAt: new Date(),
        ...(linkedMomentId !== undefined && { linkedMomentId }),
        ...(linkedFoodSpotId !== undefined && { linkedFoodSpotId }),
      },
    });
    res.json(wish);
  } catch {
    res.status(500).json({ error: 'Failed to mark wish done' });
  }
});

// DELETE /:id
router.delete('/:id', async (req: AuthRequest & { params: IdParam }, res: Response) => {
  try {
    await prisma.dateWish.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete date wish' });
  }
});

export { router as dateWishRoutes };
