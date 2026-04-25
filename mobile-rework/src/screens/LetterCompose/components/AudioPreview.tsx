import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pause, Play, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { LetterAudio } from '@/api/letters';
import { proxyAudio } from '@/lib/proxyUrl';
import { useAppColors } from '@/theme/ThemeProvider';

// T423 (Sprint 65) — inline preview shown after a voice memo has been
// uploaded successfully. Mirrors AudioInline from LetterRead but adds a
// trash icon for re-recording (DELETE then re-open the record sheet).

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
  // D56 (Sprint 65 Build 81 hot-fix): route the CDN URL through the BE's
  // public audio proxy so iOS expo-audio gets a clean `audio/mp4`
  // Content-Type. See @/lib/proxyUrl for the rationale.
  const playableUri = useMemo(() => proxyAudio(audio.url), [audio.url]);
  const player = useAudioPlayer({ uri: playableUri });
  const status = useAudioPlayerStatus(player);

  // D59 — same explicit-replace + diagnostic log as AudioInline.
  useEffect(() => {
    if (!playableUri) return;
    try {
      player.replace({ uri: playableUri });
    } catch {
      /* swallow */
    }
  }, [playableUri, player]);

  if (__DEV__) {
    console.debug('[audio-preview]', {
      uri: playableUri,
      isLoaded: status.isLoaded,
      duration: status.duration,
      playing: status.playing,
    });
  }
  const total =
    status.duration && status.duration > 0
      ? status.duration
      : audio.duration ?? 0;
  const current = status.currentTime ?? 0;
  const progress = total > 0 ? Math.min(1, current / total) : 0;

  // D58 (Sprint 65 Build 82 hot-fix): same isLoaded gate as AudioInline —
  // tapping play before metadata loads silently no-ops.
  const onToggle = () => {
    if (!status.isLoaded) return;
    if (status.playing) player.pause();
    else player.play();
  };

  return (
    <View className="mt-3 flex-row items-center gap-3 px-3.5 py-3 rounded-2xl bg-surface-alt">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? 'Pause' : 'Play'}
        className="w-10 h-10 rounded-full items-center justify-center active:opacity-80"
        style={{ backgroundColor: c.primary }}
      >
        {status.playing ? (
          <Pause size={16} strokeWidth={2.4} color="#ffffff" />
        ) : (
          <Play size={16} strokeWidth={2.4} color="#ffffff" />
        )}
      </Pressable>
      <View className="flex-1 min-w-0">
        <View
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: c.lineOnSurface }}
        >
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
