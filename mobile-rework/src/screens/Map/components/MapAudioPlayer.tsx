import { useEffect, useState } from 'react';
import audioPlayer from 'react-native-audio-recorder-player';

import { getMoment } from '@/api/moments';

// T472 Slice 3 (Sprint 70) — Map preview-card audio singleton.
//
// RNARP itself is a process-wide singleton (default export is the instance)
// — only one audio stream can play at a time. This module owns the contract
// for the Map preview card: tapping a pin's audio thumb stops whatever is
// playing app-wide, re-fetches the full moment to resolve the CDN audio URL
// (the lightweight MapMomentPin payload omits it on purpose, see Map/types.ts),
// then starts the new stream and broadcasts the new currentMomentId to any
// subscribed UI rows so they can re-render their play/pause state.
//
// Why a custom broadcaster instead of context: the consumer of the singleton
// is co-located with the singleton (MomentPreviewCard), so a Provider would
// be ceremony for no gain. Module-level Set + useSyncExternalStore-style
// subscribe is the cheapest viable shape.
//
// Cleanup contract: callers MUST invoke stop() on unmount; the card's
// useEffect cleanup does this. Playback fires-and-forgets — RNARP's own
// playback-finish listener is unreliable on v4.5 + nitro (see AudioInline
// D63 lesson), so we don't try to auto-clear currentMomentId on natural
// end-of-track. Worst case the UI shows a stale "playing" state until the
// next tap; acceptable for an MVP map preview.

type Listener = (id: string | null) => void;

let currentMomentId: string | null = null;
const listeners = new Set<Listener>();

function setCurrent(id: string | null) {
  if (id === currentMomentId) return;
  currentMomentId = id;
  listeners.forEach((l) => l(id));
}

async function stop(): Promise<void> {
  try {
    await audioPlayer.stopPlayer();
  } catch {
    // RNARP rejects stop() if nothing is playing — safe to ignore.
  }
  setCurrent(null);
}

async function play(momentId: string): Promise<void> {
  // Stop whatever else is currently playing (across any screen) before we
  // hit the network — keeps the singleton invariant even if the fetch fails.
  if (currentMomentId && currentMomentId !== momentId) {
    await stop();
  }

  let url: string | null = null;
  try {
    const moment = await getMoment(momentId);
    // BE moments may carry audios separately from photos. The current
    // MomentDetailRow only types `photos` + `tags`; the audio URL is on
    // `audios[0].url` per the BE shape used in LetterRead's sibling system.
    // Read defensively so a missing shape doesn't crash the singleton.
    const audios = (moment as unknown as {
      audios?: Array<{ url: string }>;
    }).audios;
    url = audios && audios.length > 0 ? audios[0].url : null;
  } catch {
    url = null;
  }

  if (!url) {
    // Nothing to play — make sure we're not falsely marked as playing.
    setCurrent(null);
    return;
  }

  try {
    await audioPlayer.startPlayer(url);
    setCurrent(momentId);
  } catch {
    setCurrent(null);
  }
}

function getCurrentMomentId(): string | null {
  return currentMomentId;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Component-facing hook — subscribes to currentMomentId changes so the
// audio thumb can flip between play/pause icons without prop drilling.
export function useCurrentPlayingMomentId(): string | null {
  const [id, setId] = useState<string | null>(currentMomentId);
  useEffect(() => subscribe(setId), []);
  return id;
}

export const MapAudioPlayer = {
  play,
  stop,
  getCurrentMomentId,
};
