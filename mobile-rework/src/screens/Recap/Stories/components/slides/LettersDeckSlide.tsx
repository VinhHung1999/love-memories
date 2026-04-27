// Sprint 67 D9 — Stacked-deck letter slide. Boss confirm 2026-04-28:
// "nhiều cái letter read chồng lên nhau dàn ra như 1 chồng thư vậy á"
// — letters render as a Tinder-style pile of cards. Top card = full
// read-style letter, peek cards behind tilted deterministically per
// id-hash. Horizontal swipe on the top card flips it out + promotes
// the next. Last card swipe → caller's `onAdvance` fires (we feed in
// the Stories controller's `next()` so the deck folds into the
// auto-advance flow).
//
// Architecture notes:
//   • Reanimated v4 + Gesture.Pan with axis-locked offsets — `activeOffsetX`
//     activates the pan only past ±15px horizontal travel, `failOffsetY`
//     hands vertical drag back to the inner ScrollView so long letter
//     bodies still scroll. Pattern from `paged-zoomable-gallery-gesture-
//     coordination.md` (mirror axis).
//   • Worklets must NOT call `useAppColors()` directly — we capture the
//     colour values to JS const before constructing `useAnimatedStyle`.
//   • Deterministic per-card tilt + nudge from a stable id-hash so the
//     pile shape doesn't reshuffle each render.
//   • Up to 3 peek cards visible behind the top card. When the deck is
//     deeper than 4 letters we render a "+N more" badge on the bottom-
//     most peek card.

import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppColors } from '@/theme/ThemeProvider';

import {
  PAPER_INK,
  PAPER_INK_MUTE,
  PaperSheet,
  PaperSignature,
} from './letter/PaperSheet';
import type { Slide } from '../../types';

type LettersDeckSlide = Extract<Slide, { kind: 'lettersDeck' }>;

type Props = {
  slide: LettersDeckSlide;
  /** Caller (RecapStoriesScreen) hands in the Stories controller's
   *  `next()` so the deck advances the slide after the last letter. */
  onAdvance: () => void;
};

const VISIBLE_PEEK = 3; // max peek cards behind the top card
const SWIPE_THRESHOLD = 110; // px translation to trigger flip-out
const SWIPE_VELOCITY = 700; // px/s velocity escape hatch

// Stable hash → tilt + nudge per letter id so the pile shape is
// deterministic across renders.
function tiltFor(id: string, depth: number): { rotate: number; tx: number; ty: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  // Tilts cycle through -5°, -2°, +3°, +6° based on hash
  const tilts = [-5, -2, 3, 6];
  const rotate = tilts[h % tilts.length]!;
  // Sideways nudge ±10px so peek cards don't all stack centred.
  const tx = ((h >> 4) % 21) - 10;
  const ty = depth * 8; // each card sits 8px lower than the one above
  return { rotate, tx, ty };
}

export function LettersDeckSlide({ slide, onAdvance }: Props) {
  const c = useAppColors();
  // JS-side colour const so worklets can close over a primitive.
  const inkColor = c.ink;

  // Empty state — render an empty paper card with the localized empty
  // message. No swipe interaction needed.
  if (slide.letters.length === 0) {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={[c.secondarySoft, c.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <View className="flex-1 px-5 pb-4 pt-12">
          <DeckHeader kicker={slide.kicker} headline={slide.headline} />
          <View className="flex-1 items-center justify-center">
            <PaperSheet
              approxHeight={300}
              className="w-full max-w-[340px] rounded-[20px] px-6 pb-7 pt-7 shadow-elevated"
            >
              <Text
                className="text-center font-script text-[24px] leading-[32px]"
                style={{ color: PAPER_INK }}
              >
                {slide.emptyText ?? '—'}
              </Text>
            </PaperSheet>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[c.secondarySoft, c.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View className="flex-1 px-5 pb-4 pt-12">
        <DeckHeader kicker={slide.kicker} headline={slide.headline} />
        <Deck letters={slide.letters} onAdvance={onAdvance} inkColor={inkColor} />
      </View>
    </View>
  );
}

function DeckHeader({ kicker, headline }: { kicker: string; headline: string }) {
  return (
    <View className="mb-3 px-1">
      <Text className="font-bodyBold text-[10px] uppercase tracking-widest text-ink-mute">
        {kicker}
      </Text>
      <Text
        className="mt-1 font-script text-[26px] leading-[30px] text-ink"
        numberOfLines={1}
      >
        {headline}
      </Text>
    </View>
  );
}

type DeckLetter = LettersDeckSlide['letters'][number];

function Deck({
  letters,
  onAdvance,
  inkColor,
}: {
  letters: DeckLetter[];
  onAdvance: () => void;
  inkColor: string;
}) {
  // topIndex = which letter is currently the readable top card.
  const [topIndex, setTopIndex] = useState(0);

  const handleSwiped = useMemo(
    () => () => {
      setTopIndex((i) => {
        const next = i + 1;
        if (next >= letters.length) {
          // Last card swiped → fold into the Stories auto-advance.
          onAdvance();
          return i;
        }
        return next;
      });
    },
    [letters.length, onAdvance],
  );

  // Render up to VISIBLE_PEEK + 1 cards (top + peek). Iterate in
  // reverse so the bottom card mounts first → top card paints last.
  const visibleSlice = letters.slice(topIndex, topIndex + VISIBLE_PEEK + 1);
  const remainingBeyondVisible =
    letters.length - topIndex - visibleSlice.length;

  return (
    <View className="flex-1 items-center justify-center">
      {visibleSlice
        .map((letter, depth) => ({ letter, depth }))
        .reverse()
        .map(({ letter, depth }) => {
          const isTop = depth === 0;
          const baseTilt = tiltFor(letter.id, depth);
          return (
            <DeckCard
              key={letter.id}
              letter={letter}
              depth={depth}
              isTop={isTop}
              baseTilt={baseTilt}
              onSwiped={handleSwiped}
              extraOverlayCount={depth === VISIBLE_PEEK ? Math.max(0, remainingBeyondVisible) : 0}
              inkColor={inkColor}
            />
          );
        })}
    </View>
  );
}

function DeckCard({
  letter,
  depth,
  isTop,
  baseTilt,
  onSwiped,
  extraOverlayCount,
  inkColor,
}: {
  letter: DeckLetter;
  depth: number;
  isTop: boolean;
  baseTilt: { rotate: number; tx: number; ty: number };
  onSwiped: () => void;
  extraOverlayCount: number;
  inkColor: string;
}) {
  // Pan offsets only animated for the top card. Peek cards stay
  // statically transformed by their base tilt.
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(1);

  const pan = useMemo(() => {
    return Gesture.Pan()
      // Axis-lock: only activate past ±15px horizontal; bail on
      // vertical so the inner ScrollView keeps reading rights.
      .activeOffsetX([-15, 15])
      .failOffsetY([-12, 12])
      .onUpdate((e) => {
        tx.value = e.translationX;
        ty.value = e.translationY * 0.4; // mild vertical drift while swiping
      })
      .onEnd((e) => {
        const horiz = Math.abs(e.translationX);
        const fast = Math.abs(e.velocityX) > SWIPE_VELOCITY;
        if (horiz > SWIPE_THRESHOLD || fast) {
          // Flip out off-screen in the swipe direction.
          const dir = e.translationX >= 0 ? 1 : -1;
          tx.value = withTiming(dir * 600, { duration: 280 });
          ty.value = withTiming(80 * dir, { duration: 280 });
          opacity.value = withTiming(0, { duration: 220 }, () => {
            runOnJS(onSwiped)();
          });
        } else {
          // Snap back.
          tx.value = withSpring(0, { damping: 16, stiffness: 180 });
          ty.value = withSpring(0, { damping: 16, stiffness: 180 });
        }
      });
  }, [onSwiped, tx, ty, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!isTop) {
      // Static peek card transform — no animation, just the base tilt.
      return {
        transform: [
          { translateX: baseTilt.tx },
          { translateY: baseTilt.ty },
          { rotate: `${baseTilt.rotate}deg` },
        ],
        opacity: 1,
      };
    }
    // Top card: base tilt + active pan deltas + a small rotate that
    // tracks horizontal drag (Tinder-style affordance).
    const dragRotate = interpolate(tx.value, [-300, 0, 300], [-12, 0, 12]);
    return {
      transform: [
        { translateX: baseTilt.tx + tx.value },
        { translateY: baseTilt.ty + ty.value },
        { rotate: `${baseTilt.rotate + dragRotate}deg` },
      ],
      opacity: opacity.value,
    };
  });

  // Card markup — top card is interactive (PaperSheet + ScrollView),
  // peek cards render a stripped-down silhouette of the same shape.
  const card = (
    <Animated.View
      // Absolute so all deck cards stack at the same anchor — only
      // their transforms differ. Width capped so the pile doesn't
      // hug the screen edges on tablet-sized devices.
      style={[
        {
          position: 'absolute',
          width: '92%',
          maxWidth: 380,
          height: '94%',
          // zIndex inverse of depth so top card is on top visually
          // (we already render bottom-up, but explicit zIndex helps
          // Android layout).
          zIndex: 10 - depth,
        },
        animatedStyle,
      ]}
    >
      {isTop ? (
        <TopCard letter={letter} inkColor={inkColor} />
      ) : (
        <PeekCard letter={letter} extraOverlayCount={extraOverlayCount} />
      )}
    </Animated.View>
  );

  if (!isTop) return card;

  return <GestureDetector gesture={pan}>{card}</GestureDetector>;
}

function TopCard({ letter, inkColor: _ink }: { letter: DeckLetter; inkColor: string }) {
  return (
    <PaperSheet
      approxHeight={780}
      className="h-full rounded-[20px] px-6 pb-6 pt-7 shadow-elevated"
    >
      <Text
        className="font-bodyBold text-[10px] uppercase tracking-widest"
        style={{ color: PAPER_INK_MUTE }}
      >
        {letter.kicker}
      </Text>
      <Text
        className="mt-1 font-script text-[26px] leading-[32px]"
        style={{ color: PAPER_INK }}
        numberOfLines={2}
      >
        {letter.title}
      </Text>
      {letter.thumb ? (
        <Image
          source={{ uri: letter.thumb }}
          resizeMode="cover"
          className="mt-3 h-[140px] w-full rounded-md"
        />
      ) : null}
      <ScrollView
        className="mt-3 flex-1"
        contentContainerStyle={{ paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="font-body text-[15px] leading-[24px]"
          style={{ color: PAPER_INK }}
        >
          {letter.content}
        </Text>
        <PaperSignature senderName={letter.senderName} />
      </ScrollView>
    </PaperSheet>
  );
}

function PeekCard({
  letter,
  extraOverlayCount,
}: {
  letter: DeckLetter;
  extraOverlayCount: number;
}) {
  return (
    <PaperSheet
      approxHeight={780}
      className="h-full rounded-[20px] px-6 pb-6 pt-7 shadow-card"
    >
      <Text
        className="font-bodyBold text-[10px] uppercase tracking-widest"
        style={{ color: PAPER_INK_MUTE }}
        numberOfLines={1}
      >
        {letter.kicker}
      </Text>
      <Text
        className="mt-1 font-script text-[24px] leading-[28px]"
        style={{ color: PAPER_INK }}
        numberOfLines={1}
      >
        {letter.title}
      </Text>
      {extraOverlayCount > 0 ? (
        <View className="absolute bottom-3 right-4 rounded-full bg-ink/85 px-3 py-1">
          <Text className="font-bodyBold text-[11px] text-bg">
            +{extraOverlayCount}
          </Text>
        </View>
      ) : null}
    </PaperSheet>
  );
}
