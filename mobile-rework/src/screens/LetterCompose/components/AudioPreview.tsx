import { Pause, Play, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import audioPlayer, {
  type PlayBackType,
} from 'react-native-audio-recorder-player';

import type { LetterAudio } from '@/api/letters';
import { useAppColors } from '@/theme/ThemeProvider';

// T423 (Sprint 65) — preview shown after a voice memo uploads from the
// Compose flow. Mirrors AudioInline (LetterRead) — same RNARP-based
// playback, same singleton cleanup in unmount.
//
// D62 (Sprint 65 Build 85 hot-fix): switched from expo-audio to
// react-native-audio-recorder-player for the same reasons documented in
// AudioInline.

type Props = {
  audio: LetterAudio;
  onRemove: () => void;
};

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AudioPreview({ audio, onRemove }: Props) {
  const c = useAppColors();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [durMs, setDurMs] = useState(
    audio.duration && audio.duration > 0
      ? Math.round(audio.duration * 1000)
      : 0,
  );
  // D63a-redo3 — same Murmur-style setInterval polling as AudioInline.
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

  useEffect(() => {
    return () => {
      teardown();
      void audioPlayer.stopPlayer().catch(() => {});
    };
  }, [teardown]);

  const onToggle = useCallback(async () => {
    if (isPlaying) {
      teardown();
      await audioPlayer.stopPlayer().catch(() => {});
      setIsPlaying(false);
      setCurrentMs(0);
      return;
    }
    try {
      audioPlayer.setSubscriptionDuration(0.1);
      await audioPlayer.startPlayer(audio.url);
      ownsListener.current = true;
      setIsPlaying(true);
      setCurrentMs(0);
      startTimestampRef.current = Date.now();

      audioPlayer.addPlayBackListener((e: PlayBackType) => {
        if (__DEV__) {
          console.debug('[audio-tick:preview]', {
            cur: e.currentPosition,
            dur: e.duration,
          });
        }
        if (e.duration > 0) setDurMs(e.duration);
      });

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
  }, [audio.url, durMs, isPlaying, teardown]);

  const total = durMs / 1000;
  const current = currentMs / 1000;
  const progress = durMs > 0 ? Math.min(1, currentMs / durMs) : 0;

  return (
    <View className="mt-3 flex-row items-center gap-3 px-3.5 py-3 rounded-2xl bg-surface-alt">
      <Pressable
        onPress={() => void onToggle()}
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
        {/* D63b — track to bg-ink/15 for cross-surface contrast. */}
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
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel="Remove audio"
        className="w-9 h-9 rounded-full items-center justify-center active:opacity-70"
      >
        <Trash2 size={16} strokeWidth={2.2} color={c.inkMute} />
      </Pressable>
    </View>
  );
}
