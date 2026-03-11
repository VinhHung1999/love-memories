/**
 * Floating Hearts Animation
 * Subtle decorative hearts that float vertically in the background
 * Used in headers and gradient backgrounds for playful warmth
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface FloatingHeartsProps {
  count?: number;
  color?: string;
  size?: number;
  opacity?: number;
}

function FloatingHeart({
  delay = 0,
  x = 0,
  color = '#FF6B6B',
  size = 14,
  opacity = 0.15,
}: {
  delay?: number;
  x: number;
  color: string;
  size: number;
  opacity: number;
}) {
  const translateY = useSharedValue(0);
  const heartOpacity = useSharedValue(opacity);

  useEffect(() => {
    // Vertical float animation: 0 → -10px over 3s, repeat
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-10, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true // reverse
      )
    );

    // Opacity pulse: opacity → opacity*0.6 → opacity over 3s
    heartOpacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(opacity * 0.6, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: heartOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${x}%`,
          top: '50%',
        },
        animatedStyle,
      ]}>
      <Icon name="heart" size={size} color={color} />
    </Animated.View>
  );
}

/**
 * FloatingHearts component
 * Renders multiple hearts scattered across the background
 * Each heart has slightly different delay and position for organic feel
 */
export function FloatingHearts({
  count = 8,
  color = '#FF6B6B',
  size = 14,
  opacity = 0.15,
}: FloatingHeartsProps) {
  // Generate random positions and delays for natural scatter
  const hearts = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 5 + (i * (90 / count)) + (Math.random() * 10 - 5), // Scattered across width with some randomness
    delay: i * 300, // Stagger start times
    size: size + (Math.random() * 4 - 2), // Slight size variation
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {hearts.map(heart => (
        <FloatingHeart
          key={heart.id}
          x={heart.x}
          delay={heart.delay}
          color={color}
          size={heart.size}
          opacity={opacity}
        />
      ))}
    </View>
  );
}
