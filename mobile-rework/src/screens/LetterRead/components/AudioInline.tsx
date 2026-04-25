import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pause, Play } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { proxyAudio } from '@/lib/proxyUrl';
import { useAppColors } from '@/theme/ThemeProvider';

// T422 (Sprint 65) — inline audio player for letter voice memos. Single
// audio entity per letter (BE LoveLetterService.uploadAudio enforces 1 max).
// expo-audio replaces the deprecated expo-av in SDK 54+. The hook
// auto-releases the AudioPlayer on unmount, so closing the LetterRead modal
// stops playback without manual cleanup.

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
  // D56 (Sprint 65 Build 81 hot-fix): route the CDN URL through the BE's
  // public audio proxy so iOS expo-audio gets a clean `audio/mp4`
  // Content-Type. See @/lib/proxyUrl for the rationale.
  const playableUri = useMemo(() => proxyAudio(audioUrl), [audioUrl]);
  const player = useAudioPlayer({ uri: playableUri });
  const status = useAudioPlayerStatus(player);

  // expo-audio reports duration in seconds. Prefer the player-reported value
  // once it has loaded the asset; fall back to the BE-stored hint while the
  // remote audio is still buffering.
  const total =
    status.duration && status.duration > 0
      ? status.duration
      : durationSeconds ?? 0;
  const current = status.currentTime ?? 0;
  const progress = total > 0 ? Math.min(1, current / total) : 0;

  const onTogglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View className="flex-row items-center gap-3 mt-6 px-3.5 py-3 rounded-2xl bg-surface-alt">
      <Pressable
        onPress={onTogglePlay}
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
    </View>
  );
}
