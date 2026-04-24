// T367 recon — in-memory event bus for BottomSheet auto-reopen recon.
// Sheets call `t367Log()` at every lifecycle point (present / dismiss /
// onChange / onDismiss). The harness starts recording, runs a matrix of
// open/close cycles, stops recording, then walks the buffer to flag
// anomalies. Single-file module so it can be deleted cleanly when T367
// ships — no lingering cross-cutting util.

export type T367SheetName =
  | 'EditCoupleIdentity'
  | 'Anniversary'
  | 'EditProfile'
  | 'ComingSoon';

export type T367EventKind =
  | 'open-present' // imperative .open() → .present()
  | 'close-dismiss' // imperative .close() → .dismiss()
  | 'onChange'
  | 'onDismiss';

export type T367Event = {
  t: number; // Date.now() ms
  sheet: T367SheetName;
  kind: T367EventKind;
  idx?: number; // only for onChange
};

const buffer: T367Event[] = [];
let recording = false;

export function t367Log(
  sheet: T367SheetName,
  kind: T367EventKind,
  idx?: number,
): void {
  // Console line is kept so tail-streaming the Metro log remains useful even
  // without the harness running (manual repro on device / simulator).
  const tag =
    idx !== undefined ? `${kind} idx=${idx}` : kind;
  console.debug(`[T367 ${sheet}] ${tag}`);
  if (recording) {
    buffer.push({ t: Date.now(), sheet, kind, idx });
  }
}

export function t367StartRecording(): void {
  buffer.length = 0;
  recording = true;
}

export function t367StopRecording(): T367Event[] {
  recording = false;
  return [...buffer];
}

// Anomaly = an auto-reopen signal. Canonical sequence per cycle:
//   open-present → onChange idx=0 → close-dismiss → onChange idx=-1 → onDismiss
// An auto-reopen shows up as either:
//   (a) onChange idx=0 NOT preceded by a same-sheet open-present within 600ms
//   (b) onChange idx=0 AFTER a close-dismiss on the same sheet with no new
//       open-present in between
// Both reduce to: the nearest prior same-sheet event that is NOT open-present
// happened *more recently* than the last open-present → the index-0
// transition wasn't initiated by us.
export type T367Anomaly = {
  cycleIdx: number | null; // null when anomaly lands outside a labeled cycle
  sheet: T367SheetName;
  kind: 'auto-present';
  at: number; // ms timestamp of the anomalous onChange
  lastOpenPresentAgoMs: number | null;
  precedingSameSheet: T367EventKind | null;
};

export function t367Analyze(events: T367Event[]): T367Anomaly[] {
  const anomalies: T367Anomaly[] = [];
  events.forEach((e, i) => {
    if (e.kind !== 'onChange' || e.idx !== 0) return;
    // Walk backwards for the most recent same-sheet event that is NOT this one.
    let lastOpen: T367Event | null = null;
    let precedingSame: T367Event | null = null;
    for (let j = i - 1; j >= 0; j--) {
      const prev = events[j];
      if (prev.sheet !== e.sheet) continue;
      if (!precedingSame) precedingSame = prev;
      if (prev.kind === 'open-present') {
        lastOpen = prev;
        break;
      }
    }
    const agoMs = lastOpen ? e.t - lastOpen.t : null;
    // Accept onChange idx=0 only when:
    //   - we called open-present on this sheet within 600ms (gorhom present
    //     animation settles ~300ms; leave 2x headroom)
    //   - AND no close-dismiss / onDismiss has intervened since that open
    const legit =
      lastOpen !== null &&
      agoMs !== null &&
      agoMs <= 600 &&
      precedingSame?.kind === 'open-present';
    if (!legit) {
      anomalies.push({
        cycleIdx: null,
        sheet: e.sheet,
        kind: 'auto-present',
        at: e.t,
        lastOpenPresentAgoMs: agoMs,
        precedingSameSheet: precedingSame?.kind ?? null,
      });
    }
  });
  return anomalies;
}
