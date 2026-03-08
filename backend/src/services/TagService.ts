import prisma from '../utils/prisma';

export async function list(coupleId: string) {
  return prisma.tag.findMany({ where: { coupleId }, orderBy: { name: 'asc' } });
}

export async function upsert(coupleId: string, name: string, icon?: string, color?: string) {
  return prisma.tag.upsert({
    where: { name_coupleId: { name, coupleId } },
    create: { name, icon: icon || '🏷️', color: color || null, coupleId },
    update: {
      ...(icon !== undefined && { icon }),
      ...(color !== undefined && { color }),
    },
  });
}
