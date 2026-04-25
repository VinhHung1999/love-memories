import { cacheDirectory, copyAsync } from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  createLetter,
  deleteLetter,
  deleteLetterAudio,
  deleteLetterPhoto,
  getLetter,
  type LetterAudio,
  type LetterPhoto,
  type LetterRow,
  sendLetter,
  updateLetter,
  uploadLetterAudio,
  uploadLetterPhoto,
} from '@/api/letters';
import { ApiError } from '@/lib/apiClient';
import { uploadQueue } from '@/lib/uploadQueue';
import { useAuthStore } from '@/stores/authStore';
import { useLettersStore } from '@/stores/lettersStore';

// T423 (Sprint 65) — Letter Compose VM. Three entry modes via route params:
//
//   1. No params       → create a fresh DRAFT on mount (placeholder ' ' for
//                        title + content per Lu Q1; BE Zod requires min(1)).
//   2. id={draftId}    → load an existing DRAFT and edit it (Drafts tab tap).
//   3. replyTo={id}    → fetch the original letter, then create a new DRAFT
//                        with title='Re: {orig.title}', mood=orig.mood, body
//                        placeholder ' '. If the orig fetch fails, fall back
//                        to a fresh empty draft (Lu Q2).
//
// Auto-save: title / content / mood mutations debounce 500ms via setTimeout
// then PUT the field through to the BE. Photos / audio uploads also live on
// the draft so the BE has a letterId to attach them to.
//
// Send: PUT /:id with current draft state, then PUT /:id/send → status
// DELIVERED. Invalidates lettersStore so the Inbox refetches.
//
// D40 (Build 76 hot-fix): scheduling is gone. The "Hẹn gửi" attachment chip,
// ScheduleSheet component, scheduledAt state and SCHEDULED status flip have
// all been removed. The Send pill is always 'Gửi'. BE still supports
// SCHEDULED letters but no UI flow creates them anymore.
//
// Photos: ImagePicker → uploadQueue.enqueue per file (Q7 Sprint 65 mirror
// MomentCreate pattern). Audio: expo-audio recorder writes a local URI →
// uploadQueue.enqueue → POST /:id/audio. Single audio entity per letter
// (BE LoveLetterService enforces).
//
// Discard: dirty = title || content || photos || audio || mood. Empty back
// → DELETE draft + back. Dirty back → DiscardSheet (Lưu nháp keeps DRAFT,
// Bỏ → DELETE).

const MAX_PHOTOS = 5;
const SAVE_DEBOUNCE_MS = 500;
const PLACEHOLDER = ' ';

type ErrorReason = 'network' | 'unknown';

export type SubmitResult =
  | { ok: true; mode: 'sent' }
  | { ok: false; reason: 'empty' | 'network' | 'unknown' };

type State = {
  draftId: string | null;
  mood: string | null;
  title: string; // user-visible value (leading-trailing whitespace allowed)
  content: string;
  photos: LetterPhoto[];
  audio: LetterAudio | null;
  partnerName: string | null;
  partnerId: string | null;
  loading: boolean;
  error: ErrorReason | null;
  sending: boolean;
};

const INITIAL: State = {
  draftId: null,
  mood: null,
  title: '',
  content: '',
  photos: [],
  audio: null,
  partnerName: null,
  partnerId: null,
  loading: true,
  error: null,
  sending: false,
};

function reasonFor(err: unknown): ErrorReason {
  return err instanceof ApiError && err.status === 0 ? 'network' : 'unknown';
}

function visibleFromBe(value: string): string {
  // Treat the single-space placeholder as empty in the UI; otherwise leave
  // user content as-is (preserve their leading whitespace if they chose it).
  return value === PLACEHOLDER ? '' : value;
}

function bePayload(value: string): string {
  // Mirror image of visibleFromBe — empty-trimmed input goes back to BE as
  // the placeholder so Zod min(1) keeps passing.
  return value.trim().length === 0 ? PLACEHOLDER : value;
}

function rowToState(row: LetterRow, currentUserId: string | null): Partial<State> {
  // partner = whichever side is NOT current user
  const partner =
    row.recipient.id === currentUserId ? row.sender : row.recipient;
  return {
    draftId: row.id,
    mood: row.mood,
    title: visibleFromBe(row.title),
    content: visibleFromBe(row.content),
    photos: row.photos,
    audio: row.audio[0] ?? null,
    partnerName: partner.name,
    partnerId: partner.id,
  };
}

export type ComposeParams = {
  id?: string;
  replyTo?: string;
};

export function useLetterComposeViewModel(params: ComposeParams) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const invalidate = useLettersStore((s) => s.invalidate);

  const [state, setState] = useState<State>(INITIAL);

  // Debounced save plumbing — single timer per field that gets cleared on
  // each new keystroke. On unmount or explicit flush() we dispatch the
  // pending payload immediately.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayload = useRef<{
    title?: string;
    content?: string;
    mood?: string;
  }>({});
  const draftIdRef = useRef<string | null>(null);

  const flushPending = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const id = draftIdRef.current;
    const payload = pendingPayload.current;
    pendingPayload.current = {};
    if (!id) return;
    if (
      payload.title === undefined &&
      payload.content === undefined &&
      payload.mood === undefined
    ) {
      return;
    }
    try {
      const next = await updateLetter(id, {
        ...(payload.title !== undefined && { title: bePayload(payload.title) }),
        ...(payload.content !== undefined && {
          content: bePayload(payload.content),
        }),
        ...(payload.mood !== undefined && { mood: payload.mood }),
      });
      // Reconcile photos/audio in case other devices changed them — cheap.
      setState((prev) => ({ ...prev, photos: next.photos }));
    } catch {
      // Auto-save errors are silent — the user is still typing. The Send
      // button retries the full payload anyway.
    }
  }, []);

  const queueSave = useCallback(
    (patch: { title?: string; content?: string; mood?: string }) => {
      pendingPayload.current = { ...pendingPayload.current, ...patch };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void flushPending();
      }, SAVE_DEBOUNCE_MS);
    },
    [flushPending],
  );

  // Mount: pick the right entry mode.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        // Mode 1: edit existing draft.
        if (params.id) {
          const row = await getLetter(params.id);
          if (cancelled) return;
          const next = rowToState(row, userId);
          draftIdRef.current = next.draftId ?? null;
          setState((prev) => ({ ...prev, ...next, loading: false, error: null }));
          return;
        }

        // Mode 3: reply-prefill — fetch original, build initial fields, then
        // POST a fresh DRAFT with those values seeded (Lu Q2).
        let prefillTitle = PLACEHOLDER;
        let prefillContent = PLACEHOLDER;
        let prefillMood: string | undefined;
        if (params.replyTo) {
          try {
            const orig = await getLetter(params.replyTo);
            prefillTitle = `Re: ${orig.title.trim() || ''}`.trim();
            if (prefillTitle === 'Re:') prefillTitle = PLACEHOLDER;
            if (orig.mood) prefillMood = orig.mood;
          } catch {
            // Silent fall-through to plain empty draft.
          }
        }

        // Mode 2: fresh draft (or seeded reply).
        const created = await createLetter({
          title: prefillTitle,
          content: prefillContent,
          ...(prefillMood ? { mood: prefillMood } : {}),
        });
        if (cancelled) return;
        const next = rowToState(created, userId);
        draftIdRef.current = next.draftId ?? null;
        setState((prev) => ({ ...prev, ...next, loading: false, error: null }));
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false, error: reasonFor(err) }));
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
    // params.id / replyTo are static for the lifetime of one screen mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flush any pending save on unmount.
  useEffect(() => {
    return () => {
      void flushPending();
    };
  }, [flushPending]);

  const setTitle = useCallback(
    (next: string) => {
      setState((prev) => ({ ...prev, title: next }));
      queueSave({ title: next });
    },
    [queueSave],
  );

  const setContent = useCallback(
    (next: string) => {
      setState((prev) => ({ ...prev, content: next }));
      queueSave({ content: next });
    },
    [queueSave],
  );

  const setMood = useCallback(
    (next: string | null) => {
      setState((prev) => ({ ...prev, mood: next }));
      queueSave({ mood: next ?? '' });
    },
    [queueSave],
  );

  const pickPhotos = useCallback(async () => {
    const id = draftIdRef.current;
    if (!id) return;
    const remaining = MAX_PHOTOS - state.photos.length;
    if (remaining <= 0) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.length) return;

    res.assets.forEach((asset, idx) => {
      const fallbackName = `letter-${id}-${Date.now()}-${idx}.jpg`;
      const filename = asset.fileName ?? fallbackName;
      const ext = (filename.split('.').pop() ?? 'jpg').toLowerCase();
      const type = mimeFromExt(ext);
      const queueId = `letter-photo-${id}-${idx}-${Date.now()}`;
      uploadQueue.enqueue({
        id: queueId,
        label: filename,
        uploadFn: () =>
          uploadLetterPhoto(id, {
            uri: asset.uri,
            name: filename,
            type,
          }),
        onSuccess: (result) => {
          // BE returns LetterPhoto[1] (multer.array even for 1 file).
          const created = (result as LetterPhoto[])[0];
          if (!created) return;
          setState((prev) =>
            prev.photos.some((p) => p.id === created.id)
              ? prev
              : { ...prev, photos: [...prev.photos, created] },
          );
        },
      });
    });
  }, [state.photos.length]);

  const removePhoto = useCallback(async (photoId: string) => {
    const id = draftIdRef.current;
    if (!id) return;
    setState((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== photoId),
    }));
    try {
      await deleteLetterPhoto(id, photoId);
    } catch {
      // best-effort; the user will see a stale entry vanish either way.
    }
  }, []);

  const setAudioFromRecording = useCallback(
    async (uri: string, durationMs: number) => {
      const id = draftIdRef.current;
      if (!id) return;
      // If an existing audio already attached, delete it first — BE only
      // allows one voice memo per letter.
      if (state.audio) {
        try {
          await deleteLetterAudio(id, state.audio.id);
        } catch {
          /* swallow */
        }
        setState((prev) => ({ ...prev, audio: null }));
      }

      // D52 (Sprint 65 Build 80 hot-fix): root cause for "Only audio files
      // are allowed" reject — iOS RN FormData INFERS the multipart Content-
      // Type from the URI's file extension, OVERRIDING our hardcoded
      // `type: 'audio/mp4'`. expo-audio's iOS recorder writes the file with
      // a CAF container even though the RecordingPresets.HIGH_QUALITY
      // declares `extension: '.m4a'`, so iOS infers audio/x-caf which BE
      // multer rejects.
      //
      // Fix: copy the recorder file into the cache dir with a forced .m4a
      // extension before upload. iOS now infers audio/mp4 from the .m4a
      // suffix, BE accepts (whitelist: webm/mp4/mpeg/ogg/wav), and the
      // declared `type: 'audio/mp4'` is consistent with the inferred MIME.
      // Legacy mobile/api.ts works because react-native-audio-recorder-
      // player writes directly to a .m4a path with no container override.
      const normalizedUri = uri.startsWith('file://') ? uri : `file://${uri}`;
      const ts = Date.now();
      const targetUri = `${cacheDirectory ?? ''}letter-audio-${id}-${ts}.m4a`;
      try {
        await copyAsync({ from: normalizedUri, to: targetUri });
      } catch (copyErr) {
        if (__DEV__) {
          console.warn('[letter-audio] copyAsync failed', copyErr);
        }
        // Fall back to the original URI — it'll most likely still fail the
        // BE filter but the upload error toast surfaces a signal at least.
      }
      const filename = 'memo.m4a';
      const type = 'audio/mp4';
      const queueId = `letter-audio-${id}-${ts}`;
      if (__DEV__) {
        console.debug('[letter-audio] enqueue', {
          rawUri: uri,
          normalizedUri,
          targetUri,
          filename,
          type,
          durationMs,
        });
      }
      uploadQueue.enqueue({
        id: queueId,
        label: filename,
        kind: 'audio',
        uploadFn: () =>
          uploadLetterAudio(id, {
            uri: targetUri,
            name: filename,
            type,
          }),
        onSuccess: (result) => {
          const created = result as LetterAudio;
          setState((prev) => ({
            ...prev,
            audio: {
              ...created,
              duration:
                created.duration ?? (Math.round(durationMs / 1000) || null),
            },
          }));
        },
      });
    },
    [state.audio],
  );

  const removeAudio = useCallback(async () => {
    const id = draftIdRef.current;
    const current = state.audio;
    if (!id || !current) return;
    setState((prev) => ({ ...prev, audio: null }));
    try {
      await deleteLetterAudio(id, current.id);
    } catch {
      /* swallow */
    }
  }, [state.audio]);

  const dirty = useMemo(() => {
    return (
      state.title.trim().length > 0 ||
      state.content.trim().length > 0 ||
      state.photos.length > 0 ||
      state.audio !== null ||
      state.mood !== null
    );
  }, [state]);

  const canSubmit = useMemo(
    () =>
      !state.sending &&
      !!state.draftId &&
      (state.title.trim().length > 0 || state.content.trim().length > 0),
    [state.sending, state.draftId, state.title, state.content],
  );

  const submit = useCallback(async (): Promise<SubmitResult> => {
    const id = draftIdRef.current;
    if (!id) return { ok: false, reason: 'unknown' };
    if (state.title.trim().length === 0 && state.content.trim().length === 0) {
      return { ok: false, reason: 'empty' };
    }
    setState((prev) => ({ ...prev, sending: true }));
    try {
      // Flush any pending debounce so what we send is what the user sees,
      // then persist body + mood once before flipping to DELIVERED.
      await flushPending();
      await updateLetter(id, {
        title: bePayload(state.title),
        content: bePayload(state.content),
        ...(state.mood !== null && { mood: state.mood }),
        // D40: scheduledAt: null guarantees the BE doesn't keep a stale
        // SCHEDULED status from a legacy draft we may have loaded.
        scheduledAt: null,
      });
      await sendLetter(id);
      invalidate();
      setState((prev) => ({ ...prev, sending: false }));
      return { ok: true, mode: 'sent' };
    } catch (err) {
      setState((prev) => ({ ...prev, sending: false }));
      return { ok: false, reason: reasonFor(err) };
    }
  }, [state.title, state.content, state.mood, flushPending, invalidate]);

  const saveDraftAndExit = useCallback(async () => {
    // Flush pending then leave the DRAFT alive on the server.
    await flushPending();
    invalidate();
  }, [flushPending, invalidate]);

  const discardDraft = useCallback(async () => {
    const id = draftIdRef.current;
    if (!id) return;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    pendingPayload.current = {};
    try {
      await deleteLetter(id);
    } catch {
      /* user-initiated discard; ignore failure */
    }
    invalidate();
  }, [invalidate]);

  return {
    // identity
    draftId: state.draftId,
    partnerName: state.partnerName,

    // form state
    mood: state.mood,
    title: state.title,
    content: state.content,
    photos: state.photos,
    audio: state.audio,
    photosRemaining: MAX_PHOTOS - state.photos.length,
    maxPhotos: MAX_PHOTOS,

    // request lifecycle
    loading: state.loading,
    error: state.error,
    sending: state.sending,
    canSubmit,
    dirty,

    // actions
    setTitle,
    setContent,
    setMood,
    pickPhotos,
    removePhoto,
    setAudioFromRecording,
    removeAudio,
    submit,
    saveDraftAndExit,
    discardDraft,
  };
}

// D50→D51 — the dynamic audioMimeFromExt() helper from Build 79 was reverted
// to the legacy hardcoded 'audio/mp4' label per Lu's BE-multer analysis (BE
// validates the declared mimetype string only, not file content). Helper
// retained-as-comment so we can rewire it if a future preset adds a non-
// MP4 codec; deleted from runtime to silence the unused-vars warning.

// Map common image extensions → MIME for FormData. Lifted from MomentCreate
// (D38 Sprint 64 lesson — iOS HEIC default needs the right MIME or BE
// rejects). Letters allow the same set per backend/middleware/upload.ts.
function mimeFromExt(ext: string): string {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}
