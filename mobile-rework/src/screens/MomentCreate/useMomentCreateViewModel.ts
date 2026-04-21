import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useState } from 'react';

import { apiClient, ApiError } from '@/lib/apiClient';
import { uploadQueue } from '@/lib/uploadQueue';
import i18n from '@/locales/i18n';
import { useMomentsStore } from '@/stores/momentsStore';

// T378 (Sprint 62) — ViewModel for the "new moment" composer. Owns:
//   - local photo URI list (up to MAX_PHOTOS, dedup on append),
//   - description + takenAt form state,
//   - submit flow: POST /api/moments then fire-and-forget upload enqueues.
//
// Submit does NOT await photo uploads. The composer calls `onSubmit`, awaits
// just the moment-row creation, then the caller dismisses the modal. Uploads
// keep running in the background via uploadQueue — the global
// UploadProgressToast renders progress across whatever screen the user is on.

const MAX_PHOTOS = 10;
const DESCRIPTION_MAX = 2000;
const TITLE_MAX = 200;

type MomentRow = { id: string };

// T378 fix — backend `createMomentSchema` requires title (1..200), caption
// optional, date ISO string. Composer UI stays 1-screen (no title input per
// Boss), so we derive title here: first non-empty line of description trimmed
// to TITLE_MAX; empty → locale-formatted fallback using takenAt.
function deriveTitle(description: string, takenAt: Date): string {
  const firstLine = description.split('\n')[0]?.trim() ?? '';
  if (firstLine.length >= 1) return firstLine.slice(0, TITLE_MAX);
  const lang = i18n.language?.startsWith('vi') ? 'vi-VN' : 'en-US';
  const formatted = (() => {
    try {
      return new Intl.DateTimeFormat(lang, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(takenAt);
    } catch {
      return takenAt.toISOString().slice(0, 10);
    }
  })();
  return i18n.t('compose.momentCreate.autoTitleFallback', { date: formatted });
}

export type SubmitResult =
  | { ok: true; momentId: string }
  | { ok: false; reason: 'network' | 'validation' | 'unknown' };

export function useMomentCreateViewModel(initialPhotos: string[]) {
  const [photos, setPhotos] = useState<string[]>(() =>
    initialPhotos.slice(0, MAX_PHOTOS),
  );
  const [description, setDescription] = useState('');
  const [takenAt, setTakenAt] = useState<Date>(() => new Date());
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = photos.length > 0 && !submitting;

  const removePhoto = useCallback((uri: string) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  }, []);

  const addMorePhotos = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.length) return;
    setPhotos((prev) => {
      const seen = new Set(prev);
      const additions: string[] = [];
      for (const asset of res.assets) {
        if (!seen.has(asset.uri) && prev.length + additions.length < MAX_PHOTOS) {
          additions.push(asset.uri);
          seen.add(asset.uri);
        }
      }
      return [...prev, ...additions];
    });
  }, [photos.length]);

  // T378 — submit flow. Returns the moment id on success so the caller can
  // dismiss + optionally navigate to the detail screen. Photo uploads are
  // handed to uploadQueue and fire after we return.
  const onSubmit = useCallback(async (): Promise<SubmitResult> => {
    if (!canSubmit) return { ok: false, reason: 'validation' };
    setSubmitting(true);
    try {
      const trimmed = description.trim();
      const moment = await apiClient.post<MomentRow>('/api/moments', {
        title: deriveTitle(description, takenAt),
        caption: trimmed.length > 0 ? trimmed : undefined,
        date: takenAt.toISOString(),
      });

      const momentId = moment.id;
      const invalidate = useMomentsStore.getState().invalidate;
      // Bump immediately — the moment row exists even if photos trickle in
      // later. Dashboard + Moments list pull a cover once the first photo
      // lands via a second refetch from the toast's on-success hook below.
      invalidate();

      const total = photos.length;
      let remaining = total;

      photos.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `moment-${Date.now()}-${index}.jpg`;
        const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
        const type = ext === 'png' ? 'image/png' : 'image/jpeg';
        const id = `moment-${momentId}-${index}-${Date.now()}`;
        uploadQueue.enqueue({
          id,
          label: filename,
          uploadFn: () =>
            apiClient.upload(`/api/moments/${momentId}/photos`, 'photos', {
              uri,
              name: filename,
              type,
            }),
          onSuccess: () => {
            remaining -= 1;
            // Refresh again on first photo + on the last one so the card
            // gets its cover and final thumbnails without polling.
            if (remaining === total - 1 || remaining === 0) invalidate();
          },
        });
      });

      return { ok: true, momentId };
    } catch (err) {
      if (err instanceof ApiError) {
        return { ok: false, reason: err.status >= 400 && err.status < 500 ? 'validation' : 'network' };
      }
      return { ok: false, reason: 'unknown' };
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, description, takenAt, photos]);

  const limits = useMemo(
    () => ({ max: MAX_PHOTOS, descriptionMax: DESCRIPTION_MAX }),
    [],
  );

  return {
    photos,
    description,
    setDescription,
    takenAt,
    setTakenAt,
    submitting,
    canSubmit,
    limits,
    removePhoto,
    addMorePhotos,
    onSubmit,
  };
}
