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
const TAG_MAX = 40;

type MomentRow = { id: string };

// T385 (Sprint 62 polish) — Boss wants the literal prototype: explicit title
// input 34px. VM now owns `title` state; canSubmit gates on non-empty title.
// `deriveTitle` kept only as a defensive fallback inside POST — in normal flow
// canSubmit blocks submit unless title is set.
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

export type AddTagResult =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'too_long' | 'duplicate' };

export function useMomentCreateViewModel(initialPhotos: string[]) {
  const [photos, setPhotos] = useState<string[]>(() =>
    initialPhotos.slice(0, MAX_PHOTOS),
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [takenAt, setTakenAt] = useState<Date>(() => new Date());
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    title.trim().length >= 1 && photos.length > 0 && !submitting;

  const removePhoto = useCallback((uri: string) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  }, []);

  const addTag = useCallback((raw: string): AddTagResult => {
    const trimmed = raw.trim();
    if (trimmed.length < 1) return { ok: false, reason: 'empty' };
    if (trimmed.length > TAG_MAX) return { ok: false, reason: 'too_long' };
    let dup = false;
    setTags((prev) => {
      if (prev.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        dup = true;
        return prev;
      }
      return [...prev, trimmed];
    });
    return dup ? { ok: false, reason: 'duplicate' } : { ok: true };
  }, []);

  const removeTag = useCallback((label: string) => {
    setTags((prev) => prev.filter((t) => t !== label));
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
      const trimmedDesc = description.trim();
      const trimmedTitle = title.trim();
      const finalTitle =
        trimmedTitle.length > 0
          ? trimmedTitle.slice(0, TITLE_MAX)
          : deriveTitle(description, takenAt);
      const moment = await apiClient.post<MomentRow>('/api/moments', {
        title: finalTitle,
        caption: trimmedDesc.length > 0 ? trimmedDesc : undefined,
        date: takenAt.toISOString(),
        tags: tags.length > 0 ? tags : undefined,
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
  }, [canSubmit, title, description, takenAt, photos, tags]);

  const limits = useMemo(
    () => ({
      max: MAX_PHOTOS,
      descriptionMax: DESCRIPTION_MAX,
      titleMax: TITLE_MAX,
      tagMax: TAG_MAX,
    }),
    [],
  );

  return {
    photos,
    title,
    setTitle,
    description,
    setDescription,
    tags,
    addTag,
    removeTag,
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
