// T412 — one-shot callback bus for the location picker route.
// The location picker lives at `app/(modal)/location-picker.tsx` and is
// pushed via `router.push('/location-picker', ...)` from any screen that
// wants a place name. Result delivery uses a module-level pending callback
// (not nav params) because expo-router doesn't pass params back on
// `router.back`, and a Zustand store for a single-shot value would be
// overkill for a transient wizard-style handoff.
//
// Lifecycle:
//   1. Caller: `registerCommit(cb); router.push('/location-picker', { current })`
//   2. Picker onPick:  `commit(placeName); router.back()`
//   3. Picker onClear: `commit(null); router.back()`
//   4. Swipe-dismiss / X-close: no commit — caller keeps previous value.

type Result = string | null;
type Commit = (result: Result) => void;

let pending: Commit | null = null;

export function registerCommit(cb: Commit) {
  pending = cb;
}

export function commit(result: Result) {
  const cb = pending;
  pending = null;
  cb?.(result);
}

export function cancel() {
  pending = null;
}
