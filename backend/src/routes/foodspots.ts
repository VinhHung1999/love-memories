import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { upload } from '../middleware/upload';
import { createFoodSpotSchema, updateFoodSpotSchema } from '../utils/validation';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';
import { haversineDistance } from '../utils/geo';
import type { AuthRequest } from '../middleware/auth';
import { createNotification, getOtherUserId } from '../utils/notifications';

const router = Router();

type IdParam = { id: string };
type PhotoParam = { id: string; photoId: string };

// GET all food spots
router.get('/', async (_req: Request, res: Response) => {
  try {
    const foodSpots = await prisma.foodSpot.findMany({
      include: { photos: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(foodSpots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch food spots' });
  }
});

// GET /random?lat=&lng=&radius= — random food spot within radius km
router.get('/random', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat((req.query.radius as string) || '5');

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'lat and lng are required' });
      return;
    }

    const allSpots = await prisma.foodSpot.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      include: { photos: { take: 1 } },
    });

    const nearby = allSpots
      .map((spot) => ({
        ...spot,
        distance: haversineDistance(lat, lng, spot.latitude!, spot.longitude!),
      }))
      .filter((spot) => spot.distance <= radius);

    if (nearby.length === 0) {
      res.status(404).json({ error: 'No food spots within radius' });
      return;
    }

    const pick = nearby[Math.floor(Math.random() * nearby.length)];
    res.json(pick);
  } catch {
    res.status(500).json({ error: 'Failed to get random food spot' });
  }
});

// GET single food spot
router.get('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const foodSpot = await prisma.foodSpot.findUnique({
      where: { id: req.params.id },
      include: { photos: true },
    });
    if (!foodSpot) { res.status(404).json({ error: 'Food spot not found' }); return; }
    res.json(foodSpot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch food spot' });
  }
});

// POST create food spot
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createFoodSpotSchema.parse(req.body);
    const foodSpot = await prisma.foodSpot.create({
      data,
      include: { photos: true },
    });
    res.status(201).json(foodSpot);
    // Notify other user
    const currentUserId = (req as AuthRequest).user?.userId;
    if (currentUserId) {
      const otherUserId = await getOtherUserId(currentUserId);
      const author = (await prisma.user.findUnique({ where: { id: currentUserId }, select: { name: true } }))?.name ?? 'Ai đó';
      if (otherUserId) {
        await createNotification(otherUserId, 'new_foodspot', 'Quán mới', `${author} thêm quán: ${foodSpot.name}`, '/foodspots');
      }
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors }); return;
    }
    res.status(500).json({ error: 'Failed to create food spot' });
  }
});

// PUT update food spot
router.put('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const data = updateFoodSpotSchema.parse(req.body);
    const foodSpot = await prisma.foodSpot.update({
      where: { id: req.params.id },
      data,
      include: { photos: true },
    });
    res.json(foodSpot);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors }); return;
    }
    res.status(500).json({ error: 'Failed to update food spot' });
  }
});

// DELETE food spot
router.delete('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const foodSpot = await prisma.foodSpot.findUnique({
      where: { id: req.params.id },
      include: { photos: true },
    });
    if (!foodSpot) { res.status(404).json({ error: 'Food spot not found' }); return; }

    await Promise.all(foodSpot.photos.map((photo) => deleteFromCdn(photo.filename)));
    await prisma.foodSpot.delete({ where: { id: req.params.id } });
    res.json({ message: 'Food spot deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete food spot' });
  }
});

// POST upload photos
router.post('/:id/photos', upload.array('photos', 10), async (req: Request<IdParam>, res: Response) => {
  try {
    const foodSpotId = req.params.id;
    const foodSpot = await prisma.foodSpot.findUnique({ where: { id: foodSpotId } });
    if (!foodSpot) { res.status(404).json({ error: 'Food spot not found' }); return; }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' }); return;
    }

    const photos = await Promise.all(
      files.map(async (file) => {
        const { filename, url } = await uploadToCdn(file.buffer, file.originalname);
        return prisma.foodSpotPhoto.create({
          data: { foodSpotId, filename, url },
        });
      })
    );

    res.status(201).json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// DELETE photo
router.delete('/:id/photos/:photoId', async (req: Request<PhotoParam>, res: Response) => {
  try {
    const photo = await prisma.foodSpotPhoto.findUnique({
      where: { id: req.params.photoId },
    });
    if (!photo) { res.status(404).json({ error: 'Photo not found' }); return; }

    await deleteFromCdn(photo.filename);
    await prisma.foodSpotPhoto.delete({ where: { id: req.params.photoId } });
    res.json({ message: 'Photo deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export { router as foodSpotRoutes };
