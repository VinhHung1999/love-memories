import { Router } from 'express';
import type { Response } from 'express';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth';
import { createNotification, getOtherUserId } from '../utils/notifications';

const router = Router();

type IdParam = { id: string };
type PlanStopParam = { id: string; stopId: string };
type PlanSpotParam = { id: string; stopId: string; spotId: string };

const STOPS_INCLUDE = {
  stops: {
    orderBy: { order: 'asc' as const },
    include: { spots: { orderBy: { order: 'asc' as const } } },
  },
};

// GET / — list all plans, newest date first, include stops + auto-update statuses
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.datePlan.findMany({
      orderBy: { date: 'desc' },
      include: STOPS_INCLUDE,
    });

    // Auto-status: planned→active if today; active→completed if past + all stops done
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const toActivate: string[] = [];
    const toComplete: string[] = [];

    for (const plan of plans) {
      const pd = new Date(plan.date);
      const planDay = new Date(pd.getFullYear(), pd.getMonth(), pd.getDate());
      if (planDay.getTime() === todayStart.getTime() && plan.status === 'planned') {
        toActivate.push(plan.id);
      } else if (planDay < todayStart && plan.status === 'active') {
        const allDone = plan.stops.length > 0 && plan.stops.every((s) => s.done);
        if (allDone) toComplete.push(plan.id);
      }
    }

    if (toActivate.length > 0 || toComplete.length > 0) {
      await Promise.all([
        ...toActivate.map((id) => prisma.datePlan.update({ where: { id }, data: { status: 'active' } })),
        ...toComplete.map((id) => prisma.datePlan.update({ where: { id }, data: { status: 'completed' } })),
      ]);
      const updated = await prisma.datePlan.findMany({
        orderBy: { date: 'desc' },
        include: STOPS_INCLUDE,
      });
      res.json(updated);
      return;
    }

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
  id?: string;
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
    // Notify other user
    const currentUserId = req.user!.userId;
    const otherUserId = await getOtherUserId(currentUserId);
    if (otherUserId) {
      await createNotification(otherUserId, 'new_date_plan', 'Kế hoạch hẹn hò mới', `Có kế hoạch mới: ${plan.title}`, '/date-planner');
    }
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

      // Upsert stops if provided — preserve done/linkedMomentId/linkedFoodSpotId
      if (stops !== undefined) {
        const incomingIds = stops.filter((s) => s.id).map((s) => s.id!);
        // Delete stops removed by the user
        await tx.datePlanStop.deleteMany({
          where: { planId: req.params.id, id: { notIn: incomingIds } },
        });
        // Update existing / create new
        for (const s of stops) {
          const editableFields = {
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
          };
          if (s.id) {
            await tx.datePlanStop.update({
              where: { id: s.id },
              data: editableFields,
            });
          } else {
            await tx.datePlanStop.create({
              data: { planId: req.params.id, ...editableFields },
            });
          }
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

// PUT /:id/stops/:stopId/moment — link a moment to a stop
router.put('/:id/stops/:stopId/moment', async (req: AuthRequest & { params: PlanStopParam }, res: Response) => {
  try {
    const { momentId } = req.body as { momentId: string | null };
    const stop = await prisma.datePlanStop.update({
      where: { id: req.params.stopId },
      data: { linkedMomentId: momentId ?? null },
    });
    res.json(stop);
  } catch {
    res.status(500).json({ error: 'Failed to link moment to stop' });
  }
});

// PUT /:id/stops/:stopId/foodspot — link a food spot to a stop
router.put('/:id/stops/:stopId/foodspot', async (req: AuthRequest & { params: PlanStopParam }, res: Response) => {
  try {
    const { foodSpotId } = req.body as { foodSpotId: string | null };
    const stop = await prisma.datePlanStop.update({
      where: { id: req.params.stopId },
      data: { linkedFoodSpotId: foodSpotId ?? null },
    });
    res.json(stop);
  } catch {
    res.status(500).json({ error: 'Failed to link food spot to stop' });
  }
});

// PUT /:id/stops/:stopId/done — mark stop done, auto-complete plan if last stop
router.put('/:id/stops/:stopId/done', async (req: AuthRequest & { params: PlanStopParam }, res: Response) => {
  try {
    // 1. Mark stop done
    await prisma.datePlanStop.update({
      where: { id: req.params.stopId },
      data: { done: true, doneAt: new Date() },
    });

    // 2. Fetch updated plan to check if all stops are done
    const plan = await prisma.datePlan.findUnique({
      where: { id: req.params.id },
      include: STOPS_INCLUDE,
    });

    // 3. Auto-complete if active and all stops done
    if (plan && plan.status === 'active') {
      const allDone = plan.stops.length > 0 && plan.stops.every((s) => s.done);
      if (allDone) {
        await prisma.datePlan.update({
          where: { id: req.params.id },
          data: { status: 'completed' },
        });
        const completed = await prisma.datePlan.findUnique({
          where: { id: req.params.id },
          include: STOPS_INCLUDE,
        });
        res.json(completed);
        return;
      }
    }

    res.json(plan);
  } catch {
    res.status(500).json({ error: 'Failed to mark stop done' });
  }
});

// POST /:id/stops/:stopId/spots — add sub-spot to a stop
router.post('/:id/stops/:stopId/spots', async (req: AuthRequest & { params: PlanStopParam }, res: Response) => {
  try {
    const { title, address, latitude, longitude, url, notes, order } = req.body as {
      title: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      url?: string;
      notes?: string;
      order?: number;
    };
    if (!title) { res.status(400).json({ error: 'title is required' }); return; }
    const spot = await prisma.datePlanSpot.create({
      data: {
        stopId: req.params.stopId,
        title,
        address: address ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        url: url ?? null,
        notes: notes ?? null,
        order: order ?? 0,
      },
    });
    res.status(201).json(spot);
  } catch {
    res.status(500).json({ error: 'Failed to add spot' });
  }
});

// DELETE /:id/stops/:stopId/spots/:spotId — delete sub-spot
router.delete('/:id/stops/:stopId/spots/:spotId', async (req: AuthRequest & { params: PlanSpotParam }, res: Response) => {
  try {
    await prisma.datePlanSpot.delete({ where: { id: req.params.spotId } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete spot' });
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
