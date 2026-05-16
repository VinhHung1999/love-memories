import { apiClient } from '@/lib/apiClient';
import type { MapBounds, MapMomentPin } from '@/screens/Map/types';

// T472 (Sprint 70) — Memory Map. Typed fetcher for the viewport-windowed
// Moment pins endpoint. BE contract: `GET /api/map/moments?bounds=south,west,
// north,east` returns `MapMomentPin[]`. SW corner must be ≤ NE corner;
// callers are expected to validate before calling (this is hot-path —
// Mapbox `onCameraChanged` debounce wraps it).

export async function fetchMomentPins(bounds: MapBounds): Promise<MapMomentPin[]> {
  const q = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  return apiClient.get<MapMomentPin[]>(`/api/map/moments?bounds=${q}`);
}
