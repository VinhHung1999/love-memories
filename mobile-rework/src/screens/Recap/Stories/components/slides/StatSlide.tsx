// Sprint 67 T459 + D1 — Big-stat slide. Backdrop is now a 3x3 grid of
// dim photos behind the 180px counter (Boss D1 feedback "more photos").
// Falls back to gradient when `bgPhotoUrls` is empty.

import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import { AnimatedCounter } from '../AnimatedCounter';
import type { Slide } from '../../types';

type StatSlide = Extract<Slide, { kind: 'stat' }>;

type Props = { slide: StatSlide };

const TONE_TEXT: Record<StatSlide['tone'], string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
};

export function StatSlide({ slide }: Props) {
  const c = useAppColors();
  const numberClass = TONE_TEXT[slide.tone];
  const photos = slide.bgPhotoUrls ?? [];

  return (
    <View className="flex-1">
      {photos.length === 0 ? (
        <LinearGradient
          colors={[c.bg, c.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      ) : (
        <PhotoMosaicBackdrop photos={photos} />
      )}
      <View className="flex-1 items-start justify-center px-7">
        <AnimatedCounter
          value={slide.value}
          className={`font-displayBold text-[180px] leading-[170px] tracking-tight ${numberClass}`}
        />
        <Text className="mt-2 font-bodySemibold text-[14px] uppercase tracking-[2.5px] text-white/95">
          {slide.label}
        </Text>
        {slide.sub ? (
          <Text className="mt-3 max-w-[80%] font-body text-[14px] leading-[20px] text-white/85">
            {slide.sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function PhotoMosaicBackdrop({ photos }: { photos: string[] }) {
  // 3x3 grid of square cells filling the screen. Photos < 9 are reused
  // from the start so the grid always has 9 cells. Heavy black overlay
  // so the big number stays the focal point.
  const cells = Array.from({ length: 9 }, (_, i) => photos[i % photos.length]);
  return (
    <View className="absolute left-0 right-0 top-0 bottom-0 overflow-hidden bg-black">
      <View className="h-full w-full flex-row flex-wrap">
        {cells.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            resizeMode="cover"
            style={{ width: '33.333%', height: '33.333%' }}
          />
        ))}
      </View>
      <View
        className="absolute left-0 right-0 top-0 bottom-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      />
    </View>
  );
}
