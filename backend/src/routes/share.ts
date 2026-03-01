import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const CDN_BASE_URL = process.env.CDN_BASE_URL;

const router = Router();

const VALID_TYPES = ['moment', 'letter', 'recipe'];

// POST /api/share — create share link (protected)
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { type, targetId } = req.body;
    if (!type || !targetId || !VALID_TYPES.includes(type)) {
      res.status(400).json({ error: 'type (moment|letter|recipe) and targetId required' });
      return;
    }
    const coupleId = req.user!.coupleId;

    // Validate targetId belongs to couple
    if (type === 'moment') {
      const item = await prisma.moment.findFirst({ where: { id: targetId, coupleId } });
      if (!item) { res.status(404).json({ error: 'Moment not found' }); return; }
    } else if (type === 'letter') {
      const item = await prisma.loveLetter.findFirst({ where: { id: targetId, coupleId } });
      if (!item) { res.status(404).json({ error: 'Letter not found' }); return; }
      if (item.status === 'DRAFT' || item.status === 'SCHEDULED') {
        res.status(400).json({ error: 'Only DELIVERED or READ letters can be shared' });
        return;
      }
    } else if (type === 'recipe') {
      const item = await prisma.recipe.findFirst({ where: { id: targetId, coupleId } });
      if (!item) { res.status(404).json({ error: 'Recipe not found' }); return; }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const link = await prisma.shareLink.create({
      data: { token, type, targetId, coupleId },
    });
    res.status(201).json(link);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/share — list my share links (protected)
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const links = await prisma.shareLink.findMany({
      where: { coupleId: req.user!.coupleId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(links);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/share/:token — revoke share link (protected)
router.delete('/:token', requireAuth, async (req: AuthRequest & { params: { token: string } }, res: Response) => {
  try {
    const link = await prisma.shareLink.findUnique({
      where: { token: req.params.token },
    });
    if (!link || link.coupleId !== req.user!.coupleId) {
      res.status(404).json({ error: 'Share link not found' });
      return;
    }
    await prisma.shareLink.delete({ where: { id: link.id } });
    res.json({ message: 'Share link revoked' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/share/:token/image — proxy CDN image (public, validates share token)
router.get('/:token/image', async (req: Request<{ token: string }>, res: Response) => {
  try {
    const link = await prisma.shareLink.findUnique({
      where: { token: req.params.token },
    });
    if (!link) {
      res.status(404).json({ error: 'Share link not found' });
      return;
    }
    if (link.expiresAt && link.expiresAt < new Date()) {
      res.status(410).json({ error: 'Share link expired' });
      return;
    }

    const { url } = req.query;
    if (typeof url !== 'string' || (CDN_BASE_URL && !url.startsWith(CDN_BASE_URL))) {
      res.status(400).json({ error: 'Invalid or disallowed url' });
      return;
    }

    const upstream = await fetch(url);
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'CDN fetch failed' });
      return;
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch {
    res.status(502).json({ error: 'CDN proxy error' });
  }
});

// GET /api/share/:token — get shared item (public)
router.get('/:token', async (req: Request<{ token: string }>, res: Response) => {
  try {
    const link = await prisma.shareLink.findUnique({
      where: { token: req.params.token },
      include: { couple: { select: { name: true } } },
    });
    if (!link) {
      res.status(404).json({ error: 'Share link not found' });
      return;
    }
    if (link.expiresAt && link.expiresAt < new Date()) {
      res.status(410).json({ error: 'Share link expired' });
      return;
    }

    // Increment view count
    await prisma.shareLink.update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 } },
    });

    let data: unknown = null;
    if (link.type === 'moment') {
      data = await prisma.moment.findUnique({
        where: { id: link.targetId },
        include: { photos: true, audios: true },
      });
    } else if (link.type === 'letter') {
      data = await prisma.loveLetter.findUnique({
        where: { id: link.targetId },
        include: { photos: true, audio: true, sender: { select: { name: true } } },
      });
    } else if (link.type === 'recipe') {
      data = await prisma.recipe.findUnique({
        where: { id: link.targetId },
        include: { photos: true },
      });
    }

    if (!data) {
      res.status(404).json({ error: 'Shared item not found' });
      return;
    }

    res.json({
      type: link.type,
      data,
      coupleName: link.couple.name,
      sharedAt: link.createdAt,
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export const shareRoutes = router;
