import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { upload } from '../middleware/upload';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// PUT /api/profile — update name
router.put('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { name },
      select: { id: true, email: true, name: true, avatar: true },
    });
    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message || 'Invalid input' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// POST /api/profile/avatar — upload avatar via CDN
router.post('/avatar', requireAuth, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Delete old avatar from CDN if present
    const existing = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { avatar: true },
    });
    if (existing?.avatar) {
      const oldFilename = existing.avatar.split('/').pop();
      if (oldFilename) await deleteFromCdn(oldFilename).catch(() => {});
    }

    const { url } = await uploadToCdn(req.file.buffer, req.file.originalname);
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { avatar: url },
      select: { id: true, email: true, name: true, avatar: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

export const profileRoutes = router;
