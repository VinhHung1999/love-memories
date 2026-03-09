import prisma from '../utils/prisma';
import { AppError } from '../types/errors';
import type { z } from 'zod';
import type { createGoalSchema, updateGoalSchema, updateGoalStatusSchema, assignGoalSchema, reorderGoalsSchema } from '../validators/goalSchemas';

type CreateData = z.infer<typeof createGoalSchema>;
type UpdateData = z.infer<typeof updateGoalSchema>;
type StatusData = z.infer<typeof updateGoalStatusSchema>;
type AssignData = z.infer<typeof assignGoalSchema>;
type ReorderData = z.infer<typeof reorderGoalsSchema>;

export async function backlog(coupleId: string) {
  return prisma.goal.findMany({ where: { coupleId, sprintId: null }, orderBy: { order: 'asc' } });
}

export async function listBySprint(sprintId: string) {
  return prisma.goal.findMany({ where: { sprintId }, orderBy: { order: 'asc' } });
}

export async function create(coupleId: string, data: CreateData, sprintId?: string) {
  return prisma.goal.create({ data: { ...data, coupleId, ...(sprintId ? { sprintId } : {}) } });
}

export async function reorder(coupleId: string, data: ReorderData) {
  // Verify all goals belong to the couple before reordering
  const goalIds = data.goals.map((g) => g.id);
  const goals = await prisma.goal.findMany({ where: { id: { in: goalIds }, coupleId } });
  if (goals.length !== goalIds.length) throw new AppError(404, 'One or more goals not found');
  const updates = data.goals.map((g) =>
    prisma.goal.update({
      where: { id: g.id },
      data: { order: g.order, ...(g.status ? { status: g.status } : {}) },
    })
  );
  await prisma.$transaction(updates);
  return { message: 'Goals reordered' };
}

export async function update(id: string, coupleId: string, data: UpdateData) {
  const existing = await prisma.goal.findFirst({ where: { id, coupleId } });
  if (!existing) throw new AppError(404, 'Goal not found');
  return prisma.goal.update({ where: { id }, data });
}

export async function updateStatus(id: string, coupleId: string, data: StatusData) {
  const existing = await prisma.goal.findFirst({ where: { id, coupleId } });
  if (!existing) throw new AppError(404, 'Goal not found');
  return prisma.goal.update({ where: { id }, data: { status: data.status } });
}

export async function assign(id: string, coupleId: string, data: AssignData) {
  const existing = await prisma.goal.findFirst({ where: { id, coupleId } });
  if (!existing) throw new AppError(404, 'Goal not found');
  return prisma.goal.update({ where: { id }, data: { sprintId: data.sprintId } });
}

export async function remove(id: string, coupleId: string) {
  const existing = await prisma.goal.findFirst({ where: { id, coupleId } });
  if (!existing) throw new AppError(404, 'Goal not found');
  await prisma.goal.delete({ where: { id } });
}
