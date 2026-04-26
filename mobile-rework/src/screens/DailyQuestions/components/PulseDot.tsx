import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// Sprint 66 T427 — small reusable pulsing dot used in:
//   • Hero date badge (white dot inside accent pill)
//   • Partner-thinking card (3 stagger-animated muted dots)
//
// Per the Reanimated v4 worklet rule (mobile-rework rule), all colors are
// captured at component scope before the worklet runs.

type Props = {
  size?: number;
  color: string; // resolved hex/rgb at call site
  duration?: number;
  delay?: number;
};

export function PulseDot({ size = 6, color, duration = 1200, delay = 0 }: Props) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration }),
      -1,
      true,
    );
    // Stagger by delaying the SECOND tick — withDelay would also work but
    // pushes the start of the very first cycle, which doesn't match the
    // CSS `animation-delay` semantics we want.
    if (delay > 0) {
      opacity.value = withTiming(0.35, { duration: delay }, () => {
        opacity.value = withRepeat(
          withTiming(1, { duration }),
          -1,
          true,
        );
      });
    }
  }, [opacity, duration, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
