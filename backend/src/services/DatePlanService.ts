import prisma from '../utils/prisma';
import { createNotification, getPartnerUserId } from '../utils/notifications';
import { AppError } from '../types/errors';

export const STOPS_INCLUDE = {
  stops: {
    orderBy: { order: 'asc' as const },
    include: { spots: { orderBy: { order: 'asc' as const } } },
  },
};

export type StopInput = {
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
  cost?: number | null;
};

export async function list(coupleId: string) {
  const plans = await prisma.datePlan.findMany({
    where: { coupleId },
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
      ...toActivate.map((id) =>
        prisma.datePlan.update({ where: { id }, data: { status: 'active' } }),
      ),
      ...toComplete.map((id) =>
        prisma.datePlan.update({ where: { id }, data: { status: 'completed' } }),
      ),
    ]);
    return prisma.datePlan.findMany({
      where: { coupleId },
      orderBy: { date: 'desc' },
      include: STOPS_INCLUDE,
    });
  }

  return plans;
}

export async function getOne(id: string) {
  const plan = await prisma.datePlan.findUnique({ where: { id }, include: STOPS_INCLUDE });
  if (!plan) throw new AppError(404, 'Plan not found');
  return plan;
}

export async function create(
  coupleId: string,
  currentUserId: string,
  body: { title: string; date: string; notes?: string; stops?: StopInput[] },
) {
  const { title, date, notes, stops = [] } = body;
  if (!title || !date) throw new AppError(400, 'title and date are required');

  const plan = await prisma.datePlan.create({
    data: {
      coupleId,
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
            cost: s.cost ?? null,
          })),
        },
      },
    },
    include: STOPS_INCLUDE,
  });

  // Notify partner (fire-and-forget)
  void (async () => {
    const otherUserId = await getPartnerUserId(currentUserId, coupleId);
    if (otherUserId) {
      await createNotification(
        otherUserId,
        'new_date_plan',
        'Kế hoạch hẹn hò mới',
        `Có kế hoạch mới: ${plan.title}`,
        '/date-planner',
      );
    }
  })();

  return plan;
}

export async function update(
  id: string,
  body: { title?: string; date?: string; notes?: string; stops?: StopInput[] },
) {
  const { title, date, notes, stops } = body;
  return prisma.$transaction(async (tx) => {
    const updated = await tx.datePlan.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(notes !== undefined && { notes }),
      },
    });

    if (stops !== undefined) {
      const incomingIds = stops.filter((s) => s.id).map((s) => s.id!);
      await tx.datePlanStop.deleteMany({
        where: { planId: id, id: { notIn: incomingIds } },
      });
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
          cost: s.cost ?? null,
        };
        if (s.id) {
          await tx.datePlanStop.update({ where: { id: s.id }, data: editableFields });
        } else {
          await tx.datePlanStop.create({ data: { planId: id, ...editableFields } });
        }
      }
    }

    return tx.datePlan.findUnique({ where: { id: updated.id }, include: STOPS_INCLUDE });
  });
}

export async function updateStatus(id: string, status: string) {
  if (!status) throw new AppError(400, 'status is required');
  return prisma.datePlan.update({
    where: { id },
    data: { status },
    include: STOPS_INCLUDE,
  });
}

export async function linkMoment(stopId: string, momentId: string | null) {
  return prisma.datePlanStop.update({
    where: { id: stopId },
    data: { linkedMomentId: momentId ?? null },
  });
}

export async function linkFoodSpot(stopId: string, foodSpotId: string | null) {
  return prisma.datePlanStop.update({
    where: { id: stopId },
    data: { linkedFoodSpotId: foodSpotId ?? null },
  });
}

export async function updateStopCost(stopId: string, cost: number | null) {
  return prisma.datePlanStop.update({
    where: { id: stopId },
    data: { cost: cost ?? null },
  });
}

export async function markStopDone(planId: string, stopId: string) {
  await prisma.datePlanStop.update({
    where: { id: stopId },
    data: { done: true, doneAt: new Date() },
  });

  const plan = await prisma.datePlan.findUnique({
    where: { id: planId },
    include: STOPS_INCLUDE,
  });

  // Auto-complete if active and all stops done
  if (plan && plan.status === 'active') {
    const allDone = plan.stops.length > 0 && plan.stops.every((s) => s.done);
    if (allDone) {
      await prisma.datePlan.update({ where: { id: planId }, data: { status: 'completed' } });
      return prisma.datePlan.findUnique({ where: { id: planId }, include: STOPS_INCLUDE });
    }
  }

  return plan;
}

export async function addSpot(
  stopId: string,
  body: {
    title: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    url?: string;
    notes?: string;
    order?: number;
  },
) {
  if (!body.title) throw new AppError(400, 'title is required');
  return prisma.datePlanSpot.create({
    data: {
      stopId,
      title: body.title,
      address: body.address ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      url: body.url ?? null,
      notes: body.notes ?? null,
      order: body.order ?? 0,
    },
  });
}

export async function deleteSpot(spotId: string) {
  await prisma.datePlanSpot.delete({ where: { id: spotId } });
}

export async function remove(id: string) {
  await prisma.datePlan.delete({ where: { id } });
}
