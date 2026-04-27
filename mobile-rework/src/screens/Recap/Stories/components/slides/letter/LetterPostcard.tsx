// Letter variant 4 — Postcard. Horizontal 2-col layout: thumbnail
// photo left + text right (kicker + title + excerpt). Reads like a
// vacation postcard you'd pin on a fridge.

import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { Image, Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import type { Slide } from '../../../types';

type LetterSlide = Extract<Slide, { kind: 'letter' }>;

export function LetterPostcard({
  slide,
  onOpen,
}: {
  slide: LetterSlide;
  onOpen: () => void;
}) {
  const c = useAppColors();
  return (
    <View className="flex-1">
      <LinearGradient
        colors={[c.heroC, c.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View className="flex-1 items-center justify-center px-5">
        <View
          className="flex-row overflow-hidden rounded-lg border border-line bg-white shadow-elevated"
          style={{ width: '100%', maxWidth: 360, transform: [{ rotate: '-2deg' }] }}
        >
          {/* Photo column */}
          <View style={{ width: '42%', aspectRatio: 0.75 }}>
            {slide.thumbPhotoUrl ? (
              <Image
                source={{ uri: slide.thumbPhotoUrl }}
                resizeMode="cover"
                className="h-full w-full"
              />
            ) : (
              <LinearGradient
                colors={[c.heroA, c.heroB]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
            )}
          </View>
          {/* Text column */}
          <View className="flex-1 p-4">
            <Text className="font-bodyBold text-[9px] uppercase tracking-[2px] text-primary-deep">
              {slide.kicker}
            </Text>
            <Text
              className="mt-1.5 font-displayMedium text-[18px] leading-[22px] text-ink"
              numberOfLines={2}
            >
              {slide.title}
            </Text>
            <Text
              className="mt-2.5 font-body text-[12px] leading-[18px] text-ink-soft"
              numberOfLines={5}
            >
              {slide.excerpt}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          className="mt-7 flex-row items-center gap-2 rounded-full bg-ink px-5 py-3 active:opacity-80"
        >
          <Text className="font-bodyBold text-[13px] text-bg">{slide.ctaLabel}</Text>
          <ArrowRight size={14} color={c.bg} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}
