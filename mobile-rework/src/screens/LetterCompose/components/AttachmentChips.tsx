import { Camera, Clock, Mic } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

// T423 (Sprint 65) — 3-button attachment row at the bottom of the compose
// form. Prototype `letters.jsx` L529-546. Each button:
//   • equal flex (3 columns)
//   • 12/10 padding, rounded-2xl, surface bg + line border
//   • 20px icon, 11px label
//   • surface-alt bg if a chip's underlying state is "active" (photos
//     attached / audio attached / scheduledAt set) — gives a subtle hint
//     without spawning a separate badge.

type Props = {
  photosLabel: string;
  audioLabel: string;
  scheduleLabel: string;
  hasPhotos: boolean;
  hasAudio: boolean;
  hasSchedule: boolean;
  onPhotos: () => void;
  onAudio: () => void;
  onSchedule: () => void;
  photosDisabled?: boolean;
};

export function AttachmentChips({
  photosLabel,
  audioLabel,
  scheduleLabel,
  hasPhotos,
  hasAudio,
  hasSchedule,
  onPhotos,
  onAudio,
  onSchedule,
  photosDisabled,
}: Props) {
  return (
    <View className="mt-4 flex-row gap-2">
      <Chip
        label={photosLabel}
        icon="photos"
        active={hasPhotos}
        onPress={onPhotos}
        disabled={photosDisabled}
      />
      <Chip
        label={audioLabel}
        icon="audio"
        active={hasAudio}
        onPress={onAudio}
      />
      <Chip
        label={scheduleLabel}
        icon="schedule"
        active={hasSchedule}
        onPress={onSchedule}
      />
    </View>
  );
}

type ChipProps = {
  label: string;
  icon: 'photos' | 'audio' | 'schedule';
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
};

function Chip({ label, icon, active, onPress, disabled }: ChipProps) {
  const c = useAppColors();
  const Icon = icon === 'photos' ? Camera : icon === 'audio' ? Mic : Clock;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled: !!disabled }}
      className="flex-1 items-center justify-center gap-1 rounded-2xl py-3"
      style={{
        backgroundColor: active ? c.surfaceAlt : c.surface,
        borderWidth: 1,
        borderColor: active ? c.primary : c.lineOnSurface,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Icon
        size={20}
        strokeWidth={2.1}
        color={active ? c.primary : c.inkSoft}
      />
      <Text
        className="font-bodySemibold text-[11px]"
        style={{ color: active ? c.primary : c.inkSoft }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
