// Sprint 67 D1 NEW — Photo reel slide. Full-screen 3x3 mosaic of up to
// 9 photos so the user sees a literal "this is what we made" snapshot
// before the closing slide. Slot inserted by composer between the
// last narrative slide and Closing.
//
// Each cell is a square; photos < 9 fill from the start. White
// hairlines between cells mimic Polaroid spacing without being noisy.

import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import type { Slide } from '../../types';

type PhotoReelSlide = Extract<Slide, { kind: 'photoReel' }>;

type Props = { slide: PhotoReelSlide };

export function PhotoReelSlide({ slide }: Props) {
  const c = useAppColors();
  const cells = slide.photos.slice(0, 9);
  // Pad to 9 by reusing earlier photos so the grid always renders
  // 9 cells (no awkward empty corners).
  while (cells.length < 9 && cells.length > 0) {
    cells.push(cells[cells.length % Math.max(1, slide.photos.length)]!);
  }

  return (
    <View className="flex-1 bg-black">
      <View className="absolute left-0 right-0 top-0 bottom-0 flex-row flex-wrap">
        {cells.map((uri, i) => (
          <View
            key={i}
            style={{ width: '33.333%', height: '33.333%', padding: 1.5 }}
          >
            <View className="h-full w-full overflow-hidden bg-bg-elev">
              <Image
                source={{ uri }}
                resizeMode="cover"
                className="h-full w-full"
              />
            </View>
          </View>
        ))}
      </View>
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
        start={{ x: 0, y: 0.55 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View className="flex-1 justify-end px-7 pb-20">
        <Text className="font-bodyBold text-[11px] uppercase tracking-[2px] text-white/70">
          PHOTO REEL
        </Text>
        <Text className="mt-2 font-displayMedium text-[34px] leading-[38px] text-white">
          {slide.headline}
        </Text>
        <Text className="mt-2 font-body text-[13px] text-white/85">
          {slide.caption}
        </Text>
      </View>
    </View>
  );
}
