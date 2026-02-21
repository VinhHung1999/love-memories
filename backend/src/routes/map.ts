import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = Router();

// GET all map pins (combined moments + food spots with coordinates)
router.get('/pins', async (_req: Request, res: Response) => {
  try {
    const [moments, foodSpots, tagRecords] = await Promise.all([
      prisma.moment.findMany({
        where: {
          latitude: { not: null },
          longitude: { not: null },
        },
        include: { photos: true },
      }),
      prisma.foodSpot.findMany({
        where: {
          latitude: { not: null },
          longitude: { not: null },
        },
        include: { photos: true },
      }),
      prisma.tag.findMany(),
    ]);

    const tagMap = Object.fromEntries(tagRecords.map((t) => [t.name, t]));

    const pins = [
      ...moments.map((m) => ({
        id: m.id,
        type: 'moment' as const,
        title: m.title,
        latitude: m.latitude!,
        longitude: m.longitude!,
        location: m.location,
        date: m.date,
        tags: m.tags,
        tagIcon: m.tags.length > 0 ? (tagMap[m.tags[0]]?.icon ?? null) : null,
        thumbnail: m.photos[0]?.url || null,
      })),
      ...foodSpots.map((f) => ({
        id: f.id,
        type: 'foodspot' as const,
        title: f.name,
        latitude: f.latitude!,
        longitude: f.longitude!,
        location: f.location,
        rating: f.rating,
        tags: f.tags,
        tagIcon: f.tags.length > 0 ? (tagMap[f.tags[0]]?.icon ?? null) : null,
        thumbnail: f.photos[0]?.url || null,
      })),
    ];

    res.json(pins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch map pins' });
  }
});

export { router as mapRoutes };
