import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

// T425 (Sprint 65) — anniversary countdown banner. Client-derived (Lu Q2):
// renders inside the 'today' group when the couple's anniversary is ≤14
// days away. Prototype `notifications.jsx` L240-310. Wide gradient pill
// with eyebrow + body line + secondary chevron CTA → /monthly-recap.
//
// Backlog item B-anniv-notif-be (P3) replaces this client-side derivation
// with a real BE notification once the backend emits an `anniversary`
// type row.

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onPress: () => void;
};

export function AnnivBanner({
  eyebrow,
  title,
  subtitle,
  ctaLabel,
  onPress,
}: Props) {
  const c = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="mx-5 mt-2 mb-1 rounded-2xl overflow-hidden active:opacity-90"
    >
      <LinearGradient
        colors={[c.heroA, c.heroB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-4 py-4"
      >
        <View>
          <View className="self-start px-2.5 py-0.5 rounded-full bg-white/30">
            <Text className="font-bodyBold text-white text-[10px] tracking-[1px] uppercase">
              {eyebrow}
            </Text>
          </View>
          <Text
            className="mt-2 font-displayMedium text-white text-[20px] leading-[24px]"
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text
            className="mt-1 font-body text-white/90 text-[13px] leading-[19px]"
            numberOfLines={2}
          >
            {subtitle}
          </Text>
          <View className="flex-row items-center self-start mt-3 px-3 py-1.5 rounded-full bg-white">
            <Text className="font-bodyBold text-[12px] mr-1" style={{ color: c.primary }}>
              {ctaLabel}
            </Text>
            <ChevronRight size={12} strokeWidth={2.4} color={c.primary} />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
