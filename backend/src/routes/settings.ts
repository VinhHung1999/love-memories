import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET is public — display-only data (app name, slogan)
router.get('/:key', async (req: Request<{ key: string }>, res: Response) => {
  const setting = await prisma.appSetting.findUnique({ where: { key: req.params.key } });
  res.json({ key: req.params.key, value: setting?.value ?? null });
});

// PUT requires auth — only authenticated users can change settings
router.put('/:key', requireAuth, async (req: Request<{ key: string }>, res: Response) => {
  const { value } = req.body as { value: string };
  const setting = await prisma.appSetting.upsert({
    where: { key: req.params.key },
    create: { key: req.params.key, value },
    update: { value },
  });
  res.json(setting);
});

export const settingsRoutes = router;
