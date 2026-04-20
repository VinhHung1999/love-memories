import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAppColors } from '@/theme/ThemeProvider';

// T340 (Sprint 61) — single row inside the Profile settings card. Mirrors
// prototype more-screens.jsx rows: 32×32 emoji chip on surfaceAlt + label
// (flex-1) + right detail + chevron. Divider handling lives on SettingsCard
// so the row itself doesn't care about its position.

type Props = {
  icon: string;
  label: string;
  /** Small muted right-side text (e.g. "Bật", couple name, version). */
  detail?: string;
  /**
   * Trailing element that replaces the chevron — Switch / Badge / etc.
   * When present, we hide the chevron since the row's affordance is the
   * control itself rather than a navigation push.
   */
  trailing?: React.ReactNode;
  onPress?: () => void;
  /** Renders label (and chevron) in primary-deep for destructive rows (Sign out / Delete account). */
  destructive?: boolean;
  /** Disables the row — greys label + drops active feedback. */
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function SettingsRow({
  icon,
  label,
  detail,
  trailing,
  onPress,
  destructive,
  disabled,
  accessibilityLabel,
}: Props) {
  const c = useAppColors();
  const labelClass = destructive
    ? 'text-primary-deep'
    : disabled
      ? 'text-ink-mute'
      : 'text-ink';
  const chevronStroke = destructive ? c.primaryDeep : c.inkMute;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      className={`flex-row items-center gap-3 px-4 py-3.5 ${
        disabled ? '' : 'active:bg-surface-alt/60'
      }`}
    >
      <View className="w-8 h-8 rounded-xl bg-surface-alt items-center justify-center">
        <Text className="text-base">{icon}</Text>
      </View>
      <Text
        numberOfLines={1}
        className={`flex-1 font-bodyMedium text-[14px] leading-[18px] ${labelClass}`}
      >
        {label}
      </Text>
      {detail ? (
        <Text numberOfLines={1} className="font-body text-ink-mute text-[12px] max-w-[140px]">
          {detail}
        </Text>
      ) : null}
      {trailing ? (
        trailing
      ) : (
        <Svg width={6} height={10} viewBox="0 0 8 14" fill="none">
          <Path
            d="M1 1l6 6-6 6"
            stroke={chevronStroke}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      )}
    </Pressable>
  );
}
