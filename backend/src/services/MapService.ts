import prisma from '../utils/prisma';

// T472 (Sprint 70) — Memory Map. Bounding-box rectangle in geo coords. Pin
// fetch endpoint is viewport-windowed via Mapbox `onCameraChanged` so the
// client never holds more than the visible set in memory (Q3 strategy:
// MarkerView render works to ~100 pins; SymbolLayer flip is a later concern).
export type Bounds = {
  south: number; // lat min
  west: number; // lng min
  north: number; // lat max
  east: number; // lng max
};

export async function getMomentsInBounds(coupleId: string, bounds: Bounds) {
  const moments = await prisma.moment.findMany({
    where: {
      coupleId,
      latitude: { not: null, gte: bounds.south, lte: bounds.north },
      longitude: { not: null, gte: bounds.west, lte: bounds.east },
    },
    include: {
      // first photo only — thumbnail for the preview card; the full viewer
      // re-fetches via `/api/moments/:id` on tap so we don't bloat the pin
      // payload with every photo.
      photos: { take: 1, orderBy: { createdAt: 'asc' } },
      // existence flag for audio thumb in preview card; full audio fetched
      // by the viewer modal.
      audios: { select: { id: true }, take: 1 },
      author: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { date: 'desc' },
  });

  return moments.map((m) => ({
    id: m.id,
    kind: (m.photos.length > 0 ? 'polaroid' : 'heart') as 'polaroid' | 'heart',
    latitude: m.latitude!,
    longitude: m.longitude!,
    title: m.title,
    date: m.date,
    location: m.location,
    thumbnailUrl: m.photos[0]?.url ?? null,
    hasAudio: m.audios.length > 0,
    author: m.author,
  }));
}

export async function getPins(coupleId: string) {
  const [moments, foodSpots, tagRecords] = await Promise.all([
    prisma.moment.findMany({
      where: { coupleId, latitude: { not: null }, longitude: { not: null } },
      include: { photos: true },
    }),
    prisma.foodSpot.findMany({
      where: { coupleId, latitude: { not: null }, longitude: { not: null } },
      include: { photos: true },
    }),
    prisma.tag.findMany({ where: { coupleId } }),
  ]);

  const tagMap = Object.fromEntries(tagRecords.map((t) => [t.name, t]));

  return [
    ...moments.map((m) => ({
      id: m.id,
      type: 'moment' as const,
      title: m.title,
      latitude: m.latitude!,
      longitude: m.longitude!,
      location: m.location,
      date: m.date,
      tags: m.tags,
      tagIcon: m.tags.length > 0 ? (tagMap[m.tags[0]]?.icon ?? null) : null,
      thumbnail: m.photos[0]?.url || null,
    })),
    ...foodSpots.map((f) => ({
      id: f.id,
      type: 'foodspot' as const,
      title: f.name,
      latitude: f.latitude!,
      longitude: f.longitude!,
      location: f.location,
      rating: f.rating,
      tags: f.tags,
      tagIcon: f.tags.length > 0 ? (tagMap[f.tags[0]]?.icon ?? null) : null,
      thumbnail: f.photos[0]?.url || null,
    })),
  ];
}
