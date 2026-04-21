import { apiClient } from '@/lib/apiClient';

// T399 (Sprint 63) — Mapbox geocode wrappers. Backend
// (backend/src/routes/location.ts) proxies Mapbox with VN bias + vi language
// + the referer header, so the mobile client never sees the raw token. We
// only surface the fields we actually use — place_name + center — ignoring
// the rest of the GeoJSON payload.

export type PlaceFeature = {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  place_type?: string[];
  text?: string;
};

type MapboxResponse = {
  features?: PlaceFeature[];
  error?: string;
};

export async function searchPlaces(
  q: string,
  opts?: { limit?: number; proximity?: { lat: number; lng: number } },
): Promise<PlaceFeature[]> {
  const trimmed = q.trim();
  if (trimmed.length < 1) return [];
  const params = new URLSearchParams({
    q: trimmed,
    limit: String(opts?.limit ?? 5),
  });
  if (opts?.proximity) {
    params.set('proximity', `${opts.proximity.lng},${opts.proximity.lat}`);
  }
  const data = await apiClient.get<MapboxResponse>(
    `/api/geocode/forward?${params.toString()}`,
  );
  return data.features ?? [];
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<PlaceFeature | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  const data = await apiClient.get<MapboxResponse>(
    `/api/geocode/reverse?${params.toString()}`,
  );
  return data.features?.[0] ?? null;
}
