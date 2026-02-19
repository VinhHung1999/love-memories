import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { upload } from '../middleware/upload';
import { createMomentSchema, updateMomentSchema } from '../utils/validation';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';

const router = Router();

type IdParam = { id: string };
type PhotoParam = { id: string; photoId: string };

// GET all moments
router.get('/', async (_req: Request, res: Response) => {
  try {
    const moments = await prisma.moment.findMany({
      include: { photos: true },
      orderBy: { date: 'desc' },
    });
    res.json(moments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch moments' });
  }
});

// GET single moment
router.get('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const moment = await prisma.moment.findUnique({
      where: { id: req.params.id },
      include: { photos: true },
    });
    if (!moment) { res.status(404).json({ error: 'Moment not found' }); return; }
    res.json(moment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch moment' });
  }
});

// POST create moment
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createMomentSchema.parse(req.body);
    const moment = await prisma.moment.create({
      data,
      include: { photos: true },
    });
    res.status(201).json(moment);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors }); return;
    }
    res.status(500).json({ error: 'Failed to create moment' });
  }
});

// PUT update moment
router.put('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const data = updateMomentSchema.parse(req.body);
    const moment = await prisma.moment.update({
      where: { id: req.params.id },
      data,
      include: { photos: true },
    });
    res.json(moment);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors }); return;
    }
    res.status(500).json({ error: 'Failed to update moment' });
  }
});

// DELETE moment
router.delete('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const moment = await prisma.moment.findUnique({
      where: { id: req.params.id },
      include: { photos: true },
    });
    if (!moment) { res.status(404).json({ error: 'Moment not found' }); return; }

    await Promise.all(moment.photos.map((photo) => deleteFromCdn(photo.filename)));
    await prisma.moment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Moment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete moment' });
  }
});

// POST upload photos to moment
router.post('/:id/photos', upload.array('photos', 10), async (req: Request<IdParam>, res: Response) => {
  try {
    const momentId = req.params.id;
    const moment = await prisma.moment.findUnique({ where: { id: momentId } });
    if (!moment) { res.status(404).json({ error: 'Moment not found' }); return; }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' }); return;
    }

    const photos = await Promise.all(
      files.map(async (file) => {
        const { filename, url } = await uploadToCdn(file.buffer, file.originalname);
        return prisma.momentPhoto.create({
          data: { momentId, filename, url },
        });
      })
    );

    res.status(201).json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// DELETE photo from moment
router.delete('/:id/photos/:photoId', async (req: Request<PhotoParam>, res: Response) => {
  try {
    const photo = await prisma.momentPhoto.findUnique({
      where: { id: req.params.photoId },
    });
    if (!photo) { res.status(404).json({ error: 'Photo not found' }); return; }

    await deleteFromCdn(photo.filename);
    await prisma.momentPhoto.delete({ where: { id: req.params.photoId } });
    res.json({ message: 'Photo deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export { router as momentRoutes };
