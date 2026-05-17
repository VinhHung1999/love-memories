import { Heart, Pause, Play, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  type LayoutChangeEvent,
  Pressable,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { useMapPreviewStore } from '@/stores/mapPreviewStore';
import { useAppColors } from '@/theme/ThemeProvider';

import type { MomentPreviewCardProps } from '../types';
import {
  MapAudioPlayer,
  useCurrentPlayingMomentId,
} from './MapAudioPlayer';

// T472 Slice 3 (Sprint 70) — Memory Map slide-up preview card.
//
// One shared progress value (0 → hidden, 1 → fully revealed) drives both
// the card's translateY and the dim overlay's opacity so they can never
// drift out of sync. withTiming + Easing.out(cubic) (250ms) matches the
// spec; we deliberately reject withSpring (overshoot would feel wrong
// against the locked-bottom layout) and layout animations (can't be
// cancelled mid-flight cleanly when the user rapidly taps two pins).
//
// We keep the underlying <View>s mounted in both directions and let
// pointerEvents flip on the dim overlay so a fully hidden card can't
// swallow map touches. The card itself is offscreen via translateY when
// hidden so its rounded corners + shadow don't bleed up into the map.
//
// Reanimated v4 worklet rule (memory-locked): we resolve useAppColors()
// at the React layer (outside any worklet), capture the primitive value
// into a local const, and only reference that primitive inside the
// useAnimatedStyle worklet closure. Calling the hook inside a worklet
// crashes at runtime.

// NativeWind v4 rule (memory-locked): no ternary in className. Conditional
// styling — the polaroid border, the audio-thumb playing state — flips via
// inline `style` prop sourced from useAppColors(). className stays a
// single static string per node for layout/typography only.

const ANIM_MS = 250;

function formatDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function MomentPreviewCard({
  moment,
  onOpenFull,
  onClose,
}: MomentPreviewCardProps) {
  const { t, i18n } = useTranslation();
  const c = useAppColors();
  const progress = useSharedValue(0);
  const playingId = useCurrentPlayingMomentId();
  // Card height measured at first layout. Until then we keep the card
  // fully off-screen via an over-large fallback so the very first reveal
  // never flashes at translateY=0.
  const [cardHeight, setCardHeight] = useState(600);

  // The card may be re-rendered with a *different* moment without ever
  // passing through `null` (user taps pin B while pin A's card is open).
  // We hold onto the last non-null payload so the exit animation can
  // still show the right content while sliding down.
  const lastMomentRef = useRef(moment);
  if (moment) lastMomentRef.current = moment;
  const display = moment ?? lastMomentRef.current;

  useEffect(() => {
    progress.value = withTiming(moment ? 1 : 0, {
      duration: ANIM_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [moment, progress]);

  // T472 Build 149 fix — broadcast visibility so PillTabBar can hide while
  // the card is open (the floating tabbar otherwise covers the bottom of
  // the card; mounted as a sibling of the scene, can't be z-index'd from
  // here). Reset on unmount so a tab switch while a card is open doesn't
  // leave the tabbar hidden.
  const setPreviewVisible = useMapPreviewStore((s) => s.setVisible);
  useEffect(() => {
    setPreviewVisible(moment !== null);
  }, [moment, setPreviewVisible]);
  useEffect(() => {
    return () => {
      setPreviewVisible(false);
    };
  }, [setPreviewVisible]);

  // Stop any singleton playback when the card fully unmounts (e.g. the
  // user navigates away from the Map tab) — otherwise the audio bleeds
  // into the next screen.
  useEffect(() => {
    return () => {
      void MapAudioPlayer.stop();
    };
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * cardHeight }],
  }));

  const dimAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.5,
  }));

  // Hidden → pointerEvents="none" so map gestures pass through.
  const interactive = moment !== null;

  const onCardLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== cardHeight) setCardHeight(h);
  };

  if (!display) return null;

  const isPlayingThis = playingId === display.id;
  const polaroidBorderStyle =
    display.kind === 'polaroid' && display.thumbnailUrl
      ? { borderWidth: 4, borderColor: c.bg }
      : null;
  const audioThumbStyle = isPlayingThis
    ? { backgroundColor: c.primary }
    : { backgroundColor: c.surfaceAlt };
  const audioIconColor = isPlayingThis ? c.bg : c.ink;

  const onAudioPress = () => {
    if (isPlayingThis) {
      void MapAudioPlayer.stop();
    } else {
      void MapAudioPlayer.play(display.id);
    }
  };

  return (
    <>
      <Animated.View
        pointerEvents={interactive ? 'auto' : 'none'}
        className="absolute inset-0 bg-ink"
        style={dimAnimatedStyle}
      >
        <Pressable
          accessibilityLabel={t('common.close')}
          className="flex-1"
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        pointerEvents={interactive ? 'auto' : 'none'}
        onLayout={onCardLayout}
        className="absolute left-0 right-0 bottom-0 bg-bg-elev rounded-t-3xl shadow-lg p-5 pb-8"
        style={cardAnimatedStyle}
      >
        {/* T472 Build 149 fix — the body Pressable below `pr-8`-pads its
            *content* but its tap area still spans the full card width
            including the X corner. When the X was rendered BEFORE the body,
            RN's responder system gave overlapping taps to the later sibling
            (the body Pressable → onOpenFull fired instead of onClose). Body
            first, X last (rendered topmost) → X tap reaches onClose. */}
        <Pressable
          accessibilityRole="button"
          onPress={onOpenFull}
          className="flex-row gap-4 pr-8 active:opacity-80"
        >
          {display.thumbnailUrl ? (
            <View
              className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-alt"
              style={polaroidBorderStyle}
            >
              <Image
                source={{ uri: display.thumbnailUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          ) : (
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center"
              style={{ backgroundColor: c.primarySoft }}
            >
              <Heart
                size={26}
                strokeWidth={2.2}
                color={c.primary}
                fill={c.primary}
              />
            </View>
          )}

          <View className="flex-1 min-w-0">
            <Text
              numberOfLines={1}
              className="font-displayMedium text-ink text-[17px]"
            >
              {display.title ?? t('map.untitled')}
            </Text>
            <Text className="font-body text-ink-mute text-[13px] mt-0.5">
              {formatDate(display.date, i18n.language)}
            </Text>
            {display.location ? (
              <Text
                numberOfLines={1}
                className="font-body text-ink-mute text-[13px] mt-0.5"
              >
                {display.location}
              </Text>
            ) : null}
          </View>
        </Pressable>

        <View className="flex-row items-center gap-2 mt-4">
          <Avatar uri={display.author.avatar} name={display.author.name} size="sm" />
          <Text className="font-body text-ink-mute text-[13px]">
            {t('map.byAuthor', { name: display.author.name })}
          </Text>
        </View>

        {display.hasAudio ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('map.voiceMemo')}
            onPress={onAudioPress}
            className="flex-row items-center gap-3 mt-4 px-3.5 py-3 rounded-2xl active:opacity-80"
            style={audioThumbStyle}
          >
            {isPlayingThis ? (
              <Pause size={16} strokeWidth={2.4} color={audioIconColor} />
            ) : (
              <Play size={16} strokeWidth={2.4} color={audioIconColor} />
            )}
            <Text
              className="font-bodyMedium text-[13px]"
              style={{ color: audioIconColor }}
            >
              {t('map.voiceMemo')}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onOpenFull}
          className="mt-5 rounded-full py-3.5 items-center active:opacity-90"
          style={{ backgroundColor: c.ink }}
        >
          <Text
            className="font-bodySemibold text-[15px]"
            style={{ color: c.bg }}
          >
            {t('map.openMoment')}
          </Text>
        </Pressable>

        {/* X close — MUST be the last child of the card so it sits topmost in
            RN's responder order (later sibling wins overlapping taps). See
            the Build-149 comment above the body Pressable. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          className="absolute top-3 right-3 w-9 h-9 rounded-full items-center justify-center active:opacity-70"
          hitSlop={8}
        >
          <X size={18} strokeWidth={2.2} color={c.inkMute} />
        </Pressable>
      </Animated.View>
    </>
  );
}
