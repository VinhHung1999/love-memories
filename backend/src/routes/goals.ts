import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createGoalSchema, updateGoalSchema, updateGoalStatusSchema, reorderGoalsSchema } from '../utils/validation';

const router = Router();

type SprintIdParam = { sprintId: string };
type IdParam = { id: string };

// GET goals for a sprint
router.get('/sprint/:sprintId', async (req: Request<SprintIdParam>, res: Response) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { sprintId: req.params.sprintId },
      orderBy: { order: 'asc' },
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST create goal for sprint
router.post('/sprint/:sprintId', async (req: Request<SprintIdParam>, res: Response) => {
  try {
    const data = createGoalSchema.parse(req.body);
    const goal = await prisma.goal.create({
      data: {
        ...data,
        sprintId: req.params.sprintId,
      },
    });
    res.status(201).json(goal);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors }); return;
    }
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PUT update goal
router.put('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const data = updateGoalSchema.parse(req.body);
    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data,
    });
    res.json(goal);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors }); return;
    }
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// PATCH update goal status
router.patch('/:id/status', async (req: Request<IdParam>, res: Response) => {
  try {
    const { status } = updateGoalStatusSchema.parse(req.body);
    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(goal);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors }); return;
    }
    res.status(500).json({ error: 'Failed to update goal status' });
  }
});

// PATCH reorder goals
router.patch('/reorder', async (req: Request, res: Response) => {
  try {
    const { goals } = reorderGoalsSchema.parse(req.body);
    const updates = goals.map((g) =>
      prisma.goal.update({
        where: { id: g.id },
        data: {
          order: g.order,
          ...(g.status ? { status: g.status } : {}),
        },
      })
    );
    await prisma.$transaction(updates);
    res.json({ message: 'Goals reordered' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors }); return;
    }
    res.status(500).json({ error: 'Failed to reorder goals' });
  }
});

// DELETE goal
router.delete('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    await prisma.goal.delete({ where: { id: req.params.id } });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export { router as goalRoutes };
