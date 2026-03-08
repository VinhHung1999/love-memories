import prisma from '../utils/prisma';
import { uploadToCdn, deleteFromCdn } from '../utils/cdn';
import { haversineDistance } from '../utils/geo';
import { createNotification, getPartnerUserId } from '../utils/notifications';
import { AppError } from '../types/errors';

export async function list(coupleId: string) {
  return prisma.foodSpot.findMany({
    where: { coupleId },
    include: { photos: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRandom(
  coupleId: string,
  lat: number,
  lng: number,
  radius: number,
) {
  const allSpots = await prisma.foodSpot.findMany({
    where: { coupleId, latitude: { not: null }, longitude: { not: null } },
    include: { photos: { take: 1 } },
  });

  const nearby = allSpots
    .map((spot) => ({
      ...spot,
      distance: haversineDistance(lat, lng, spot.latitude!, spot.longitude!),
    }))
    .filter((spot) => spot.distance <= radius);

  if (nearby.length === 0) throw new AppError(404, 'No food spots within radius');

  return nearby[Math.floor(Math.random() * nearby.length)];
}

export async function getOne(id: string) {
  const foodSpot = await prisma.foodSpot.findUnique({
    where: { id },
    include: { photos: true },
  });
  if (!foodSpot) throw new AppError(404, 'Food spot not found');
  return foodSpot;
}

export async function create(
  coupleId: string,
  currentUserId: string,
  data: Record<string, unknown>,
) {
  const foodSpot = await prisma.foodSpot.create({
    data: { ...(data as any), coupleId },
    include: { photos: true },
  });
  // Notify partner (fire-and-forget)
  void (async () => {
    const otherUserId = await getPartnerUserId(currentUserId, coupleId);
    const author =
      (await prisma.user.findUnique({ where: { id: currentUserId }, select: { name: true } }))
        ?.name ?? 'Ai đó';
    if (otherUserId) {
      await createNotification(
        otherUserId,
        'new_foodspot',
        'Quán mới',
        `${author} thêm quán: ${foodSpot.name}`,
        '/foodspots',
      );
    }
  })();
  return foodSpot;
}

export async function update(id: string, data: Record<string, unknown>) {
  return prisma.foodSpot.update({
    where: { id },
    data: data as object,
    include: { photos: true },
  });
}

export async function remove(id: string) {
  const foodSpot = await prisma.foodSpot.findUnique({
    where: { id },
    include: { photos: true },
  });
  if (!foodSpot) throw new AppError(404, 'Food spot not found');
  await Promise.all(foodSpot.photos.map((photo) => deleteFromCdn(photo.url)));
  await prisma.foodSpot.delete({ where: { id } });
}

export async function uploadPhotos(foodSpotId: string, files: Express.Multer.File[]) {
  const foodSpot = await prisma.foodSpot.findUnique({ where: { id: foodSpotId } });
  if (!foodSpot) throw new AppError(404, 'Food spot not found');
  if (!files || files.length === 0) throw new AppError(400, 'No files uploaded');
  return Promise.all(
    files.map(async (file) => {
      const { filename, url } = await uploadToCdn(file.buffer, file.originalname, file.mimetype);
      return prisma.foodSpotPhoto.create({ data: { foodSpotId, filename, url } });
    }),
  );
}

export async function deletePhoto(photoId: string) {
  const photo = await prisma.foodSpotPhoto.findUnique({ where: { id: photoId } });
  if (!photo) throw new AppError(404, 'Photo not found');
  await deleteFromCdn(photo.url);
  await prisma.foodSpotPhoto.delete({ where: { id: photoId } });
}
