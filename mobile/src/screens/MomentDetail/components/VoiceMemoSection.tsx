import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';
import type { MomentAudio } from '../../../types';

interface VoiceMemoSectionProps {
  audios: MomentAudio[];
  playingAudioId: string | null;
  audioProgress: Record<string, number>;
  onPlay: (audioId: string, url: string) => void;
  onStop: () => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const BAR_HEIGHTS = [8, 14, 20, 12, 22, 16, 10, 18, 24, 14, 8, 16, 20, 10, 14];

function WaveformBars({ progress }: { progress: number }) {
  const colors = useAppColors();
  const filledCount = Math.round(BAR_HEIGHTS.length * progress);

  return (
    <View className="flex-row items-center gap-[2px] h-7">
      {BAR_HEIGHTS.map((h, i) => (
        <View
          key={i}
          className="w-[3px] rounded-sm"
          style={{ height: h, backgroundColor: i < filledCount ? colors.primary : colors.primaryLight }} // dynamic bar height — cannot be expressed as className
        />
      ))}
    </View>
  );
}

export default function VoiceMemoSection({
  audios,
  playingAudioId,
  audioProgress,
  onPlay,
  onStop,
}: VoiceMemoSectionProps) {
  if (audios.length === 0) return null;

  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-1.5 h-1.5 rounded-full bg-primary" />
        <Text className="text-[10px] font-bold text-textLight tracking-[1px] uppercase">
          {t.moments.detail.voiceMemo}
        </Text>
      </View>
      {audios.map(audio => {
        const isPlaying = playingAudioId === audio.id;
        const progress = audioProgress[audio.id] ?? 0;
        const duration = audio.duration ?? 0;

        return (
          <Pressable
            key={audio.id}
            onPress={() => isPlaying ? onStop() : onPlay(audio.id, audio.url)}
            className="flex-row items-center gap-3 p-3 rounded-2xl mb-2 bg-accent/8 border border-accent/20">
            {/* Play/Pause button */}
            <View className="w-10 h-10 rounded-full items-center justify-center bg-accent">
              <Icon name={isPlaying ? 'pause' : 'play'} size={18} color="#fff" />
            </View>

            {/* Waveform */}
            <View className="flex-1">
              <WaveformBars progress={progress} />
            </View>

            {/* Duration */}
            <Text className="text-[11px] font-medium text-textMid">
              {duration > 0 ? formatDuration(duration) : '--:--'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
