import type { LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAppColors } from '@/theme/ThemeProvider';

// T340 (Sprint 61) — single row inside the Profile settings card. Mirrors
// prototype more-screens.jsx rows: 32×32 icon chip on surfaceAlt + label
// (flex-1) + right detail + chevron. Divider handling lives on SettingsCard
// so the row itself doesn't care about its position.
// T353: icon switched from emoji-string to lucide component (Boss rule —
// drop emoji in settings list). Chip still 32×32 rounded-xl bg-surface-alt,
// icon size 18 + strokeWidth 1.75 to match prototype visual weight.

type Props = {
  icon: LucideIcon;
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
  /** Hides the chevron when the row is purely informational (e.g. version). */
  noChevron?: boolean;
  accessibilityLabel?: string;
};

export function SettingsRow({
  icon: Icon,
  label,
  detail,
  trailing,
  onPress,
  destructive,
  disabled,
  noChevron,
  accessibilityLabel,
}: Props) {
  const c = useAppColors();
  const labelClass = destructive
    ? 'text-primary-deep'
    : disabled
      ? 'text-ink-mute'
      : 'text-ink';
  const chevronStroke = destructive ? c.primaryDeep : c.inkMute;
  const iconColor = destructive ? c.primaryDeep : disabled ? c.inkMute : c.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      className="flex-row items-center gap-3 px-4 py-5 active:bg-surface-alt/60"
    >
      <View className="w-8 h-8 rounded-[10px] bg-surface-alt items-center justify-center">
        <Icon size={18} color={iconColor} strokeWidth={1.75} />
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
      ) : noChevron ? null : (
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
