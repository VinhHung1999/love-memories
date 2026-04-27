// Sprint 67 D8 — Single consolidated letter slide. Replaces the D2-D7
// pattern of one slide per letter (with rotated paper variants
// Classic/Polaroid/Envelope/Postcard). Boss directive 2026-04-27:
// "phải hiển thị TOÀN BỘ mấy cái lá thư" — all letters together,
// read-style, in one place.
//
// Layout: full-screen cream paper sheet with notebook rules + ScrollView
// stacking each letter as a mini-card (kicker, title, full content,
// Dancing-Script signature). Letters separated by an ornamental hairline
// divider. Auto-advance is paused via RecapStoriesScreen so the reader
// controls pacing — tap right edge of the screen to advance after
// reading.

import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Heart } from 'lucide-react-native';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import {
  PAPER_INK,
  PAPER_INK_MUTE,
  PaperSheet,
  PaperSignature,
} from './letter/PaperSheet';
import type { Slide } from '../../types';

type LettersCollectionSlide = Extract<Slide, { kind: 'lettersCollection' }>;

type Props = { slide: LettersCollectionSlide; onOpen: () => void };

export function LettersCollectionSlide({ slide, onOpen }: Props) {
  const c = useAppColors();
  return (
    <View className="flex-1">
      <LinearGradient
        colors={[c.secondarySoft, c.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View className="flex-1 px-5 pb-4 pt-12">
        <PaperSheet
          approxHeight={900}
          className="flex-1 rounded-[20px] px-6 pb-6 pt-7 shadow-elevated"
        >
          {/* Kicker + headline anchor the top of the paper. The
              ScrollView below owns the rest of the height so long
              letter stacks scroll inside the sheet. */}
          <Text
            className="font-bodyBold text-[10px] uppercase tracking-widest"
            style={{ color: PAPER_INK_MUTE }}
          >
            {slide.kicker}
          </Text>
          <Text
            className="mt-1 font-script text-[28px] leading-[34px]"
            style={{ color: PAPER_INK }}
            numberOfLines={2}
          >
            {slide.headline}
          </Text>

          <ScrollView
            className="mt-3 flex-1"
            contentContainerStyle={{ paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {slide.letters.map((letter, idx) => (
              <View key={letter.id} className={idx > 0 ? 'mt-5' : 'mt-1'}>
                {idx > 0 ? <LetterDivider /> : null}
                <View className={idx > 0 ? 'mt-5' : ''}>
                  <Text
                    className="font-bodyBold text-[10px] uppercase tracking-[2px]"
                    style={{ color: PAPER_INK_MUTE }}
                  >
                    {letter.kicker}
                  </Text>
                  <Text
                    className="mt-1 font-script text-[22px] leading-[28px]"
                    style={{ color: PAPER_INK }}
                    numberOfLines={2}
                  >
                    {letter.title}
                  </Text>
                  {letter.thumb ? (
                    <Image
                      source={{ uri: letter.thumb }}
                      resizeMode="cover"
                      className="mt-3 h-[160px] w-full rounded-md"
                    />
                  ) : null}
                  <Text
                    className="mt-3 font-body text-[15px] leading-[24px]"
                    style={{ color: PAPER_INK }}
                  >
                    {letter.content}
                  </Text>
                  <PaperSignature senderName={letter.senderName} />
                </View>
              </View>
            ))}
          </ScrollView>
        </PaperSheet>

        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          className="mt-4 flex-row items-center gap-2 self-center rounded-full bg-ink px-5 py-3 active:opacity-80"
        >
          <Text className="font-bodyBold text-[13px] text-bg">{slide.ctaLabel}</Text>
          <ArrowRight size={14} color={c.bg} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

// Subtle hairline + heart glyph between letters — keeps the paper-sheet
// vocabulary (no hard borders) while signalling "this is a new letter".
function LetterDivider() {
  return (
    <View className="flex-row items-center" style={{ gap: 8 }}>
      <View
        className="h-px flex-1"
        style={{ backgroundColor: 'rgba(42,26,30,0.18)' }}
      />
      <Heart size={10} color={PAPER_INK_MUTE} fill={PAPER_INK_MUTE} strokeWidth={0} />
      <View
        className="h-px flex-1"
        style={{ backgroundColor: 'rgba(42,26,30,0.18)' }}
      />
    </View>
  );
}
