import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useCallback, useRef } from 'react';
import type { RefObject } from 'react';

// T367 fix — guards each BottomSheetModal against the gorhom v5 auto-reopen
// race. Root cause: after dismiss(), gorhom's animation settle callback fires
// onAnimate(from=-1, to=0) ~900-1100ms later, causing the sheet to re-present
// itself if another sheet was presented in that window (stack race).
//
// State machine:
//   intentRef=false  →  open() called  →  markOpen()  →  intentRef=true
//   intentRef=true   →  onAnimate(to>=0) allowed (legitimate present)
//   close/gesture    →  dismiss()  →  onDismiss fires  →  markDismissed()  →  intentRef=false
//   (race fires)     →  onAnimate(to>=0) + intentRef=false  →  suppress via dismiss()
//
// markDismissed() is called in onDismiss (not in close()) so intentRef stays
// true during the dismiss animation — the legitimate onAnimate(to=-1) is
// never gated since toIndex < 0 is ignored by the guard.

export function useIntentOpenGate(bsRef: RefObject<BottomSheetModal | null>) {
  const intentRef = useRef(false);

  const markOpen = useCallback(() => {
    intentRef.current = true;
  }, []);

  const markDismissed = useCallback(() => {
    intentRef.current = false;
  }, []);

  // Wire into BottomSheetModal's onChange. Fires when the snap animation
  // completes — at that point the sheet is in a stable state. We defer the
  // dismiss via setTimeout(0) so it runs on the next JS event loop tick,
  // after gorhom's internal worklet has fully settled at snap 0. Calling
  // dismiss() synchronously from onChange conflicts with the Reanimated
  // worklet that just completed (the worklet queue processes the new dismiss
  // out-of-order or ignores it as a no-op on the same frame).
  const onChangeGate = useCallback(
    (index: number) => {
      if (index >= 0 && !intentRef.current) {
        setTimeout(() => {
          // Re-check after deferral — a legitimate open() may have fired
          // in the meantime (e.g. tight-timing next-cycle open).
          if (!intentRef.current) {
            bsRef.current?.dismiss();
          }
        }, 0);
      }
    },
    [bsRef],
  );

  return { markOpen, markDismissed, onChangeGate };
}
