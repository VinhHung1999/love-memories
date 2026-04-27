// Letter variant 4 — Postcard. D4 refactor: text column is now a paper-
// cream sheet (notebook rules + Dancing-Script signature) so the right
// half of the postcard reads as the actual handwritten message side.
// Photo column stays full-bleed.

import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import { PAPER_INK, PAPER_INK_MUTE, PaperSheet, PaperSignature } from './PaperSheet';
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
      {/* D7 — postcard mini (rotated, fixed height) header + full
          paper-cream sheet below with scrollable content. Original
          rotated 2-col postcard layout couldn't host a ScrollView
          cleanly through the transform; the mini-postcard visual
          reads as the keepsake postcard, the full text follows
          underneath like reading the back. */}
      <View className="flex-1 items-center px-4 pb-4 pt-12">
        <View
          className="flex-row overflow-hidden rounded-lg border border-line shadow-elevated"
          style={{ width: '90%', maxWidth: 320, transform: [{ rotate: '-2deg' }] }}
        >
          {/* Photo column */}
          <View style={{ width: '42%', aspectRatio: 0.95 }}>
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
          {/* Mini text column — kicker + title only, full content lives
              in the scrollable paper sheet below. */}
          <View className="flex-1 p-3" style={{ backgroundColor: '#FDFAF5' }}>
            <Text
              className="font-bodyBold text-[8px] uppercase tracking-[2px]"
              style={{ color: PAPER_INK_MUTE }}
              numberOfLines={1}
            >
              {slide.kicker}
            </Text>
            <Text
              className="mt-1 font-script text-[18px] leading-[22px]"
              style={{ color: PAPER_INK }}
              numberOfLines={3}
            >
              {slide.title}
            </Text>
          </View>
        </View>

        {/* Full body in a paper sheet that grows + scrolls. */}
        <PaperSheet
          approxHeight={520}
          className="mt-4 w-full max-w-[360px] flex-1 rounded-[14px] px-5 pb-5 pt-5 shadow-card"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              className="font-body text-[14px] leading-[22px]"
              style={{ color: PAPER_INK }}
            >
              {slide.content}
            </Text>
            <PaperSignature senderName={slide.senderName} />
          </ScrollView>
        </PaperSheet>

        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          className="mt-4 flex-row items-center gap-2 rounded-full bg-ink px-5 py-3 active:opacity-80"
        >
          <Text className="font-bodyBold text-[13px] text-bg">{slide.ctaLabel}</Text>
          <ArrowRight size={14} color={c.bg} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}
