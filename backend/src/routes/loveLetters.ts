import { Router } from 'express';
import type { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth';
import { createNotification } from '../utils/notifications';

const router = Router();

type IdParam = { id: string };

const createLetterSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  mood: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  sendNow: z.boolean().optional(),
});

const updateLetterSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  mood: z.string().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

async function getPartner(senderId: string): Promise<{ id: string; name: string } | null> {
  const partner = await prisma.user.findFirst({
    where: { id: { not: senderId } },
    select: { id: true, name: true },
  });
  return partner;
}

// GET /api/love-letters/received — inbox (DELIVERED + READ), no drafts/scheduled visible to recipient
router.get('/received', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const letters = await prisma.loveLetter.findMany({
      where: {
        recipientId: userId,
        status: { in: ['DELIVERED', 'READ'] },
      },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
      orderBy: { deliveredAt: 'desc' },
    });
    res.json(letters);
  } catch {
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

// GET /api/love-letters/sent — all sent letters (any status)
router.get('/sent', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const letters = await prisma.loveLetter.findMany({
      where: { senderId: userId },
      include: { recipient: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(letters);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sent letters' });
  }
});

// GET /api/love-letters/unread-count — count DELIVERED letters for current user
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.loveLetter.count({
      where: { recipientId: req.user!.userId, status: 'DELIVERED' },
    });
    res.json({ count });
  } catch {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// GET /api/love-letters/:id — get letter, auto-mark READ if recipient
router.get('/:id', async (req: AuthRequest & { params: IdParam }, res: Response) => {
  try {
    const userId = req.user!.userId;
    const letter = await prisma.loveLetter.findUnique({
      where: { id: req.params.id },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        recipient: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!letter) { res.status(404).json({ error: 'Letter not found' }); return; }

    // Only sender or recipient can view
    if (letter.senderId !== userId && letter.recipientId !== userId) {
      res.status(403).json({ error: 'Forbidden' }); return;
    }

    // Recipients cannot see DRAFT/SCHEDULED (surprise!)
    if (letter.recipientId === userId && (letter.status === 'DRAFT' || letter.status === 'SCHEDULED')) {
      res.status(404).json({ error: 'Letter not found' }); return;
    }

    // Auto-mark READ if recipient and DELIVERED
    if (letter.recipientId === userId && letter.status === 'DELIVERED') {
      const updated = await prisma.loveLetter.update({
        where: { id: letter.id },
        data: { status: 'READ', readAt: new Date() },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          recipient: { select: { id: true, name: true, avatar: true } },
        },
      });
      res.json(updated); return;
    }

    res.json(letter);
  } catch {
    res.status(500).json({ error: 'Failed to fetch letter' });
  }
});

// POST /api/love-letters — create letter
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const data = createLetterSchema.parse(req.body);

    const partner = await getPartner(userId);
    if (!partner) { res.status(400).json({ error: 'No partner found' }); return; }

    let status: 'DRAFT' | 'SCHEDULED' | 'DELIVERED' = 'DRAFT';
    let deliveredAt: Date | undefined;
    let scheduledAt: Date | undefined;

    if (data.sendNow) {
      status = 'DELIVERED';
      deliveredAt = new Date();
    } else if (data.scheduledAt) {
      const scheduled = new Date(data.scheduledAt);
      if (scheduled <= new Date()) {
        status = 'DELIVERED';
        deliveredAt = new Date();
      } else {
        status = 'SCHEDULED';
        scheduledAt = scheduled;
      }
    }

    const letter = await prisma.loveLetter.create({
      data: {
        senderId: userId,
        recipientId: partner.id,
        title: data.title,
        content: data.content,
        mood: data.mood,
        status,
        scheduledAt: scheduledAt ?? null,
        deliveredAt: deliveredAt ?? null,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        recipient: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (status === 'DELIVERED') {
      const senderUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      await createNotification(
        partner.id,
        'love_letter',
        `Thư tình mới từ ${senderUser?.name ?? 'người ấy'} 💌`,
        data.title,
        '/love-letters',
      ).catch(() => {});
    }

    res.status(201).json(letter);
  } catch (error: any) {
    if (error.name === 'ZodError') { res.status(400).json({ error: error.errors }); return; }
    res.status(500).json({ error: 'Failed to create letter' });
  }
});

// PUT /api/love-letters/:id — edit DRAFT/SCHEDULED only
router.put('/:id', async (req: AuthRequest & { params: IdParam }, res: Response) => {
  try {
    const userId = req.user!.userId;
    const data = updateLetterSchema.parse(req.body);

    const letter = await prisma.loveLetter.findUnique({ where: { id: req.params.id } });
    if (!letter) { res.status(404).json({ error: 'Letter not found' }); return; }
    if (letter.senderId !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }
    if (letter.status !== 'DRAFT' && letter.status !== 'SCHEDULED') {
      res.status(400).json({ error: 'Only DRAFT or SCHEDULED letters can be edited' }); return;
    }

    const scheduledAt = data.scheduledAt !== undefined
      ? (data.scheduledAt ? new Date(data.scheduledAt) : null)
      : undefined;

    const newStatus = scheduledAt ? 'SCHEDULED' : (letter.status === 'SCHEDULED' ? 'DRAFT' : letter.status);

    const updated = await prisma.loveLetter.update({
      where: { id: letter.id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.mood !== undefined && { mood: data.mood }),
        ...(scheduledAt !== undefined && { scheduledAt }),
        status: newStatus as 'DRAFT' | 'SCHEDULED',
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        recipient: { select: { id: true, name: true, avatar: true } },
      },
    });
    res.json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') { res.status(400).json({ error: error.errors }); return; }
    res.status(500).json({ error: 'Failed to update letter' });
  }
});

// PUT /api/love-letters/:id/send — send DRAFT immediately
router.put('/:id/send', async (req: AuthRequest & { params: IdParam }, res: Response) => {
  try {
    const userId = req.user!.userId;
    const letter = await prisma.loveLetter.findUnique({ where: { id: req.params.id } });
    if (!letter) { res.status(404).json({ error: 'Letter not found' }); return; }
    if (letter.senderId !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }
    if (letter.status !== 'DRAFT' && letter.status !== 'SCHEDULED') {
      res.status(400).json({ error: 'Letter already sent' }); return;
    }

    const updated = await prisma.loveLetter.update({
      where: { id: letter.id },
      data: { status: 'DELIVERED', deliveredAt: new Date(), scheduledAt: null },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        recipient: { select: { id: true, name: true, avatar: true } },
      },
    });

    const senderUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await createNotification(
      letter.recipientId,
      'love_letter',
      `Thư tình mới từ ${senderUser?.name ?? 'người ấy'} 💌`,
      letter.title,
      '/love-letters',
    ).catch(() => {});

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to send letter' });
  }
});

// DELETE /api/love-letters/:id — delete DRAFT/SCHEDULED only
router.delete('/:id', async (req: AuthRequest & { params: IdParam }, res: Response) => {
  try {
    const userId = req.user!.userId;
    const letter = await prisma.loveLetter.findUnique({ where: { id: req.params.id } });
    if (!letter) { res.status(404).json({ error: 'Letter not found' }); return; }
    if (letter.senderId !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }
    if (letter.status !== 'DRAFT' && letter.status !== 'SCHEDULED') {
      res.status(400).json({ error: 'Only DRAFT or SCHEDULED letters can be deleted' }); return;
    }

    await prisma.loveLetter.delete({ where: { id: letter.id } });
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Failed to delete letter' });
  }
});

export { router as loveLetterRoutes };
