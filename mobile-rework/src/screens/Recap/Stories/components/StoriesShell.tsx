// Sprint 67 T459 — Stories shell. Wraps slide content with:
//   • Top progress bars (1 per slide, active fills 0..1)
//   • Tap zones: left 35% → previous, right 65% → next
//   • Hold (>200ms) → pause; release → resume + treat the prior touch
//     as a hold (don't fire advance/back). Sub-200ms touches fire the
//     zone action.
//   • Swipe-down-to-close (Reanimated v4 PanGesture, threshold = 120px
//     translate OR 800 velocity). Body translates with finger; springs
//     back if not enough.
//   • Top-right floating close pill (always tappable, takes priority
//     over the right-zone advance via z-index + pointer events).
//
// Lives behind a fullScreenModal route so it covers status bar.

import { X } from 'lucide-react-native';
import { useCallback, useRef } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HOLD_THRESHOLD_MS, type StoriesController } from '../useStoriesController';
import { StoriesProgressBars } from './StoriesProgressBars';

type Props = {
  controller: StoriesController;
  onClose: () => void;
  closeAccessibilityLabel: string;
  children: React.ReactNode;
};

export function StoriesShell({
  controller,
  onClose,
  closeAccessibilityLabel,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasHoldRef = useRef(false);

  // Swipe-down dismissal — translate body with finger, dismiss past
  // threshold or velocity, otherwise spring back.
  const translateY = useSharedValue(0);

  const closeViaJS = useCallback(() => {
    onClose();
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        runOnJS(closeViaJS)();
      } else {
        translateY.value = withSpring(0, { damping: 18 });
      }
    });

  const animBody = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Tap zone press handlers — onPressIn schedules a 200ms timer; if it
  // fires we flag wasHold + pause. onPressOut clears the timer; if hold
  // was active we resume + don't fire the zone tap; otherwise we fire
  // the zone tap (next/prev).
  const handlePressIn = useCallback(() => {
    wasHoldRef.current = false;
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      wasHoldRef.current = true;
      controller.pause();
    }, HOLD_THRESHOLD_MS);
  }, [controller]);

  const handlePressOut = useCallback(
    (action: () => void) => () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      if (wasHoldRef.current) {
        controller.resume();
      } else {
        action();
      }
      wasHoldRef.current = false;
    },
    [controller],
  );

  // Suppress the Pressable's bubbled gesture so PanGesture wins on
  // significant vertical drags (activeOffsetY=12 above keeps small
  // jitters with the tap detection).
  const swallow = (_e: GestureResponderEvent) => {};

  return (
    <View className="flex-1 bg-black">
      <GestureDetector gesture={panGesture}>
        <Animated.View className="flex-1" style={animBody}>
          {/* Slide canvas */}
          <View className="flex-1">{children}</View>

          {/* Tap zones overlay (above slide content, below progress bars
              + close button). pointerEvents='box-only' so the gesture
              detector still wins for vertical drags above this layer. */}
          <View className="absolute inset-0 flex-row" pointerEvents="box-none">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous"
              onPressIn={handlePressIn}
              onPressOut={handlePressOut(controller.prev)}
              onTouchMove={swallow}
              style={{ flex: 35 }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next"
              onPressIn={handlePressIn}
              onPressOut={handlePressOut(controller.next)}
              onTouchMove={swallow}
              style={{ flex: 65 }}
            />
          </View>

          {/* Top chrome */}
          <View
            className="absolute left-0 right-0 z-50"
            style={{ top: insets.top }}
            pointerEvents="box-none"
          >
            <StoriesProgressBars
              total={controller.total}
              index={controller.index}
              progress={controller.progress}
            />
            <View
              className="mt-3 flex-row justify-end px-3"
              pointerEvents="box-none"
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={closeAccessibilityLabel}
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-full bg-black/40 active:opacity-70"
              >
                <X size={18} color="#FFFFFF" strokeWidth={2.4} />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
