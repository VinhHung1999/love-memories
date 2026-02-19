import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { upload } from '../middleware/upload';
import { createFoodSpotSchema, updateFoodSpotSchema } from '../utils/validation';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';

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
