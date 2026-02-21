import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { upload } from '../middleware/upload';
import { createRecipeSchema, updateRecipeSchema } from '../utils/validation';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';

const router = Router();

type IdParam = { id: string };
type PhotoParam = { id: string; photoId: string };

// GET all recipes
router.get('/', async (_req: Request, res: Response) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: { photos: true, foodSpot: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// GET single recipe
router.get('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: req.params.id },
      include: { photos: true, foodSpot: { select: { id: true, name: true } } },
    });
    if (!recipe) { res.status(404).json({ error: 'Recipe not found' }); return; }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// POST create recipe
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createRecipeSchema.parse(req.body);
    const recipe = await prisma.recipe.create({
      data,
      include: { photos: true, foodSpot: { select: { id: true, name: true } } },
    });
    res.status(201).json(recipe);
  } catch (error: any) {
    if (error.name === 'ZodError') { res.status(400).json({ error: error.errors }); return; }
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// PUT update recipe
router.put('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const data = updateRecipeSchema.parse(req.body);
    const recipe = await prisma.recipe.update({
      where: { id: req.params.id },
      data,
      include: { photos: true, foodSpot: { select: { id: true, name: true } } },
    });
    res.json(recipe);
  } catch (error: any) {
    if (error.name === 'ZodError') { res.status(400).json({ error: error.errors }); return; }
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// DELETE recipe
router.delete('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: req.params.id },
      include: { photos: true },
    });
    if (!recipe) { res.status(404).json({ error: 'Recipe not found' }); return; }
    await Promise.all(recipe.photos.map((p) => deleteFromCdn(p.filename)));
    await prisma.recipe.delete({ where: { id: req.params.id } });
    res.json({ message: 'Recipe deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// POST upload photos
router.post('/:id/photos', upload.array('photos', 10), async (req: Request<IdParam>, res: Response) => {
  try {
    const recipe = await prisma.recipe.findUnique({ where: { id: req.params.id } });
    if (!recipe) { res.status(404).json({ error: 'Recipe not found' }); return; }
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) { res.status(400).json({ error: 'No files uploaded' }); return; }
    const photos = await Promise.all(
      files.map(async (file) => {
        const { filename, url } = await uploadToCdn(file.buffer, file.originalname);
        return prisma.recipePhoto.create({ data: { recipeId: req.params.id, filename, url } });
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
    const photo = await prisma.recipePhoto.findUnique({ where: { id: req.params.photoId } });
    if (!photo) { res.status(404).json({ error: 'Photo not found' }); return; }
    await deleteFromCdn(photo.filename);
    await prisma.recipePhoto.delete({ where: { id: req.params.photoId } });
    res.json({ message: 'Photo deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export { router as recipeRoutes };
