// Sprint 67 T459 + D1 — Firsts slide. Main photo (Ken Burns) + 2-3
// corner mosaic thumbnails from the same moment so the slide feels
// like a memory snapshot, not a single hero. Keeps the rotated
// emoji sticker + Dancing Script kicker.

import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import { KenBurnsBackground } from '../KenBurnsBackground';
import type { Slide } from '../../types';

type FirstsSlide = Extract<Slide, { kind: 'firsts' }>;

type Props = { slide: FirstsSlide };

export function FirstsSlide({ slide }: Props) {
  const c = useAppColors();
  const mosaic = slide.mosaic ?? [];

  return (
    <View className="flex-1">
      {slide.bgPhotoUrl ? (
        <KenBurnsBackground uri={slide.bgPhotoUrl} dim={0.45} />
      ) : (
        <LinearGradient
          colors={[c.heroB, c.heroC]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      )}

      <View
        className="absolute right-7"
        style={{ top: 110, transform: [{ rotate: '12deg' }] }}
      >
        <Text className="text-[88px]">{slide.sticker}</Text>
      </View>

      {/* Mosaic thumbnails — top-right quadrant, slightly tilted */}
      {mosaic.length > 0 ? (
        <View
          className="absolute right-5"
          style={{ top: 220, gap: 8, alignItems: 'flex-end' }}
        >
          {mosaic.slice(0, 3).map((uri, i) => (
            <View
              key={i}
              className="overflow-hidden rounded-md border-[3px] border-white shadow-elevated"
              style={{
                width: 78 - i * 6,
                height: 78 - i * 6,
                transform: [{ rotate: `${(i % 2 === 0 ? -4 : 5)}deg` }],
              }}
            >
              <Image
                source={{ uri }}
                resizeMode="cover"
                className="h-full w-full"
              />
            </View>
          ))}
        </View>
      ) : null}

      <View className="flex-1 justify-end px-7 pb-24">
        <Text className="font-script text-[40px] leading-[44px] text-white">
          {slide.kicker}
        </Text>
        <Text className="mt-3 font-displayMedium text-[34px] leading-[38px] text-white">
          {slide.title}
        </Text>
      </View>
    </View>
  );
}
