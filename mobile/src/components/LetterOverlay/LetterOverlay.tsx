/**
 * LetterOverlay
 *
 * Full-screen overlay shown once per session when unread love letters exist.
 * - Envelope card slides up from bottom (spring)
 * - Wax seal pops in after card settles
 * - Letter preview body reveals after seal
 * - "Đọc ngay" navigates to LettersTab; "Để sau" dismisses (UnreadLetterCard stays on Dashboard)
 * - 1x per session via hasFetched ref in ViewModel
 */

import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Body, Caption, Cursive, Heading, Label } from '../Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Heart } from 'lucide-react-native';
import { useAppColors } from '../../navigation/theme';
import FastImage from 'react-native-fast-image';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useLetterOverlayViewModel } from './useLetterOverlayViewModel';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Main overlay ─────────────────────────────────────────────────────────────

export default function LetterOverlay() {
  const { t } = useTranslation();
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const vm = useLetterOverlayViewModel();

  // ── Shared values ──────────────────────────────────────────────────────────
  const scrimOpacity  = useSharedValue(0);
  const cardTranslateY = useSharedValue(140);
  const cardOpacity   = useSharedValue(0);
  const sealScale     = useSharedValue(0.2);
  const sealOpacity   = useSharedValue(0);
  const bodyTranslateY = useSharedValue(20);
  const bodyOpacity   = useSharedValue(0);
  const ctaTranslateY = useSharedValue(12);
  const ctaOpacity    = useSharedValue(0);

  // ── Enter animation (5-phase sequence) ────────────────────────────────────
  useEffect(() => {
    if (!vm.visible) return;

    // Phase 1 — scrim (t=0)
    scrimOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) });

    // Phase 2 — card slides up (t=100ms)
    cardTranslateY.value = withDelay(100, withSpring(0, { mass: 0.8, stiffness: 160, damping: 18 }));
    cardOpacity.value    = withDelay(100, withTiming(1, { duration: 280 }));

    // Phase 3 — seal pops in (t=350ms)
    sealScale.value  = withDelay(350, withSpring(1, { mass: 0.5, stiffness: 300, damping: 14 }));
    sealOpacity.value = withDelay(350, withTiming(1, { duration: 150 }));

    // Phase 4 — body reveals (t=450ms)
    bodyTranslateY.value = withDelay(450, withSpring(0, { mass: 0.6, stiffness: 180, damping: 20 }));
    bodyOpacity.value    = withDelay(450, withTiming(1, { duration: 280 }));

    // Phase 5 — CTAs appear (t=600ms)
    ctaTranslateY.value = withDelay(600, withSpring(0, { mass: 0.5, stiffness: 200, damping: 22 }));
    ctaOpacity.value    = withDelay(600, withTiming(1, { duration: 250 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vm.visible]);

  // ── Exit animation ─────────────────────────────────────────────────────────
  function animateOut(onDone: () => void) {
    const ease = Easing.in(Easing.quad);
    cardTranslateY.value = withTiming(80,  { duration: 260, easing: ease });
    cardOpacity.value    = withTiming(0,   { duration: 260, easing: ease });
    scrimOpacity.value   = withTiming(0,   { duration: 300, easing: ease }, () => {
      runOnJS(onDone)();
    });
  }

  function handleDismiss() {
    animateOut(() => vm.dismiss());
  }

  function handleReadNow() {
    const letterId = vm.readNow();
    animateOut(() => {
      navigation.navigate('LettersTab');
    });
    void letterId; // used by ViewModel to mark read
  }

  // ── Animated styles ────────────────────────────────────────────────────────
  const scrimStyle     = useAnimatedStyle(() => ({ opacity: scrimOpacity.value }));
  const cardStyle      = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));
  const sealStyle      = useAnimatedStyle(() => ({
    opacity: sealOpacity.value,
    transform: [{ scale: sealScale.value }],
  }));
  const bodyStyle      = useAnimatedStyle(() => ({
    opacity: bodyOpacity.value,
    transform: [{ translateY: bodyTranslateY.value }],
  }));
  const ctaStyle       = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  if (!vm.visible || !vm.firstLetter) return null;

  const letter     = vm.firstLetter;
  const senderName = letter.sender?.name ?? t('loveLetters.unknownSender', { defaultValue: 'Your partner' });
  const date       = formatDate(letter.deliveredAt ?? letter.createdAt);
  const title      = vm.unreadCount === 1
    ? t('letterOverlay.title', { name: senderName })
    : t('letterOverlay.titlePlural', { count: vm.unreadCount });

  return (
    <Animated.View
      className="absolute inset-0"
      style={[{ zIndex: 9999 }, scrimStyle]}
      pointerEvents="box-none"
    >
      {/* Dim scrim — tap outside dismisses */}
      <Pressable
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(26,22,36,0.55)' }}
        onPress={handleDismiss}
      />

      {/* Card stage — vertically centered */}
      <View
        className="absolute left-0 right-0 top-0 bottom-0 flex-1 justify-center"
        style={{ paddingVertical: Math.max(insets.top, 20) + 8, paddingBottom: Math.max(insets.bottom, 24) + 8 }}
        pointerEvents="box-none"
      >
        {/* ── Envelope card ── */}
        <Animated.View
          className="mx-5 rounded-[28px] bg-white overflow-hidden"
          style={[
            cardStyle,
            {
              shadowColor: 'rgba(232,120,138,0.28)',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 1,
              shadowRadius: 48,
              elevation: 20,
            },
          ]}
        >
          {/* ── Envelope flap: photos if available, otherwise gradient ── */}
          {letter.photos && letter.photos.length > 0 ? (
            <View
              className="overflow-hidden"
              style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, height: 160 }}>
              {letter.photos.length === 1 ? (
                <FastImage
                  source={{ uri: letter.photos[0].url }}
                  style={{ width: '100%', height: 160 }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : (
                <View className="flex-row h-[160px]">
                  {letter.photos.slice(0, 3).map((photo, idx) => (
                    <FastImage
                      key={photo.id}
                      source={{ uri: photo.url }}
                      style={{ flex: 1, height: 160, marginLeft: idx > 0 ? 2 : 0 }}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  ))}
                </View>
              )}
              {/* Fold crease line */}
              <View
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ backgroundColor: 'rgba(232,120,138,0.18)' }}
              />
            </View>
          ) : (
            <LinearGradient
              colors={[colors.primaryLighter, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
            >
              <View className="h-[140px] items-center justify-center">
                {/* Fold crease line */}
                <View
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ backgroundColor: 'rgba(232,120,138,0.18)' }}
                />
              </View>
            </LinearGradient>
          )}

          {/* ── Wax seal — straddles flap / body boundary ── */}
          <Animated.View
            className="absolute self-center"
            style={[
              sealStyle,
              { top: 140 - 24 }, // half above fold
            ]}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Heart size={20} color="#fff" fill="#fff" strokeWidth={0} />
            </View>
          </Animated.View>

          {/* ── Letter body ── */}
          <Animated.View className="px-6 pt-10 pb-6" style={bodyStyle}>
            {/* Sender row */}
            <View
              className="flex-row items-center gap-3 pb-4"
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              {/* Avatar circle */}
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primaryMuted }}
              >
                <Label className="font-bold" style={{ color: colors.primary }}>
                  {(letter.sender?.name ?? '?').charAt(0).toUpperCase()}
                </Label>
              </View>

              {/* Name */}
              <View className="flex-1">
                <Caption className="uppercase tracking-widest" style={{ color: colors.textLight }}>
                  {t('letterOverlay.from')}
                </Caption>
                <Label className="font-semibold" style={{ color: colors.textDark }}>
                  {senderName}
                </Label>
              </View>

              {/* Extra letters badge */}
              {vm.extraCount > 0 ? (
                <View
                  className="rounded-full px-2.5 py-1"
                  style={{ backgroundColor: colors.primaryMuted }}
                >
                  <Caption className="font-semibold" style={{ color: colors.primary }}>
                    {t('letterOverlay.moreLetters', { n: vm.extraCount })}
                  </Caption>
                </View>
              ) : null}
            </View>

            {/* Date */}
            {date ? (
              <Caption className="mt-3 mb-1" style={{ color: colors.textLight }}>{date}</Caption>
            ) : null}

            {/* Title */}
            <Cursive className="mt-1 mb-3 text-[18px]" style={{ color: colors.textDark }}>
              {letter.title}
            </Cursive>

            {/* Snippet */}
            <Body
              size="md"
              className="leading-relaxed"
              style={{ color: colors.textMid }}
              numberOfLines={4}
            >
              {vm.snippet}
            </Body>

            {/* Mood tag */}
            {letter.mood ? (
              <View
                className="self-start rounded-full px-3 py-1 mt-3"
                style={{ backgroundColor: colors.primaryMuted }}
              >
                <Caption className="font-medium" style={{ color: colors.primary }}>
                  {letter.mood}
                </Caption>
              </View>
            ) : null}
          </Animated.View>
        </Animated.View>

        {/* ── CTAs ── */}
        <Animated.View className="mx-5 mt-4 gap-2.5" style={ctaStyle}>
          {/* Primary — Read now */}
          <Pressable onPress={handleReadNow} style={{ width: '100%' }}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16 }}
            >
              <View className="py-4 items-center justify-center">
                <Heading size="sm" className="text-white">
                  {t('letterOverlay.readNow')}
                </Heading>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Secondary — Later */}
          <Pressable onPress={handleDismiss} className="py-3.5 items-center justify-center">
            <Body size="md" className="font-semibold" style={{ color: colors.textMid }}>
              {t('letterOverlay.readLater')}
            </Body>
          </Pressable>
        </Animated.View>

        {/* Bottom header caption */}
        <View className="items-center mt-2 mx-5">
          <Caption className="text-center" style={{ color: 'rgba(255,255,255,0.70)' }}>
            {title}
          </Caption>
        </View>
      </View>
    </Animated.View>
  );
}
