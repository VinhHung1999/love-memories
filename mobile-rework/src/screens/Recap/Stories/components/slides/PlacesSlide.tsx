// Sprint 67 T459 + D1 — Places slide. Each visible place renders a
// tilted Polaroid stack of up to 3 photos (Boss D1 feedback "more
// photos / Polaroid vibe"). Cells with no photos fall back to a
// gradient pill with the place name only.

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
          NƠI MÌNH ĐÃ ĐẾN
        </Text>
        <Text className="mt-2 font-displayMedium text-[36px] leading-[40px] text-white">
          {slide.headline}
        </Text>
        <Text className="mt-2 font-body text-[13px] text-white/80">
          {slide.caption}
        </Text>

        <View className="mt-7 flex-row flex-wrap" style={{ gap: 14 }}>
          {visible.map((t, i) => (
            <PolaroidStack key={`${t.name}-${i}`} thumb={t} />
          ))}
        </View>
      </View>
    </View>
  );
}

function PolaroidStack({
  thumb,
}: {
  thumb: { name: string; photos: string[] };
}) {
  const c = useAppColors();
  const photos = thumb.photos.slice(0, 3);

  return (
    <View
      className="items-center justify-center"
      style={{ width: '46%', aspectRatio: 0.95 }}
    >
      {/* Tilted polaroids — back-to-front so the front (index 0) reads
          first; rotation alternates ±5..10° for variety. */}
      {photos.length === 0 ? (
        <View
          className="h-full w-full items-center justify-center overflow-hidden rounded-2xl"
        >
          <LinearGradient
            colors={[c.heroA, c.heroB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View className="flex-row items-center gap-1.5">
            <MapPin size={12} color="#FFFFFF" strokeWidth={2.4} />
            <Text className="font-bodyBold text-[12px] text-white">{thumb.name}</Text>
          </View>
        </View>
      ) : (
        <>
          {photos.map((uri, i) => {
            const rot = (i === 0 ? -4 : i === 1 ? 6 : -10) + i;
            const tx = (i === 0 ? 0 : i === 1 ? 8 : -10);
            const ty = i * 4;
            return (
              <View
                key={i}
                className="absolute overflow-hidden rounded-md border-[3px] border-white shadow-elevated"
                style={{
                  width: '88%',
                  aspectRatio: 0.85,
                  transform: [
                    { translateX: tx },
                    { translateY: ty },
                    { rotate: `${rot}deg` },
                  ],
                  zIndex: photos.length - i,
                }}
              >
                <Image
                  source={{ uri }}
                  resizeMode="cover"
                  className="h-full w-full"
                />
              </View>
            );
          })}
          {/* Caption pill below the stack */}
          <View
            className="absolute bottom-0 flex-row items-center gap-1.5 rounded-full bg-black/55 px-3 py-1"
            style={{ zIndex: 10 }}
          >
            <MapPin size={11} color="#FFFFFF" strokeWidth={2.4} />
            <Text className="font-bodyBold text-[11px] text-white">{thumb.name}</Text>
          </View>
        </>
      )}
    </View>
  );
}
