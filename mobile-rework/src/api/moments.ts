import { apiClient } from '@/lib/apiClient';

// T397/T398 (Sprint 63) — thin centralized wrappers around the moment
// CRUD endpoints that both useMomentDetailViewModel and
// useMomentCreateViewModel call. Keeping this co-located with the other
// screens' api/* pattern (currently ad-hoc inline) stops the detail +
// create VMs from drifting on path spelling ("/api/moments" vs
// "/api/moments/") or response shape assumptions.

export type MomentPhoto = {
  id: string;
  url: string;
  filename: string;
};

export type MomentDetailRow = {
  id: string;
  title: string;
  caption: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  photos: MomentPhoto[];
  tags: string[];
  location: string | null;
};

export type UpdateMomentPayload = {
  title?: string;
  caption?: string | null;
  date?: string;
  tags?: string[];
  location?: string | null;
};

export function getMoment(id: string) {
  return apiClient.get<MomentDetailRow>(`/api/moments/${id}`);
}

export function updateMoment(id: string, payload: UpdateMomentPayload) {
  return apiClient.put<MomentDetailRow>(`/api/moments/${id}`, payload);
}

export function deleteMoment(id: string) {
  return apiClient.del<{ ok: true }>(`/api/moments/${id}`);
}

export function deleteMomentPhoto(momentId: string, photoId: string) {
  return apiClient.del<{ ok: true }>(
    `/api/moments/${momentId}/photos/${photoId}`,
  );
}
