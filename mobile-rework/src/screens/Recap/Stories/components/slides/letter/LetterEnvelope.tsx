// Letter variant 3 — Vintage envelope on top, paper-cream excerpt sheet
// peeking out below. D4 refactor: the bottom "excerpt sheet" is now a
// real PaperSheet (cream + notebook lines + Dancing-Script signature),
// matching LetterReadScreen so the airmail envelope reads as the
// physical wrapper around an actual letter.

import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import { PAPER_INK, PaperSheet, PaperSignature } from './PaperSheet';
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
      <View className="flex-1 justify-center px-5" style={{ gap: 14 }}>
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

        {/* Excerpt sheet — real cream paper with notebook rules. */}
        <PaperSheet
          approxHeight={320}
          className="rounded-[14px] px-5 pb-5 pt-5 shadow-card"
        >
          <Text
            className="font-bodyBold text-[9px] uppercase tracking-[2.5px]"
            style={{ color: PAPER_INK }}
          >
            ✉ Trích thư
          </Text>
          {/* D5 — STATIC className. */}
          <Text
            className="mt-2 font-body text-[15px] leading-[24px]"
            style={{ color: PAPER_INK }}
            numberOfLines={7}
          >
            {slide.excerpt}
          </Text>
          <PaperSignature senderName={slide.senderName} />
        </PaperSheet>

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
