import { Router, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/couple — get couple info + users
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const couple = await prisma.couple.findUnique({
      where: { id: req.user!.coupleId },
      include: {
        users: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
    if (!couple) {
      res.status(404).json({ error: 'Couple not found' });
      return;
    }
    res.json(couple);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  anniversaryDate: z.string().nullable().optional(),
});

// PUT /api/couple — update name, anniversaryDate
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = updateSchema.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.anniversaryDate !== undefined) {
      updateData.anniversaryDate = data.anniversaryDate ? new Date(data.anniversaryDate) : null;
    }

    const couple = await prisma.couple.update({
      where: { id: req.user!.coupleId },
      data: updateData,
      include: {
        users: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    // Sync anniversaryDate back to AppSetting for backward compat
    if (data.anniversaryDate !== undefined) {
      const value = data.anniversaryDate || '';
      await prisma.appSetting.upsert({
        where: { key_coupleId: { key: 'relationship-start-date', coupleId: req.user!.coupleId } },
        update: { value },
        create: { key: 'relationship-start-date', coupleId: req.user!.coupleId, value },
      });
    }

    res.json(couple);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message || 'Invalid input' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// POST /api/couple/generate-invite — generate unique 8-char invite code
router.post('/generate-invite', async (req: AuthRequest, res: Response) => {
  try {
    const inviteCode = crypto.randomBytes(4).toString('hex');
    await prisma.couple.update({
      where: { id: req.user!.coupleId },
      data: { inviteCode },
    });
    res.json({ inviteCode });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export const coupleRoutes = router;
