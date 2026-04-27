// Sprint 67 T454 — Section 07 letter highlight (prototype `recap.jsx`
// L370-426). Paper-texture gradient (secondarySoft → surface), little
// stamp corner with ♥, kicker line, title, excerpt with fade-out, and a
// "Re-read it" pill that deep-links into LetterRead.

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Heart } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

type Props = {
  id: string;
  kicker: string;             // 'Từ Minh · 18.03'
  title: string;
  excerpt: string;
  ctaLabel: string;           // 'Đọc lại' / 'Re-read it'
};

export function LetterHighlightCard({
  id,
  kicker,
  title,
  excerpt,
  ctaLabel,
}: Props) {
  const c = useAppColors();
  const router = useRouter();

  const onOpen = () => {
    router.push({ pathname: '/letter-read', params: { id } });
  };

  return (
    <View className="mt-3.5 overflow-hidden rounded-[22px] border border-line bg-surface">
      <LinearGradient
        colors={[c.secondarySoft, c.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View className="relative px-5 pb-4 pt-5">
          <View
            className="absolute right-3.5 top-3.5 h-[54px] w-[44px] items-center justify-center overflow-hidden rounded-[4px] border-2 border-dashed border-surface"
            style={{ transform: [{ rotate: '6deg' }] }}
          >
            <LinearGradient
              colors={[c.primary, c.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <Heart size={20} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
            </LinearGradient>
          </View>
          <Text className="font-bodyBold text-[10px] uppercase tracking-widest text-primary-deep">
            {kicker}
          </Text>
          <Text
            className="mt-1.5 font-displayMedium text-[24px] leading-[28px] text-ink"
            style={{ maxWidth: '78%' }}
          >
            {title}
          </Text>
        </View>
      </LinearGradient>
      <View className="px-5 pb-4 pt-3.5">
        <View className="relative">
          <Text
            className="font-body text-[14px] leading-[22px] text-ink-soft"
            numberOfLines={5}
          >
            {excerpt}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          className="mt-3.5 flex-row items-center gap-2 self-start rounded-full bg-surface-alt px-3.5 py-2.5 active:opacity-70"
        >
          <Text className="font-bodyBold text-[12px] text-ink">{ctaLabel}</Text>
          <ArrowRight size={12} color={c.ink} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}
