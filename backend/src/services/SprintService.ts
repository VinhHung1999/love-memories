import prisma from '../utils/prisma';
import { AppError } from '../types/errors';
import type { z } from 'zod';
import type { createSprintSchema, updateSprintSchema, updateSprintStatusSchema } from '../validators/sprintSchemas';

type CreateData = z.infer<typeof createSprintSchema>;
type UpdateData = z.infer<typeof updateSprintSchema>;
type StatusData = z.infer<typeof updateSprintStatusSchema>;

const sprintInclude = { goals: { orderBy: { order: 'asc' as const } } };

export async function list(coupleId: string) {
  return prisma.sprint.findMany({
    where: { coupleId },
    include: sprintInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getActive(coupleId: string) {
  const sprint = await prisma.sprint.findFirst({
    where: { coupleId, status: 'ACTIVE' },
    include: sprintInclude,
  });
  if (!sprint) throw new AppError(404, 'No active sprint');
  return sprint;
}

export async function getOne(id: string) {
  const sprint = await prisma.sprint.findUnique({ where: { id }, include: sprintInclude });
  if (!sprint) throw new AppError(404, 'Sprint not found');
  return sprint;
}

export async function create(coupleId: string, data: CreateData) {
  return prisma.sprint.create({ data: { ...data, coupleId }, include: { goals: true } });
}

export async function update(id: string, data: UpdateData) {
  return prisma.sprint.update({ where: { id }, data, include: { goals: true } });
}

export async function updateStatus(id: string, data: StatusData) {
  return prisma.sprint.update({ where: { id }, data: { status: data.status }, include: sprintInclude });
}

export async function remove(id: string) {
  await prisma.sprint.delete({ where: { id } });
}
