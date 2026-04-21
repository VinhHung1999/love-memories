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

// T400 — backend row shape for a single reaction record. One row per
// (momentId, emoji, author). Mobile aggregates these into per-emoji pills.
export type MomentReactionRow = {
  id: string;
  momentId: string;
  emoji: string;
  author: string;
  createdAt: string;
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
  reactions?: MomentReactionRow[];
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

// T400 — toggle reaction. Backend returns the fresh reactions list for the
// moment after applying the toggle (create if missing, delete if present).
export function toggleReaction(
  momentId: string,
  emoji: string,
  author: string,
) {
  return apiClient.post<MomentReactionRow[]>(
    `/api/moments/${momentId}/reactions`,
    { emoji, author },
  );
}
