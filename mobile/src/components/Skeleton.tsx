import React, { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

// ── Base Skeleton ──────────────────────────────────────────────────────────────
// Shape + size via className (e.g. "w-full h-4 rounded-md", "w-12 h-12 rounded-full")
// The shimmer gradient sweeps left→right; container clips via overflow-hidden.
// ONLY style prop usage: Animated transform (required by Reanimated — cannot use className).

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  const { width } = useWindowDimensions();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(shimmer);
  }, [shimmer]);

  // Allowed style exception: Animated.Value transform (cannot be expressed as className)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-width, width]) }],
  }));

  return (
    <View className={`bg-[#EDE8F0] overflow-hidden ${className}`}>
      <Animated.View style={animatedStyle} className="absolute inset-0">
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          className="flex-1"
        />
      </Animated.View>
    </View>
  );
}
