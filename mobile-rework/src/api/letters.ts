import { apiClient, apiFetch } from '@/lib/apiClient';

// T421 (Sprint 65) — typed wrappers around BE love-letters routes
// (mounted at /api/love-letters in backend/src/routes/index.ts).
// Response shape mirrors LoveLetterService.mediaInclude — sender, recipient,
// photos[], audio[]. Mood is the only optional emoji field on the row;
// palette is derived client-side via paletteFor() (no BE column).

export type LetterStatus = 'DRAFT' | 'SCHEDULED' | 'DELIVERED' | 'READ';

export type LetterUserLite = {
  id: string;
  name: string | null;
  avatar: string | null;
};

export type LetterPhoto = {
  id: string;
  letterId: string;
  url: string;
  filename: string;
  createdAt: string;
};

export type LetterAudio = {
  id: string;
  letterId: string;
  url: string;
  filename: string;
  duration: number | null;
  createdAt: string;
};

export type LetterRow = {
  id: string;
  senderId: string;
  recipientId: string;
  coupleId: string;
  title: string;
  content: string;
  mood: string | null;
  status: LetterStatus;
  scheduledAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender: LetterUserLite;
  recipient: LetterUserLite;
  photos: LetterPhoto[];
  audio: LetterAudio[];
};

export function listReceived() {
  return apiClient.get<LetterRow[]>('/api/love-letters/received');
}

export function listSent() {
  return apiClient.get<LetterRow[]>('/api/love-letters/sent');
}

export function getLetter(id: string) {
  // BE auto-flips DELIVERED → READ for the recipient on this call (see
  // LoveLetterService.getOne). The dedicated PATCH /:id/mark-read is kept
  // for future flows (e.g. mark-from-notification without opening).
  return apiClient.get<LetterRow>(`/api/love-letters/${id}`);
}

export function getUnreadLettersCount() {
  return apiClient.get<{ count: number }>('/api/love-letters/unread-count');
}

// T423 (Sprint 65) — Letter Compose mutations.
// Backend validators (loveLetterSchemas.ts) require `title.min(1)` and
// `content.min(1)` on POST, so the draft-first flow seeds both fields with
// a single-space placeholder; the UI treats trimmed-empty as "no value yet"
// and the actual Send button only fires after the user has written real
// content (Lu Q1 approved Sprint 65).

export type CreateLetterInput = {
  title: string;
  content: string;
  mood?: string;
  scheduledAt?: string;
  sendNow?: boolean;
};

export type UpdateLetterInput = {
  title?: string;
  content?: string;
  mood?: string;
  scheduledAt?: string | null;
};

export function createLetter(input: CreateLetterInput) {
  return apiClient.post<LetterRow>('/api/love-letters', input);
}

export function updateLetter(id: string, input: UpdateLetterInput) {
  return apiClient.put<LetterRow>(`/api/love-letters/${id}`, input);
}

export function sendLetter(id: string) {
  return apiClient.put<LetterRow>(`/api/love-letters/${id}/send`);
}

export function deleteLetter(id: string) {
  return apiClient.del<{ ok: true }>(`/api/love-letters/${id}`);
}

type UploadFile = { uri: string; name: string; type: string };

// BE photos route uses `upload.array('photos', 5)` — accepts multiple files
// per call but the mobile uploadQueue is a per-file queue (Q7 Sprint 65 —
// 1 toast row per photo, simpler than batch). One file per multipart POST is
// fine; multer treats it as a 1-element array and returns LetterPhoto[1].
export function uploadLetterPhoto(letterId: string, file: UploadFile) {
  return apiClient.upload<LetterPhoto[]>(
    `/api/love-letters/${letterId}/photos`,
    'photos',
    file,
  );
}

export function deleteLetterPhoto(letterId: string, photoId: string) {
  return apiClient.del<{ ok: true }>(
    `/api/love-letters/${letterId}/photos/${photoId}`,
  );
}

// BE audio route uses `upload.single('audio')`; only one voice memo per
// letter (LoveLetterService.uploadAudio enforces) — re-recording requires
// deleteLetterAudio first.
//
// D61 (Sprint 65 Build 85 hot-fix): the BE controller (LoveLetterController.
// uploadAudio L98) reads `duration` from the multipart body and parseFloat's
// it into the LetterAudio.duration column (seconds). Mobile previously
// posted only the file, so the column came back NULL on every record and
// the AudioInline preview rendered "0:00 / 0:00" even when the recorder
// emitted a real durationMs. Append the duration when we know it. Build the
// FormData manually so we can attach more than one field; apiClient.upload
// is single-field only.
export function uploadLetterAudio(
  letterId: string,
  file: UploadFile,
  durationSeconds?: number | null,
) {
  const form = new FormData();
  form.append('audio', file as unknown as Blob);
  if (durationSeconds && durationSeconds > 0) {
    form.append('duration', String(durationSeconds));
  }
  return apiFetch<LetterAudio>(`/api/love-letters/${letterId}/audio`, {
    method: 'POST',
    body: form,
    skipJsonContentType: true,
  });
}

export function deleteLetterAudio(letterId: string, audioId: string) {
  return apiClient.del<{ ok: true }>(
    `/api/love-letters/${letterId}/audio/${audioId}`,
  );
}
