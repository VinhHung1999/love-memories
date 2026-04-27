// Sprint 67 T459 — Top moment showcase slide. Full-bleed photo (Ken
// Burns), heavy bottom dim gradient, ranked chip top-left, title +
// sub at bottom, tappable bottom card → MomentDetail via deep-link.

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { PAL_GRADIENTS } from '@/theme/palettes';

import { KenBurnsBackground } from '../KenBurnsBackground';
import type { Slide } from '../../types';

type TopMomentSlide = Extract<Slide, { kind: 'topMoment' }>;

type Props = { slide: TopMomentSlide };

export function TopMomentSlide({ slide }: Props) {
  const router = useRouter();
  const grad = PAL_GRADIENTS[slide.palette];

  const onTapDetail = () => {
    router.push({ pathname: '/moment-detail', params: { id: slide.momentId } });
  };

  return (
    <View className="flex-1">
      <KenBurnsBackground uri={slide.bgPhotoUrl} dim={0.55} />

      {/* Rank chip */}
      <View className="absolute left-5 top-20 h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white/80">
        <LinearGradient
          colors={[grad[0], grad[1], grad[2]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text className="font-displayBold text-[18px] text-white">#{slide.rank}</Text>
        </LinearGradient>
      </View>

      {/* Bottom info card */}
      <View className="absolute bottom-16 left-5 right-5">
        <View className="overflow-hidden rounded-3xl bg-black/45 p-5">
          <Text
            className="font-displayMedium text-[26px] leading-[30px] text-white"
            numberOfLines={3}
          >
            {slide.title}
          </Text>
          <Text className="mt-2 font-body text-[13px] text-white/80" numberOfLines={2}>
            {slide.sub}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onTapDetail}
            className="mt-4 flex-row items-center gap-2 self-start rounded-full bg-white/15 px-4 py-2.5 active:opacity-70"
          >
            <Text className="font-bodyBold text-[12px] text-white">{slide.ctaLabel}</Text>
            <ChevronRight size={14} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
