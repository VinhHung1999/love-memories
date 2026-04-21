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
//
// T394 (Sprint 62): pending entries weren't counted in the toast. With serial
// gate, `enqueue` pushed a thunk into `pending[]` but didn't write the entry
// to zustand until `run()` actually started — so `Object.values(uploads).length`
// was 1 while the user had picked 5 photos. Toast showed "1/1" instead of
// "1/5". Fix: eager-seed the entry during enqueue() before `schedule()`, so
// `total` reflects the full batch from the first tick. Paired with batch-level
// auto-dismiss (replaced per-success setTimeout) — per-success dismiss shrunk
// `total` mid-batch and jittered the progress counter.

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

export const useUploadQueueStore = create<State & Actions>((set, get) => {
  // T394 — batch auto-dismiss. Per-success setTimeout(dismiss(id)) shrank
  // `total` mid-batch and jittered the serial progress counter. Instead,
  // schedule a single timer when the queue is fully idle (no uploading, no
  // errors); on fire, re-check idle then drop all success rows in one set().
  // Error rows stay so the user can retry. Overlapping timers are safe — the
  // re-check inside the callback guards the actual mutation, so a second
  // firing is a no-op.
  const scheduleBatchDismissIfIdle = (): void => {
    const entries = Object.values(get().uploads);
    const anyUploading = entries.some((e) => e.status === 'uploading');
    if (anyUploading) return;
    const anyErrors = entries.some((e) => e.status === 'error');
    if (anyErrors) return;
    setTimeout(() => {
      const now = Object.values(get().uploads);
      const stillIdle = !now.some(
        (e) => e.status === 'uploading' || e.status === 'error',
      );
      if (!stillIdle) return;
      set((s) => {
        const next: Record<string, UploadEntry> = { ...s.uploads };
        for (const e of Object.values(s.uploads)) {
          if (e.status === 'success') delete next[e.id];
        }
        return { uploads: next };
      });
    }, AUTO_DISMISS_MS);
  };

  return {
    uploads: {},
    enqueue: ({ id, label, uploadFn, maxRetries = 2, onSuccess, onFailure }) => {
      const write = (entry: UploadEntry) =>
        set((s) => ({ uploads: { ...s.uploads, [id]: entry } }));

      // T394 — eager pre-seed so pending entries count toward `total` in the
      // toast. Without this, 4 of 5 photos sit in `pending[]` with no store
      // entry, and the toast renders "1/1" until each run() starts.
      write({ id, label, status: 'uploading', attempts: 0, maxRetries });

      const run = async (attempt: number) => {
        write({ id, label, status: 'uploading', attempts: attempt, maxRetries });
        try {
          const result = await uploadFn();
          write({ id, label, status: 'success', attempts: attempt, maxRetries });
          onSuccess?.(result);
          retryTasks.delete(id);
          scheduleBatchDismissIfIdle();
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
          // Error doesn't trigger dismiss (guard inside skips when anyErrors),
          // but fire the check anyway so a later manual dismiss() of the error
          // row re-evaluates the idle state via its own setState callback path.
          scheduleBatchDismissIfIdle();
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
      // T394 — after manual dismiss (e.g. user dismissed an error row) check
      // whether the queue is now idle + success-only, so the remaining success
      // rows can auto-unmount.
      scheduleBatchDismissIfIdle();
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
  };
});

// Non-hook facade for callers outside React (ViewModels, submit flows). All
// operations forward to the zustand store so subscribers still re-render.
export const uploadQueue = {
  enqueue: (input: EnqueueInput) => useUploadQueueStore.getState().enqueue(input),
  retry: (id: string) => useUploadQueueStore.getState().retry(id),
  dismiss: (id: string) => useUploadQueueStore.getState().dismiss(id),
  clearAll: () => useUploadQueueStore.getState().clearAll(),
  snapshot: () => useUploadQueueStore.getState().uploads,
};
