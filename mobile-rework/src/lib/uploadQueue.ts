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
//
// T390 (Sprint 62): MAX_CONCURRENT gate. Build 45 shipped with fire-and-forget
// enqueue from the composer, so picking 9 photos spawned 9 parallel multipart
// POSTs. iOS URLSession's host pool (default 6) coped but the RN fetch layer
// stalled on 1–2 requests → toast `uploadingCount > 0` forever → user saw a
// spinner that never settled. Gate to MAX_CONCURRENT in-flight `uploadFn`
// calls; the rest queue FIFO. Retries (both auto setTimeout + manual) must
// re-enter the gate so they don't bypass the limit.

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
// Sprint 62 T390 — Boss confirm 3 ảnh parallel vẫn hang trên wifi yếu. Serial
// là an toàn tuyệt đối. Bump sau nếu user complain chậm.
const MAX_CONCURRENT = 1;

// Callbacks + retry closures live outside the store — they're
// non-serialisable and the UI doesn't need them on re-render.
const retryTasks = new Map<string, () => void>();

// Concurrency gate — module-level, intentionally outside zustand state. Each
// scheduled task is a thunk that starts the real run; the gate only sees
// "start me when a slot frees up".
let activeCount = 0;
const pending: (() => void)[] = [];

function pump(): void {
  while (activeCount < MAX_CONCURRENT && pending.length > 0) {
    const starter = pending.shift();
    if (!starter) break;
    activeCount += 1;
    if (__DEV__) {
      console.debug(
        `[uploadQueue] slot acquired (active=${activeCount}/${MAX_CONCURRENT})`,
      );
    }
    starter();
  }
}

function schedule(task: () => Promise<void>): void {
  pending.push(() => {
    void task().finally(() => {
      activeCount = Math.max(0, activeCount - 1);
      if (__DEV__) {
        console.debug(
          `[uploadQueue] slot released, pending queue len=${pending.length}`,
        );
      }
      pump();
    });
  });
  pump();
}

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
          // Release the current slot on return; acquire a fresh one after the
          // backoff so queued uploads don't stall behind a sleeping retry.
          setTimeout(() => {
            schedule(() => run(attempt + 1));
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
          schedule(() => run(0));
        });
        onFailure?.(err);
      }
    };

    schedule(() => run(0));
  },
  retry: (id) => {
    retryTasks.get(id)?.();
  },
  dismiss: (id) => {
    // Known edge (skipped for B47): if `id` is sitting in `pending` when
    // dismissed, the closure still fires later and its `run()` will re-add
    // the entry via `write()`. Not user-reachable today — UploadProgressToast
    // only fires per-id dismiss from the internal auto-success path, never
    // from a user gesture on a pending row. Revisit if we ship a "cancel
    // this upload" affordance.
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
    pending.length = 0;
    // In-flight uploadFn calls can't be aborted (RN fetch has no AbortSignal
    // support in the apiClient wrapper); they settle naturally and their
    // finally hooks decrement activeCount. Don't touch activeCount here —
    // resetting to 0 while tasks are live would let the next enqueue exceed
    // MAX_CONCURRENT once the orphaned finallys fire.
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
