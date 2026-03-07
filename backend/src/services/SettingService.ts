import prisma from '../utils/prisma';

export async function getOne(coupleId: string, key: string) {
  const setting = await prisma.appSetting.findUnique({
    where: { key_coupleId: { key, coupleId } },
  });
  return { key, value: setting?.value ?? null };
}

export async function upsert(coupleId: string, key: string, value: string) {
  return prisma.appSetting.upsert({
    where: { key_coupleId: { key, coupleId } },
    create: { key, value, coupleId },
    update: { value },
  });
}
