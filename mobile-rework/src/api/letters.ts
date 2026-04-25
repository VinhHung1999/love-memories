import { apiClient } from '@/lib/apiClient';

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
