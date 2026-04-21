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

// T401 — comments. BE row shape joins user {name, avatar} so the mobile
// avatar + display name render without extra lookup. userId is null for
// legacy/anonymous comments (pre-Sprint 32); currently-authenticated
// posts always carry it.
export type MomentCommentRow = {
  id: string;
  momentId: string;
  userId: string | null;
  author: string;
  content: string;
  createdAt: string;
  user: { name: string; avatar: string | null } | null;
};

export function listComments(momentId: string) {
  return apiClient.get<MomentCommentRow[]>(
    `/api/moments/${momentId}/comments`,
  );
}

export function addComment(
  momentId: string,
  author: string,
  content: string,
) {
  return apiClient.post<MomentCommentRow>(
    `/api/moments/${momentId}/comments`,
    { author, content },
  );
}

export function deleteComment(momentId: string, commentId: string) {
  return apiClient.del<{ ok: true }>(
    `/api/moments/${momentId}/comments/${commentId}`,
  );
}
