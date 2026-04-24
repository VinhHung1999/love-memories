import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  deleteMomentPhoto,
  getMoment,
  updateMoment,
} from '@/api/moments';
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
//
// T397 (Sprint 63) — edit mode. When `editingMomentId` is provided the VM
// hydrates from GET /api/moments/:id on mount (title, caption, date, tags,
// location, photos) and `onSubmit` branches to PUT for metadata + enqueues
// ONLY net-new local URIs to uploadQueue. Existing server photos are removed
// immediately via DELETE /api/moments/:id/photos/:photoId when the user taps
// the photo's × — no "save-to-confirm"; tap = gone.

// Sprint 62 T391 — Boss chốt cap 5 ảnh/moment. Bump const này → copy Vi/En tự
// nhảy qua {{max}} interpolation. Exported để các caller ngoài module này
// (CameraActionSheet caption) share cùng 1 nguồn.
export const MAX_PHOTOS = 5;
const DESCRIPTION_MAX = 2000;
const TITLE_MAX = 200;
const TAG_MAX = 40;

type MomentRow = { id: string };

// D38 (Sprint 64 Build 75) — map common iOS/Android photo extensions to the
// right Content-Type. The old branching (`ext === 'png' ? 'image/png' :
// 'image/jpeg'`) silently mislabeled HEIC/HEIF photos as JPEG; after Boss's
// iPhone upgraded to iOS-default HEIC captures the server still received
// `image/jpeg` in the multipart header but the bytes were HEIC. Multer's
// filter logged a reject in some paths, and CDN processing degraded in
// others. Mapping each known extension to its real MIME lets the BE
// whitelist (which now includes HEIC/HEIF) accept exactly what the file is.
function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'png':  return 'image/png';
    case 'webp': return 'image/webp';
    case 'gif':  return 'image/gif';
    case 'heic': return 'image/heic';
    case 'heif': return 'image/heif';
    default:     return 'image/jpeg';
  }
}

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

export function useMomentCreateViewModel(
  initialPhotos: string[],
  editingMomentId?: string,
) {
  const editMode = !!editingMomentId;

  const [photos, setPhotos] = useState<string[]>(() =>
    editMode ? [] : initialPhotos.slice(0, MAX_PHOTOS),
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [takenAt, setTakenAt] = useState<Date>(() => new Date());
  // Parallel map of server-side photo URI → photo row ID. Entries are only
  // present for photos loaded from GET; net-new local URIs added via
  // addMorePhotos aren't in here. onSubmit uses this to decide which URIs go
  // through the uploadQueue vs which ones are already on the server.
  const [serverPhotoIds, setServerPhotoIds] = useState<Record<string, string>>({});
  // Preserved across edit — the PUT payload round-trips it unchanged. T399
  // will add a picker; until then edit mode preserves whatever the moment
  // already had.
  const [location, setLocation] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initializing, setInitializing] = useState(editMode);
  const [loadError, setLoadError] = useState(false);

  // Hydrate from server on mount when in edit mode. Cancel-guarded so an
  // unmount mid-fetch doesn't stomp state.
  useEffect(() => {
    if (!editingMomentId) return;
    let cancelled = false;
    (async () => {
      try {
        const row = await getMoment(editingMomentId);
        if (cancelled) return;
        setTitle(row.title);
        setDescription(row.caption ?? '');
        setTags(row.tags ?? []);
        setTakenAt(new Date(row.date));
        setLocation(row.location);
        const uris = row.photos.map((p) => p.url);
        const idMap: Record<string, string> = {};
        row.photos.forEach((p) => {
          idMap[p.url] = p.id;
        });
        setPhotos(uris);
        setServerPhotoIds(idMap);
        setInitializing(false);
      } catch {
        if (cancelled) return;
        setLoadError(true);
        setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editingMomentId]);

  const canSubmit =
    title.trim().length >= 1 &&
    photos.length > 0 &&
    !submitting &&
    !initializing;

  const removePhoto = useCallback(
    (uri: string) => {
      setPhotos((prev) => prev.filter((p) => p !== uri));
      const serverId = serverPhotoIds[uri];
      if (serverId && editingMomentId) {
        // Fire-and-forget — server-side row is a thin join table; if the
        // DELETE fails the CDN asset lingers but the moment row is fine.
        // Don't surface an alert mid-edit; user's next PUT will land
        // regardless. Log to console for future telemetry.
        deleteMomentPhoto(editingMomentId, serverId).catch(() => {
          console.warn('[moment edit] deleteMomentPhoto failed', serverId);
        });
        setServerPhotoIds((prev) => {
          const next = { ...prev };
          delete next[uri];
          return next;
        });
      }
    },
    [editingMomentId, serverPhotoIds],
  );

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

  // T378/T397 — submit flow. Create mode POSTs a new row then enqueues all
  // photos. Edit mode PUTs metadata then enqueues only the net-new local
  // URIs (server photos are already up there). Photo uploads are handed to
  // uploadQueue and fire after we return.
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

      const invalidate = useMomentsStore.getState().invalidate;

      if (editingMomentId) {
        // Include every editable field on PUT so the user's edits actually
        // round-trip — omitting `location` here (original T397 mistake) made
        // the endpoint treat it as "unchanged", so clearing or swapping a
        // pin in edit mode silently no-op'd. Sparse update semantics mean
        // an explicit null clears; an explicit string replaces.
        //
        // D31 (Sprint 64 Build 71): caption sent as plain (trimmed) string,
        // even when empty. Previously we sent `null` for empty, but the BE
        // `createMomentSchema.caption` was `z.string().optional()` (not
        // nullable), so the `null` was silently rejected with a Zod 400 —
        // the whole PUT failed and Boss saw "can't save moment unless I
        // add a description". The BE schema has been fixed to
        // `.nullable().optional()` in this same commit, but sending "" is
        // the belt-and-suspenders fix: empty string is a valid `z.string()`
        // so it works against OLD BE builds still in prod during the
        // rolling deploy window. Empty-string caption reads identically
        // to null in the UI (`row.caption ?? ''`).
        await updateMoment(editingMomentId, {
          title: finalTitle,
          caption: trimmedDesc,
          date: takenAt.toISOString(),
          tags,
          location: location && location.trim().length > 0 ? location : null,
        });
        invalidate();

        const newLocal = photos.filter((uri) => !serverPhotoIds[uri]);
        const total = newLocal.length;
        let remaining = total;

        newLocal.forEach((uri, index) => {
          const filename =
            uri.split('/').pop() || `moment-${Date.now()}-${index}.jpg`;
          const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
          const type = mimeFromExt(ext);
          const id = `moment-edit-${editingMomentId}-${index}-${Date.now()}`;
          uploadQueue.enqueue({
            id,
            label: filename,
            uploadFn: () =>
              apiClient.upload(
                `/api/moments/${editingMomentId}/photos`,
                'photos',
                { uri, name: filename, type },
              ),
            onSuccess: () => {
              remaining -= 1;
              if (remaining === 0) invalidate();
            },
          });
        });

        return { ok: true, momentId: editingMomentId };
      }

      const moment = await apiClient.post<MomentRow>('/api/moments', {
        title: finalTitle,
        caption: trimmedDesc.length > 0 ? trimmedDesc : undefined,
        date: takenAt.toISOString(),
        tags: tags.length > 0 ? tags : undefined,
        location: location && location.trim().length > 0 ? location : undefined,
      });

      const momentId = moment.id;
      // Bump immediately — the moment row exists even if photos trickle in
      // later. Dashboard + Moments list pull a cover once the first photo
      // lands via a second refetch from the toast's on-success hook below.
      invalidate();

      const total = photos.length;
      let remaining = total;

      photos.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `moment-${Date.now()}-${index}.jpg`;
        const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
        const type = mimeFromExt(ext);
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
  }, [
    canSubmit,
    title,
    description,
    takenAt,
    photos,
    tags,
    location,
    editingMomentId,
    serverPhotoIds,
  ]);

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
    location,
    setLocation,
    submitting,
    canSubmit,
    initializing,
    loadError,
    editMode,
    limits,
    removePhoto,
    addMorePhotos,
    onSubmit,
  };
}
