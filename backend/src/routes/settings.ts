import { Router } from 'express';
import type { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// GET setting by key — scoped by couple
router.get('/:key', async (req: AuthRequest & { params: { key: string } }, res: Response) => {
  const { coupleId } = req.user!;
  const setting = await prisma.appSetting.findUnique({
    where: { key_coupleId: { key: req.params.key, coupleId } },
  });
  res.json({ key: req.params.key, value: setting?.value ?? null });
});

// PUT upsert setting — scoped by couple
router.put('/:key', async (req: AuthRequest & { params: { key: string } }, res: Response) => {
  const { coupleId } = req.user!;
  const { value } = req.body as { value: string };
  const setting = await prisma.appSetting.upsert({
    where: { key_coupleId: { key: req.params.key, coupleId } },
    create: { key: req.params.key, value, coupleId },
    update: { value },
  });
  res.json(setting);
});

export const settingsRoutes = router;
