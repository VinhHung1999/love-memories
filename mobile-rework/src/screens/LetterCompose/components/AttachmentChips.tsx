import { Camera, Mic } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

// T423 (Sprint 65) — 2-button attachment row at the bottom of the compose
// form. Prototype `letters.jsx` L529-546. Each button:
//   • equal flex
//   • 12/10 padding, rounded-2xl, surface bg + line border
//   • 20px icon, 11px label
//   • surface-alt bg if a chip's underlying state is "active" (photos
//     attached / audio attached) — gives a subtle hint without spawning a
//     separate badge.
//
// D40 (Build 76 hot-fix): the third "Hẹn gửi" chip + ScheduleSheet are gone.

type Props = {
  photosLabel: string;
  audioLabel: string;
  hasPhotos: boolean;
  hasAudio: boolean;
  onPhotos: () => void;
  onAudio: () => void;
  photosDisabled?: boolean;
};

export function AttachmentChips({
  photosLabel,
  audioLabel,
  hasPhotos,
  hasAudio,
  onPhotos,
  onAudio,
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
    </View>
  );
}

type ChipProps = {
  label: string;
  icon: 'photos' | 'audio';
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
};

function Chip({ label, icon, active, onPress, disabled }: ChipProps) {
  const c = useAppColors();
  const Icon = icon === 'photos' ? Camera : Mic;
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
