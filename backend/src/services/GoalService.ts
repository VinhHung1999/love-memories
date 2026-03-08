import prisma from '../utils/prisma';
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

export async function reorder(data: ReorderData) {
  const updates = data.goals.map((g) =>
    prisma.goal.update({
      where: { id: g.id },
      data: { order: g.order, ...(g.status ? { status: g.status } : {}) },
    })
  );
  await prisma.$transaction(updates);
  return { message: 'Goals reordered' };
}

export async function update(id: string, data: UpdateData) {
  return prisma.goal.update({ where: { id }, data });
}

export async function updateStatus(id: string, data: StatusData) {
  return prisma.goal.update({ where: { id }, data: { status: data.status } });
}

export async function assign(id: string, data: AssignData) {
  return prisma.goal.update({ where: { id }, data: { sprintId: data.sprintId } });
}

export async function remove(id: string) {
  await prisma.goal.delete({ where: { id } });
}
