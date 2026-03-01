import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { upload, uploadAudio } from '../middleware/upload';
import { createMomentSchema, updateMomentSchema } from '../utils/validation';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';
import type { AuthRequest } from '../middleware/auth';
import { createNotification, getPartnerUserId } from '../utils/notifications';

const router = Router();

type IdParam = { id: string };
type PhotoParam = { id: string; photoId: string };
type AudioParam = { id: string; audioId: string };
type CommentParam = { id: string; commentId: string };

const PRESET_EMOJIS = ['❤️', '😂', '😍', '🥺', '🔥', '👏', '😢', '🎉'];

const commentSchema = z.object({
  author: z.string().min(1),
  content: z.string().min(1),
});

const reactionSchema = z.object({
  emoji: z.string().refine((e) => PRESET_EMOJIS.includes(e), { message: 'Invalid emoji' }),
  author: z.string().min(1),
});

// GET all moments
router.get('/', async (req: Request, res: Response) => {
  try {
    const { coupleId } = (req as AuthRequest).user!;
    const moments = await prisma.moment.findMany({
      where: { coupleId },
      include: { photos: true, audios: true },
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
      include: {
        photos: true,
        audios: { orderBy: { createdAt: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' }, include: { user: { select: { name: true, avatar: true } } } },
        reactions: { orderBy: { createdAt: 'asc' } },
      },
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
    const { userId: currentUserId, coupleId } = (req as AuthRequest).user!;
    const moment = await prisma.moment.create({
      data: { ...data, coupleId },
      include: { photos: true },
    });
    res.status(201).json(moment);
    // Notify partner
    const otherUserId = await getPartnerUserId(currentUserId, coupleId);
    const author = (await prisma.user.findUnique({ where: { id: currentUserId }, select: { name: true } }))?.name ?? 'Ai đó';
    if (otherUserId) {
      await createNotification(otherUserId, 'new_moment', 'Kỷ niệm mới', `${author} đã thêm kỷ niệm: ${moment.title}`, `/moments/${moment.id}`);
    }
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
      include: { photos: true, audios: true },
    });
    if (!moment) { res.status(404).json({ error: 'Moment not found' }); return; }

    await Promise.all([
      ...moment.photos.map((photo) => deleteFromCdn(photo.filename)),
      ...moment.audios.map((audio) => deleteFromCdn(audio.filename)),
    ]);
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

// POST upload audio to moment
router.post('/:id/audio', uploadAudio.single('audio'), async (req: Request<IdParam>, res: Response) => {
  try {
    const momentId = req.params.id;
    const moment = await prisma.moment.findUnique({ where: { id: momentId } });
    if (!moment) { res.status(404).json({ error: 'Moment not found' }); return; }

    const file = req.file;
    if (!file) { res.status(400).json({ error: 'No audio file uploaded' }); return; }

    const duration = req.body.duration ? parseFloat(req.body.duration) : null;
    const { filename, url } = await uploadToCdn(file.buffer, file.originalname, file.mimetype);
    const audio = await prisma.momentAudio.create({
      data: { momentId, filename, url, duration },
    });

    res.status(201).json(audio);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload audio' });
  }
});

// DELETE audio from moment
router.delete('/:id/audio/:audioId', async (req: Request<AudioParam>, res: Response) => {
  try {
    const audio = await prisma.momentAudio.findUnique({
      where: { id: req.params.audioId },
    });
    if (!audio) { res.status(404).json({ error: 'Audio not found' }); return; }

    await deleteFromCdn(audio.filename);
    await prisma.momentAudio.delete({ where: { id: req.params.audioId } });
    res.json({ message: 'Audio deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete audio' });
  }
});

// ─── Comments ─────────────────────────────────────────────────────────────────

// GET comments for a moment
router.get('/:id/comments', async (req: Request<IdParam>, res: Response) => {
  try {
    const comments = await prisma.momentComment.findMany({
      where: { momentId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { name: true, avatar: true } } },
    });
    res.json(comments);
  } catch {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST add comment
router.post('/:id/comments', async (req: Request<IdParam>, res: Response) => {
  try {
    const { author, content } = commentSchema.parse(req.body);
    const moment = await prisma.moment.findUnique({ where: { id: req.params.id } });
    if (!moment) { res.status(404).json({ error: 'Moment not found' }); return; }
    const userId = (req as AuthRequest).user?.userId ?? null;
    const comment = await prisma.momentComment.create({
      data: { momentId: req.params.id, userId, author, content },
      include: { user: { select: { name: true, avatar: true } } },
    });
    res.status(201).json(comment);
    // Notify partner
    if (userId) {
      const { coupleId: cId } = (req as AuthRequest).user!;
      const otherUserId = await getPartnerUserId(userId, cId);
      const preview = content.length > 50 ? `${content.slice(0, 50)}…` : content;
      if (otherUserId) {
        await createNotification(otherUserId, 'new_comment', 'Bình luận mới', `${author} bình luận: ${preview}`, `/moments/${req.params.id}`);
      }
    }
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors[0]?.message }); return; }
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// DELETE comment
router.delete('/:id/comments/:commentId', async (req: Request<CommentParam>, res: Response) => {
  try {
    await prisma.momentComment.delete({ where: { id: req.params.commentId } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Comment not found' });
  }
});

// ─── Reactions ────────────────────────────────────────────────────────────────

// POST toggle reaction (add or remove)
router.post('/:id/reactions', async (req: Request<IdParam>, res: Response) => {
  try {
    const { emoji, author } = reactionSchema.parse(req.body);
    const momentId = req.params.id;

    const moment = await prisma.moment.findUnique({ where: { id: momentId } });
    if (!moment) { res.status(404).json({ error: 'Moment not found' }); return; }

    const existing = await prisma.momentReaction.findUnique({
      where: { momentId_emoji_author: { momentId, emoji, author } },
    });

    const isAdding = !existing;
    if (existing) {
      await prisma.momentReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.momentReaction.create({ data: { momentId, emoji, author } });
    }

    const reactions = await prisma.momentReaction.findMany({
      where: { momentId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(reactions);
    // Notify other user only when adding (not removing) a reaction
    if (isAdding) {
      const currentUserId = (req as AuthRequest).user?.userId;
      const reactionCoupleId = (req as AuthRequest).user?.coupleId;
      if (currentUserId && reactionCoupleId) {
        const otherUserId = await getPartnerUserId(currentUserId, reactionCoupleId);
        if (otherUserId) {
          await createNotification(otherUserId, 'new_reaction', 'Cảm xúc mới', `${author} đã ${emoji} kỷ niệm của bạn`, `/moments/${momentId}`);
        }
      }
    }
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors[0]?.message }); return; }
    res.status(500).json({ error: 'Failed to toggle reaction' });
  }
});

export { router as momentRoutes };
