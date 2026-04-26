import { Pause, Play } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import audioPlayer, {
  type PlayBackType,
} from 'react-native-audio-recorder-player';

import { useAppColors } from '@/theme/ThemeProvider';

// T422 (Sprint 65) — inline audio player for letter voice memos.
// D62 (Sprint 65 Build 85 hot-fix): switched from expo-audio's
// useAudioPlayer to react-native-audio-recorder-player. expo-audio v1.1.1
// silently failed to load HTTPS streams against Boss's device through
// Builds 81-85 (D52→D60 ladder); the RNARP startPlayer/stopPlayer +
// addPlayBackListener pattern has shipped in legacy mobile/ since Sprint
// 30 and works against the same CDN URLs. RNARP is a SINGLETON — only
// one audio plays at a time. AudioPreview uses the same lib; the two
// components never overlap in practice (compose vs read are different
// routes), but the cleanup in useEffect's unmount handler stops the
// player so a stale listener can't leak across screens.

type Props = {
  audioUrl: string;
  durationSeconds: number | null;
};

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AudioInline({ audioUrl, durationSeconds }: Props) {
  const c = useAppColors();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [durMs, setDurMs] = useState(
    durationSeconds && durationSeconds > 0
      ? Math.round(durationSeconds * 1000)
      : 0,
  );
  // D63a-redo3 (Sprint 65 Build 89 hot-fix): pivot off RNARP's playback
  // listener entirely. The v4.5+nitro bridge leaves the listener idle no
  // matter what subscription duration we set, so progress never moved
  // through Builds 86-89. The Murmur app pattern (journaling-app/app/
  // entry-result.tsx:79-108) sidesteps the listener and computes elapsed
  // time on a `setInterval(100ms)` polling loop rooted at a `Date.now()`
  // timestamp captured when playback starts. RNARP keeps doing the
  // actual audio I/O (startPlayer + stopPlayer); the bar / clock is a
  // pure JS-side derivation. The listener is still attached as a backup
  // — if RNARP ever delivers a tick we use it to refine `durMs` (in
  // case the BE-stored prop was NULL), but progress no longer waits on
  // it. Keeps `[audio-tick]` __DEV__ log on the listener side so a
  // future device capture confirms whether v4.5+nitro starts firing.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimestampRef = useRef(0);
  const ownsListener = useRef(false);

  const teardown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (ownsListener.current) {
      audioPlayer.removePlayBackListener();
      ownsListener.current = false;
    }
  }, []);

  // Hard-stop any active playback when the component unmounts so a
  // stale listener doesn't keep firing setState on an unmounted tree.
  useEffect(() => {
    return () => {
      teardown();
      void audioPlayer.stopPlayer().catch(() => {});
    };
  }, [teardown]);

  const onTogglePlay = useCallback(async () => {
    if (isPlaying) {
      teardown();
      await audioPlayer.stopPlayer().catch(() => {});
      setIsPlaying(false);
      setCurrentMs(0);
      return;
    }
    try {
      audioPlayer.setSubscriptionDuration(0.1);
      await audioPlayer.startPlayer(audioUrl);
      ownsListener.current = true;
      setIsPlaying(true);
      setCurrentMs(0);
      startTimestampRef.current = Date.now();

      // Backup listener — refine durMs if RNARP ever decides to fire.
      audioPlayer.addPlayBackListener((e: PlayBackType) => {
        if (__DEV__) {
          console.debug('[audio-tick]', {
            cur: e.currentPosition,
            dur: e.duration,
          });
        }
        if (e.duration > 0) setDurMs(e.duration);
      });

      // Source of truth: client-computed elapsed time.
      intervalRef.current = setInterval(() => {
        const elapsedMs = Date.now() - startTimestampRef.current;
        if (durMs > 0 && elapsedMs >= durMs) {
          teardown();
          void audioPlayer.stopPlayer().catch(() => {});
          setIsPlaying(false);
          setCurrentMs(0);
          return;
        }
        setCurrentMs(elapsedMs);
      }, 100);
    } catch {
      teardown();
      setIsPlaying(false);
    }
  }, [audioUrl, durMs, isPlaying, teardown]);

  const total = durMs / 1000;
  const current = currentMs / 1000;
  const progress = durMs > 0 ? Math.min(1, currentMs / durMs) : 0;

  return (
    <View className="flex-row items-center gap-3 mt-6 px-3.5 py-3 rounded-2xl bg-surface-alt">
      <Pressable
        onPress={() => void onTogglePlay()}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        className="w-10 h-10 rounded-full items-center justify-center active:opacity-80"
        style={{ backgroundColor: c.primary }}
      >
        {isPlaying ? (
          <Pause size={16} strokeWidth={2.4} color="#ffffff" />
        ) : (
          <Play size={16} strokeWidth={2.4} color="#ffffff" />
        )}
      </Pressable>
      <View className="flex-1 min-w-0">
        {/* D63b (Sprint 65 Build 86 hot-fix): track switched from
            `c.lineOnSurface` to `bg-ink/15` so the bar reads against the
            surfaceAlt / cream paper backgrounds in light mode. lineOnSurface
            is precomposed on white surface; on surfaceAlt cream / Evolve
            terracotta the contrast collapses to near-invisible. ink/15
            stays high-contrast on any surface in both light and dark. */}
        <View className="h-1.5 rounded-full overflow-hidden bg-ink/15">
          <View
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: c.primary,
            }}
          />
        </View>
        <Text className="font-body text-ink-mute text-[11px] mt-1.5">
          {formatClock(current)} / {formatClock(total)}
        </Text>
      </View>
    </View>
  );
}
