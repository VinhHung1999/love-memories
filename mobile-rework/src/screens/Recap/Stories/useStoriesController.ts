// Sprint 67 T459 — Stories playback controller.
//
// Owns: current slide index, paused state, progress (0..1) of the active
// slide, and the auto-advance timer. Per project memory (frontend
// MonthlyRecapPage) and Boss spec:
//   • 6 seconds per slide (auto-advance)
//   • Hold (>200ms) → pause; release → resume
//   • Quick tap (<200ms) → ignore the hold path; advance/back per zone
//   • Calling `next()` past the last slide invokes `onComplete`
//   • Calling `prev()` at slide 0 stays put (no wrap)
//
// Progress is driven by a JS interval (50ms tick) instead of Reanimated
// withTiming so the controller can pause/resume without losing position.
// Reanimated handles the visual fill — see StoriesProgressBars.

import { useCallback, useEffect, useRef, useState } from 'react';

const SLIDE_DURATION_MS = 6000;
const TICK_MS = 50;
export const HOLD_THRESHOLD_MS = 200;

export type StoriesController = {
  index: number;
  total: number;
  paused: boolean;
  // 0..1 progress within the current slide.
  progress: number;
  next: () => void;
  prev: () => void;
  pause: () => void;
  resume: () => void;
  jumpTo: (i: number) => void;
};

export function useStoriesController(
  total: number,
  onComplete: () => void,
): StoriesController {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Use refs for the tick handler so changing pause/index doesn't tear
  // down + recreate the interval (which would reset the tick alignment).
  const startedAtRef = useRef<number>(Date.now());
  const elapsedAtPauseRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset progress whenever the active slide changes.
  useEffect(() => {
    startedAtRef.current = Date.now();
    elapsedAtPauseRef.current = 0;
    setProgress(0);
  }, [index]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (paused) return;
      const elapsed = Date.now() - startedAtRef.current + elapsedAtPauseRef.current;
      const p = Math.min(1, elapsed / SLIDE_DURATION_MS);
      setProgress(p);
      if (p >= 1) {
        // Auto-advance.
        setIndex((i) => {
          if (i + 1 >= total) {
            onComplete();
            return i;
          }
          return i + 1;
        });
      }
    }, TICK_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, total, onComplete]);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= total) {
        onComplete();
        return i;
      }
      return i + 1;
    });
  }, [total, onComplete]);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const pause = useCallback(() => {
    if (paused) return;
    // Capture how much of the current slide has played so resume picks
    // up where we left off.
    elapsedAtPauseRef.current += Date.now() - startedAtRef.current;
    setPaused(true);
  }, [paused]);

  const resume = useCallback(() => {
    if (!paused) return;
    startedAtRef.current = Date.now();
    setPaused(false);
  }, [paused]);

  const jumpTo = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(total - 1, i));
      setIndex(clamped);
    },
    [total],
  );

  return { index, total, paused, progress, next, prev, pause, resume, jumpTo };
}
