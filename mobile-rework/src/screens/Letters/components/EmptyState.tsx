import { Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

// T421 (Sprint 65) — empty state per Letters tab. Centred floating envelope
// illustration + tab-specific Vietnamese copy + optional CTA pill. Mirrors
// the empty-states pattern from Moments (no bordered card — illustration
// floats on bg).

type Props = {
  glyph?: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCta?: () => void;
};

export function EmptyState({
  glyph = '💌',
  title,
  subtitle,
  ctaLabel,
  onCta,
}: Props) {
  return (
    <View className="items-center mt-12 px-6">
      <View className="w-[140px] h-[100px] items-center justify-center mb-4">
        <View className="absolute -left-2 top-3 w-[88px] h-[64px] rounded-xl bg-surface border border-line-on-surface -rotate-6" />
        <View className="absolute -right-2 top-3 w-[88px] h-[64px] rounded-xl bg-surface border border-line-on-surface rotate-6" />
        <View className="w-[100px] h-[72px] rounded-xl bg-surface border border-line-on-surface items-center justify-center shadow-card">
          <Text className="text-[32px] leading-[34px]">{glyph}</Text>
        </View>
      </View>
      <Text
        className="font-displayMedium text-ink text-[22px] leading-[26px] text-center"
        style={{ maxWidth: 280 }}
      >
        {title}
      </Text>
      <Text
        className="font-body text-ink-mute text-[13px] leading-[19px] text-center mt-2"
        style={{ maxWidth: 300 }}
      >
        {subtitle}
      </Text>
      {ctaLabel && onCta ? (
        <Pressable
          onPress={onCta}
          accessibilityRole="button"
          className="mt-6 flex-row items-center px-6 h-[44px] rounded-full bg-primary shadow-pill active:bg-primary-deep"
        >
          <Plus size={16} strokeWidth={2.5} color="#ffffff" />
          <Text className="font-bodySemibold text-white text-[14px] ml-1.5">
            {ctaLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
