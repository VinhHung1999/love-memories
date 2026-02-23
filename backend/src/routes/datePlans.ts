import { Router } from 'express';
import type { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

type IdParam = { id: string };
type PlanStopParam = { id: string; stopId: string };

const STOPS_INCLUDE = {
  stops: { orderBy: { order: 'asc' as const } },
};

// GET / — list all plans, newest date first, include stops
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.datePlan.findMany({
      orderBy: { date: 'desc' },
      include: STOPS_INCLUDE,
    });
    res.json(plans);
  } catch {
    res.status(500).json({ error: 'Failed to fetch date plans' });
  }
});

// GET /:id — single plan with stops
router.get('/:id', async (req: AuthRequest & { params: IdParam }, res: Response) => {
  try {
    const plan = await prisma.datePlan.findUnique({
      where: { id: req.params.id },
      include: STOPS_INCLUDE,
    });
    if (!plan) { res.status(404).json({ error: 'Plan not found' }); return; }
    res.json(plan);
  } catch {
    res.status(500).json({ error: 'Failed to fetch date plan' });
  }
});

type StopInput = {
  time: string;
  title: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  url?: string;
  tags?: string[];
  category?: string;
  notes?: string;
  order: number;
  wishId?: string;
};

// POST / — create plan + stops
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, date, notes, stops = [] } = req.body as {
      title: string;
      date: string;
      notes?: string;
      stops?: StopInput[];
    };
    if (!title || !date) {
      res.status(400).json({ error: 'title and date are required' });
      return;
    }
    const plan = await prisma.datePlan.create({
      data: {
        title,
        date: new Date(date),
        notes: notes ?? null,
        stops: {
          createMany: {
            data: stops.map((s) => ({
              time: s.time,
              title: s.title,
              description: s.description ?? null,
              address: s.address ?? null,
              latitude: s.latitude ?? null,
              longitude: s.longitude ?? null,
              url: s.url ?? null,
              tags: s.tags ?? [],
              category: s.category ?? null,
              notes: s.notes ?? null,
              order: s.order,
              wishId: s.wishId ?? null,
            })),
          },
        },
      },
      include: STOPS_INCLUDE,
    });
    res.status(201).json(plan);
  } catch {
    res.status(500).json({ error: 'Failed to create date plan' });
  }
});

// PUT /:id — update plan fields + replace stops
router.put('/:id', async (req: AuthRequest & { params: IdParam }, res: Response) => {
  try {
    const { title, date, notes, stops } = req.body as {
      title?: string;
      date?: string;
      notes?: string;
      stops?: StopInput[];
    };

    const plan = await prisma.$transaction(async (tx) => {
      // Update plan fields
      const updated = await tx.datePlan.update({
        where: { id: req.params.id },
        data: {
          ...(title !== undefined && { title }),
          ...(date !== undefined && { date: new Date(date) }),
          ...(notes !== undefined && { notes }),
        },
      });

      // Replace stops if provided
      if (stops !== undefined) {
        await tx.datePlanStop.deleteMany({ where: { planId: req.params.id } });
        if (stops.length > 0) {
          await tx.datePlanStop.createMany({
            data: stops.map((s) => ({
              planId: req.params.id,
              time: s.time,
              title: s.title,
              description: s.description ?? null,
              address: s.address ?? null,
              latitude: s.latitude ?? null,
              longitude: s.longitude ?? null,
              url: s.url ?? null,
              tags: s.tags ?? [],
              category: s.category ?? null,
              notes: s.notes ?? null,
              order: s.order,
              wishId: s.wishId ?? null,
            })),
          });
        }
      }

      return tx.datePlan.findUnique({
        where: { id: updated.id },
        include: STOPS_INCLUDE,
      });
    });

    res.json(plan);
  } catch {
    res.status(500).json({ error: 'Failed to update date plan' });
  }
});

// PUT /:id/status — update status only
router.put('/:id/status', async (req: AuthRequest & { params: IdParam }, res: Response) => {
  try {
    const { status } = req.body as { status: string };
    if (!status) { res.status(400).json({ error: 'status is required' }); return; }
    const plan = await prisma.datePlan.update({
      where: { id: req.params.id },
      data: { status },
      include: STOPS_INCLUDE,
    });
    res.json(plan);
  } catch {
    res.status(500).json({ error: 'Failed to update plan status' });
  }
});

// PUT /:id/stops/:stopId/done — mark stop done
router.put('/:id/stops/:stopId', async (req: AuthRequest & { params: PlanStopParam }, res: Response) => {
  try {
    const stop = await prisma.datePlanStop.update({
      where: { id: req.params.stopId },
      data: { done: true, doneAt: new Date() },
    });
    res.json(stop);
  } catch {
    res.status(500).json({ error: 'Failed to mark stop done' });
  }
});

// DELETE /:id — cascade deletes stops via schema
router.delete('/:id', async (req: AuthRequest & { params: IdParam }, res: Response) => {
  try {
    await prisma.datePlan.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete date plan' });
  }
});

export { router as datePlanRoutes };
