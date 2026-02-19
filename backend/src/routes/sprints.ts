import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createSprintSchema, updateSprintSchema, updateSprintStatusSchema } from '../utils/validation';

const router = Router();

type IdParam = { id: string };

// GET all sprints
router.get('/', async (_req: Request, res: Response) => {
  try {
    const sprints = await prisma.sprint.findMany({
      include: { goals: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sprints);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sprints' });
  }
});

// GET active sprint
router.get('/active', async (_req: Request, res: Response) => {
  try {
    const sprint = await prisma.sprint.findFirst({
      where: { status: 'ACTIVE' },
      include: { goals: { orderBy: { order: 'asc' } } },
    });
    if (!sprint) { res.status(404).json({ error: 'No active sprint' }); return; }
    res.json(sprint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active sprint' });
  }
});

// GET single sprint
router.get('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: req.params.id },
      include: { goals: { orderBy: { order: 'asc' } } },
    });
    if (!sprint) { res.status(404).json({ error: 'Sprint not found' }); return; }
    res.json(sprint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sprint' });
  }
});

// POST create sprint
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createSprintSchema.parse(req.body);
    const sprint = await prisma.sprint.create({
      data,
      include: { goals: true },
    });
    res.status(201).json(sprint);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors }); return;
    }
    res.status(500).json({ error: 'Failed to create sprint' });
  }
});

// PUT update sprint
router.put('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const data = updateSprintSchema.parse(req.body);
    const sprint = await prisma.sprint.update({
      where: { id: req.params.id },
      data,
      include: { goals: true },
    });
    res.json(sprint);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors }); return;
    }
    res.status(500).json({ error: 'Failed to update sprint' });
  }
});

// PATCH update sprint status
router.patch('/:id/status', async (req: Request<IdParam>, res: Response) => {
  try {
    const { status } = updateSprintStatusSchema.parse(req.body);
    const sprint = await prisma.sprint.update({
      where: { id: req.params.id },
      data: { status },
      include: { goals: { orderBy: { order: 'asc' } } },
    });
    res.json(sprint);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: error.errors }); return;
    }
    res.status(500).json({ error: 'Failed to update sprint status' });
  }
});

// DELETE sprint
router.delete('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    await prisma.sprint.delete({ where: { id: req.params.id } });
    res.json({ message: 'Sprint deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sprint' });
  }
});

export { router as sprintRoutes };
