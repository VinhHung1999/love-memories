// Sprint 67 T459 — Places slide. 2-column collage of place thumbnails
// (up to 4 visible) + headline + caption. Each cell holds the place
// name overlaid on its photo (or a soft-tinted placeholder when the
// place has no photo).

import { LinearGradient } from 'expo-linear-gradient';
import { MapPin } from 'lucide-react-native';
import { Image, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import type { Slide } from '../../types';

type PlacesSlide = Extract<Slide, { kind: 'places' }>;

type Props = { slide: PlacesSlide };

export function PlacesSlide({ slide }: Props) {
  const c = useAppColors();
  const visible = slide.thumbnails.slice(0, 4);

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[c.heroC, c.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View className="flex-1 justify-center px-6">
        <Text className="font-bodyBold text-[11px] uppercase tracking-[2px] text-white/70">
          05 · NƠI MÌNH ĐÃ ĐẾN
        </Text>
        <Text className="mt-2 font-displayMedium text-[36px] leading-[40px] text-white">
          {slide.headline}
        </Text>
        <Text className="mt-2 font-body text-[13px] text-white/80">
          {slide.caption}
        </Text>

        <View className="mt-7 flex-row flex-wrap" style={{ gap: 10 }}>
          {visible.map((t, i) => (
            <PlaceCell key={`${t.name}-${i}`} thumb={t} />
          ))}
        </View>
      </View>
    </View>
  );
}

function PlaceCell({
  thumb,
}: {
  thumb: { name: string; photoUrl?: string };
}) {
  const c = useAppColors();
  return (
    <View
      className="overflow-hidden rounded-2xl"
      style={{ width: '47%', aspectRatio: 1 }}
    >
      {thumb.photoUrl ? (
        <Image
          source={{ uri: thumb.photoUrl }}
          resizeMode="cover"
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <LinearGradient
          colors={[c.heroA, c.heroB]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View className="absolute bottom-2.5 left-2.5 right-2.5 flex-row items-center gap-1.5">
        <MapPin size={11} color="#FFFFFF" strokeWidth={2.4} />
        <Text
          numberOfLines={1}
          className="flex-1 font-bodyBold text-[12px] text-white"
        >
          {thumb.name}
        </Text>
      </View>
    </View>
  );
}
