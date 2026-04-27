// Letter variant 3 — Vintage envelope. Top half = airmail-striped
// envelope card with stamp corner + handwritten "PAR AVION" feel.
// Bottom half = excerpt sheet peeking out from under the envelope
// with tear-edge top.

import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import type { Slide } from '../../../types';

type LetterSlide = Extract<Slide, { kind: 'letter' }>;

export function LetterEnvelope({
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
        colors={[c.surface, c.surfaceAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View className="flex-1 justify-center px-6" style={{ gap: 18 }}>
        {/* Envelope card */}
        <View className="overflow-hidden rounded-md border border-line bg-white shadow-elevated">
          {/* Airmail stripe */}
          <View className="h-2 flex-row">
            {Array.from({ length: 24 }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: '4.166%',
                  height: '100%',
                  backgroundColor:
                    i % 4 === 0
                      ? c.primaryDeep
                      : i % 4 === 1
                        ? '#FFFFFF'
                        : i % 4 === 2
                          ? c.heroB
                          : '#FFFFFF',
                }}
              />
            ))}
          </View>
          <View className="flex-row gap-3 p-5">
            <View className="flex-1">
              <Text className="font-bodyBold text-[9px] uppercase tracking-[2.5px] text-ink-mute">
                PAR AVION · {slide.kicker}
              </Text>
              <Text
                className="mt-2 font-displayMedium text-[22px] leading-[26px] text-ink"
                numberOfLines={2}
              >
                {slide.title}
              </Text>
            </View>
            {/* Stamp corner */}
            <View
              className="h-[58px] w-[48px] items-center justify-center rounded-sm border-[1.5px] border-dashed border-primary-deep bg-primary-soft"
              style={{ transform: [{ rotate: '-4deg' }] }}
            >
              <Text className="font-displayBold text-[10px] text-primary-deep">04</Text>
              <Text className="font-displayBold text-[18px] text-primary">26</Text>
            </View>
          </View>
        </View>

        {/* Excerpt sheet */}
        <View
          className="bg-bg-elev p-5 shadow-card"
          style={{
            // Tear-edge top via clipPath isn't native — fake it with a
            // dashed top border which still reads as "torn" against
            // the envelope above.
            borderTopWidth: 2,
            borderTopColor: c.lineSoft,
            borderStyle: 'dashed',
          }}
        >
          <Text
            className="font-body text-[14px] leading-[22px] text-ink-soft"
            numberOfLines={6}
          >
            {slide.excerpt}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          className="flex-row items-center gap-2 self-start rounded-full bg-ink px-5 py-3 active:opacity-80"
        >
          <Text className="font-bodyBold text-[13px] text-bg">{slide.ctaLabel}</Text>
          <ArrowRight size={14} color={c.bg} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}
