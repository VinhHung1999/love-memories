import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import t from '../../locales/en';
import {
  useMonthlyRecapViewModel,
  formatMonthDisplay,
  type SlideData,
} from './useMonthlyRecapViewModel';

// ── Constants ─────────────────────────────────────────────────────────────────

const SLIDE_DURATION = 6000;
const HOLD_THRESHOLD = 200;
const { width: SCREEN_W } = Dimensions.get('window');

// ── AnimatedNumber ────────────────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    setDisplay(0);
    if (!value) return;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplay(Math.round((value * step) / 30));
      if (step >= 30) { clearInterval(timer); setDisplay(value); }
    }, 50);
    return () => clearInterval(timer);
  }, [value]);

  return <>{display}</>;
}

// ── PhotoStrip ────────────────────────────────────────────────────────────────
// Two rows scrolling in opposite directions using Reanimated

const PHOTO_SIZE_1 = 104;
const PHOTO_SIZE_2 = 88;
const PHOTO_GAP = 8;

function PhotoStrip({ photos }: { photos: string[] }) {
  const cellW1 = PHOTO_SIZE_1 + PHOTO_GAP;
  const cellW2 = PHOTO_SIZE_2 + PHOTO_GAP;
  const loopW1 = photos.length * cellW1;
  const loopW2 = photos.length * cellW2;

  const tx1 = useSharedValue(0);
  const tx2 = useSharedValue(-loopW2);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (photos.length === 0) return;
    tx1.value = withRepeat(
      withTiming(-loopW1, { duration: photos.length * 4000, easing: Easing.linear }),
      -1,
      false,
    );
    tx2.value = withRepeat(
      withTiming(0, { duration: photos.length * 5000, easing: Easing.linear }),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  const style1 = useAnimatedStyle(() => ({ transform: [{ translateX: tx1.value }] }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ translateX: tx2.value }] }));

  if (photos.length === 0) return null;

  // Triple-duplicate for seamless loop
  const strip = [...photos, ...photos, ...photos];

  return (
    <View className="absolute inset-0 overflow-hidden">
      {/* Row 1 — scrolls left */}
      <Reanimated.View
        style={[{ position: 'absolute', top: '15%', flexDirection: 'row', gap: PHOTO_GAP }, style1]}>
        {strip.map((url, i) => (
          <FastImage
            key={i}
            source={{ uri: url, priority: FastImage.priority.normal }}
            style={{ width: PHOTO_SIZE_1, height: PHOTO_SIZE_1, borderRadius: 12, opacity: 0.45 }}
            resizeMode={FastImage.resizeMode.cover}
          />
        ))}
      </Reanimated.View>

      {/* Row 2 — scrolls right */}
      <Reanimated.View
        style={[{ position: 'absolute', top: '55%', flexDirection: 'row', gap: PHOTO_GAP }, style2]}>
        {strip.map((url, i) => (
          <FastImage
            key={i}
            source={{ uri: url, priority: FastImage.priority.normal }}
            style={{ width: PHOTO_SIZE_2, height: PHOTO_SIZE_2, borderRadius: 12, opacity: 0.35 }}
            resizeMode={FastImage.resizeMode.cover}
          />
        ))}
      </Reanimated.View>

      {/* Gradient overlay for readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.30)', 'transparent', 'rgba(0,0,0,0.40)']}
        locations={[0, 0.5, 1]}
        className="absolute inset-0"
        pointerEvents="none"
      />
    </View>
  );
}

// ── SlideContent ──────────────────────────────────────────────────────────────

function SlideContent({ slide, month }: { slide: SlideData; month: string }) {
  const isIntro = slide.type === 'intro';
  const isOutro = slide.type === 'outro';

  if (isIntro || isOutro) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Reanimated.Text
          entering={ZoomIn.springify().stiffness(200).damping(15)}
          style={{ fontSize: 80, marginBottom: 24, textAlign: 'center' }}>
          {slide.emoji}
        </Reanimated.Text>
        <Reanimated.Text
          entering={FadeIn.delay(250).duration(500)}
          style={{
            fontSize: 28,
            fontWeight: '800',
            color: '#fff',
            marginBottom: 8,
            textAlign: 'center',
          }}>
          {isIntro ? formatMonthDisplay(month) : t.monthlyRecap.slideOutroTitle}
        </Reanimated.Text>
        <Reanimated.Text
          entering={FadeIn.delay(400).duration(500)}
          style={{ fontSize: 16, color: 'rgba(255,255,255,0.80)', textAlign: 'center', lineHeight: 24 }}>
          {isIntro
            ? (slide.caption ?? t.monthlyRecap.yourMonthTogether)
            : (slide.caption ?? t.monthlyRecap.slideOutroSubtitle)}
        </Reanimated.Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Photo strip behind content */}
      {slide.photos && slide.photos.length > 0 ? (
        <PhotoStrip photos={slide.photos} />
      ) : null}

      {/* Centered stats */}
      <View className="flex-1 items-center justify-center px-8">
        <Reanimated.Text
          entering={FadeIn.delay(50).duration(400)}
          style={{ fontSize: 64, marginBottom: 12, textAlign: 'center' }}>
          {slide.emoji}
        </Reanimated.Text>

        <Reanimated.Text
          entering={FadeIn.delay(100).duration(450)}
          style={{ fontSize: 72, fontWeight: '900', color: '#fff', lineHeight: 76, textAlign: 'center' }}>
          {slide.bigNumber !== undefined ? <AnimatedNumber value={slide.bigNumber} /> : null}
        </Reanimated.Text>

        <Reanimated.Text
          entering={FadeIn.delay(150).duration(450)}
          style={{ fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 4, textAlign: 'center' }}>
          {slide.bigLabel}
        </Reanimated.Text>

        {slide.subLine ? (
          <Reanimated.Text
            entering={FadeIn.delay(220).duration(400)}
            style={{ fontSize: 15, color: 'rgba(255,255,255,0.70)', marginTop: 8, textAlign: 'center' }}>
            {slide.subLine}
          </Reanimated.Text>
        ) : null}

        {slide.caption ? (
          <Reanimated.Text
            entering={FadeIn.delay(300).duration(400)}
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 16,
              textAlign: 'center',
              fontStyle: 'italic',
            }}>
            {slide.caption}
          </Reanimated.Text>
        ) : null}
      </View>
    </View>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────

function ProgressBar({
  index,
  currentIdx,
  isPaused,
  animKey,
}: {
  index: number;
  currentIdx: number;
  isPaused: boolean;
  animKey: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (index !== currentIdx) {
      animation.current?.stop();
      progress.setValue(index < currentIdx ? 1 : 0);
      return;
    }
    progress.setValue(0);
    if (!isPaused) {
      animation.current = Animated.timing(progress, {
        toValue: 1,
        duration: SLIDE_DURATION,
        useNativeDriver: false,
      });
      animation.current.start();
    } else {
      animation.current?.stop();
    }
    return () => animation.current?.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, currentIdx, isPaused, animKey]);

  return (
    <View
      className="flex-1 rounded-full overflow-hidden"
      style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.30)' }}>
      <Animated.View
        style={{
          height: '100%',
          backgroundColor: '#fff',
          borderRadius: 999,
          width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MonthlyRecapScreen({ route }: { route?: { params?: { month?: string } } }) {
  const insets = useSafeAreaInsets();
  const initialMonth = route?.params?.month;
  const vm = useMonthlyRecapViewModel(initialMonth);

  // Slide key used to reset progress bar animation on slide change
  const [animKey, setAnimKey] = useState(0);
  const prevIdx = useRef(vm.currentIdx);

  useEffect(() => {
    if (vm.currentIdx !== prevIdx.current) {
      setAnimKey(k => k + 1);
      prevIdx.current = vm.currentIdx;
    }
  }, [vm.currentIdx]);

  // Auto-advance: driven by ProgressBar animation completion
  const advanceRef = useRef(vm.advance);
  advanceRef.current = vm.advance;

  useEffect(() => {
    if (vm.isPaused || vm.slides.length === 0 || vm.currentIdx >= vm.slides.length - 1) return;
    const timer = setTimeout(() => advanceRef.current(), SLIDE_DURATION);
    return () => clearTimeout(timer);
  }, [vm.currentIdx, vm.isPaused, vm.slides.length, animKey]);

  // Hold-to-pause touch handling
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldRef = useRef(false);

  const onPressIn = () => {
    isHoldRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      isHoldRef.current = true;
      vm.setIsPaused(true);
    }, HOLD_THRESHOLD);
  };

  const onPressOut = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    vm.setIsPaused(false);
  };

  const handleTapLeft = () => {
    if (!isHoldRef.current) vm.retreat();
  };
  const handleTapRight = () => {
    if (!isHoldRef.current) vm.advance();
  };

  const slide = vm.slides[vm.currentIdx];

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* ── Loading ── */}
      {vm.isLoading && (
        <LinearGradient
          colors={['#f9a8d4', '#fb7185', '#f97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
      )}

      {/* ── Empty ── */}
      {!vm.isLoading && vm.isEmpty && (
        <LinearGradient
          colors={['#9ca3af', '#6b7280', '#4b5563']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0 items-center justify-center px-8">
          <Pressable
            onPress={vm.close}
            className="absolute top-0 right-4 w-10 h-10 items-center justify-center"
            style={{ top: insets.top + 8 }}>
            <X size={22} strokeWidth={1.5} />
          </Pressable>
          <Text style={{ fontSize: 72, marginBottom: 16 }}>💤</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' }}>
            {t.monthlyRecap.emptyTitle}
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)', textAlign: 'center' }}>
            {t.monthlyRecap.emptySubtitle}
          </Text>
        </LinearGradient>
      )}

      {/* ── Stories viewer ── */}
      {!vm.isLoading && !vm.isEmpty && slide && (
        <>
          {/* Background gradient — cross-fades via key change */}
          <Reanimated.View
            key={`bg-${slide.id}`}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            className="absolute inset-0">
            <LinearGradient
              colors={slide.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              className="flex-1"
            />
          </Reanimated.View>

          {/* ── Progress bars ── */}
          <View
            className="absolute left-0 right-0 z-10 flex-row gap-1.5 px-4"
            style={{ top: insets.top + 8 }}>
            {vm.slides.map((s, i) => (
              <ProgressBar
                key={s.id}
                index={i}
                currentIdx={vm.currentIdx}
                isPaused={vm.isPaused}
                animKey={animKey}
              />
            ))}
          </View>

          {/* ── Top bar: month + close + nav ── */}
          <View
            className="absolute left-0 right-0 z-10 flex-row items-center justify-between px-4"
            style={{ top: insets.top + 18 }}>
            {/* Month navigation */}
            <View className="flex-row items-center gap-2">
              <Pressable onPress={vm.goToPrevMonth} hitSlop={12}>
                <ChevronLeft size={18} strokeWidth={1.5} />
              </Pressable>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>
                {formatMonthDisplay(vm.month)}
              </Text>
              {vm.canGoNext ? (
                <Pressable onPress={vm.goToNextMonth} hitSlop={12}>
                  <ChevronRight size={18} strokeWidth={1.5} />
                </Pressable>
              ) : (
                <View style={{ width: 18 }} />
              )}
            </View>

            {/* Close */}
            <Pressable onPress={vm.close} hitSlop={12} className="w-8 h-8 items-center justify-center">
              <X size={20} strokeWidth={1.5} />
            </Pressable>
          </View>

          {/* ── Slide content ── */}
          <Reanimated.View
            key={`slide-${slide.id}`}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            className="absolute inset-0 z-[1]"
            style={{ paddingTop: insets.top + 64 }}>
            <SlideContent slide={slide} month={vm.month} />
          </Reanimated.View>

          {/* ── Tap zones (35% left / 65% right) — ABOVE slide content ── */}
          <View
            className="absolute left-0 right-0 bottom-0 z-[2] flex-row"
            style={{ top: insets.top + 64 }}>
            <Pressable
              className="h-full"
              style={{ width: SCREEN_W * 0.35 }}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={handleTapLeft}
            />
            <Pressable
              className="h-full"
              style={{ width: SCREEN_W * 0.65 }}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={handleTapRight}
            />
          </View>
        </>
      )}
    </View>
  );
}
