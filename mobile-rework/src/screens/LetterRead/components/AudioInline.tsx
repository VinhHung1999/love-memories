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
  // D63a-redo (Sprint 65 Build 87 hot-fix): track ms values directly +
  // compute progress in the render. Build 87's wiring split progress as
  // its own state and only updated it inside the `dur > 0` branch — when
  // RNARP's first ticks reported `duration: 0` (still buffering), the
  // bar stayed at 0 even though `currentPosition` was incrementing.
  // Holding only the raw values + deriving progress per render keeps the
  // bar honest the moment either ms updates.
  const [currentMs, setCurrentMs] = useState(0);
  const [durMs, setDurMs] = useState(
    durationSeconds && durationSeconds > 0
      ? Math.round(durationSeconds * 1000)
      : 0,
  );
  const ownsListener = useRef(false);

  // Hard-stop any active playback when the component unmounts so a
  // stale listener doesn't keep firing setState on an unmounted tree.
  useEffect(() => {
    return () => {
      if (ownsListener.current) {
        audioPlayer.removePlayBackListener();
        void audioPlayer.stopPlayer().catch(() => {});
        ownsListener.current = false;
      }
    };
  }, []);

  const onTogglePlay = useCallback(async () => {
    if (isPlaying) {
      await audioPlayer.stopPlayer().catch(() => {});
      audioPlayer.removePlayBackListener();
      ownsListener.current = false;
      setIsPlaying(false);
      setCurrentMs(0);
      return;
    }
    try {
      await audioPlayer.startPlayer(audioUrl);
      ownsListener.current = true;
      setIsPlaying(true);
      audioPlayer.addPlayBackListener((e: PlayBackType) => {
        if (__DEV__) {
          // [audio-tick] line surfaces in Console.app on a connected
          // iPhone — Boss can pull it to verify the listener actually
          // fires + see real (cur, dur) values.
          console.debug('[audio-tick]', {
            cur: e.currentPosition,
            dur: e.duration,
          });
        }
        setCurrentMs(e.currentPosition);
        if (e.duration > 0) {
          setDurMs(e.duration);
        }
        if (e.duration > 0 && e.currentPosition >= e.duration) {
          audioPlayer.removePlayBackListener();
          ownsListener.current = false;
          setIsPlaying(false);
          setCurrentMs(0);
        }
      });
    } catch {
      ownsListener.current = false;
      setIsPlaying(false);
    }
  }, [audioUrl, isPlaying]);

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
