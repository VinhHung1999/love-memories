import { create } from 'zustand';

// T378 (Sprint 62) — background upload queue. Mirrors the web pattern in
// `frontend/src/lib/uploadQueue.ts` but adapted for the RN / zustand world:
//   - Caller enqueues a fire-and-forget upload; the composer dismisses the
//     modal instantly without awaiting the upload.
//   - The queue retries transient failures up to `maxRetries` (default 2)
//     before surfacing an error state. Users can manually retry from the
//     progress toast if all automatic retries fail.
//   - Successful entries auto-dismiss after AUTO_DISMISS_MS so the toast
//     doesn't linger once uploads settle.
//
// Progress %: RN `fetch()` (which apiClient.upload sits on) exposes no upload
// progress events, so entries carry a boolean `status` only. The UI shows an
// indeterminate spinner while uploading. If we later need a real % bar we can
// swap the uploader for XHR — out of scope for the moments CORE sprint.

export type UploadStatus = 'uploading' | 'success' | 'error';

export type UploadEntry = {
  id: string;
  label: string;
  status: UploadStatus;
  error?: string;
  attempts: number;
  maxRetries: number;
};

export type EnqueueInput = {
  id: string;
  label: string;
  uploadFn: () => Promise<unknown>;
  maxRetries?: number;
  onSuccess?: (result: unknown) => void;
  onFailure?: (err: unknown) => void;
};

type State = {
  uploads: Record<string, UploadEntry>;
};

type Actions = {
  enqueue: (input: EnqueueInput) => void;
  retry: (id: string) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
};

const RETRY_DELAY_MS = 800;
const AUTO_DISMISS_MS = 3000;

// Callbacks + retry closures live outside the store — they're
// non-serialisable and the UI doesn't need them on re-render.
const retryTasks = new Map<string, () => void>();

export const useUploadQueueStore = create<State & Actions>((set, get) => ({
  uploads: {},
  enqueue: ({ id, label, uploadFn, maxRetries = 2, onSuccess, onFailure }) => {
    const write = (entry: UploadEntry) =>
      set((s) => ({ uploads: { ...s.uploads, [id]: entry } }));

    const run = async (attempt: number) => {
      write({ id, label, status: 'uploading', attempts: attempt, maxRetries });
      try {
        const result = await uploadFn();
        write({ id, label, status: 'success', attempts: attempt, maxRetries });
        onSuccess?.(result);
        retryTasks.delete(id);
        setTimeout(() => {
          const current = get().uploads[id];
          if (current?.status === 'success') get().dismiss(id);
        }, AUTO_DISMISS_MS);
      } catch (err) {
        if (attempt < maxRetries) {
          setTimeout(() => {
            void run(attempt + 1);
          }, RETRY_DELAY_MS);
          return;
        }
        write({
          id,
          label,
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
          attempts: attempt,
          maxRetries,
        });
        retryTasks.set(id, () => {
          void run(0);
        });
        onFailure?.(err);
      }
    };

    void run(0);
  },
  retry: (id) => {
    retryTasks.get(id)?.();
  },
  dismiss: (id) => {
    set((s) => {
      const next = { ...s.uploads };
      delete next[id];
      return { uploads: next };
    });
    retryTasks.delete(id);
  },
  clearAll: () => {
    set({ uploads: {} });
    retryTasks.clear();
  },
}));

// Non-hook facade for callers outside React (ViewModels, submit flows). All
// operations forward to the zustand store so subscribers still re-render.
export const uploadQueue = {
  enqueue: (input: EnqueueInput) => useUploadQueueStore.getState().enqueue(input),
  retry: (id: string) => useUploadQueueStore.getState().retry(id),
  dismiss: (id: string) => useUploadQueueStore.getState().dismiss(id),
  clearAll: () => useUploadQueueStore.getState().clearAll(),
  snapshot: () => useUploadQueueStore.getState().uploads,
};
