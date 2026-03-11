/**
 * Confetti Animation
 * Celebratory particle burst for achievements, milestones, and special moments
 * Multi-colored particles from gradient palette
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface ConfettiProps {
  onComplete?: () => void;
  particleCount?: number;
}

const COLORS = [
  '#FF6B6B', // Coral
  '#FFD93D', // Peachy Gold
  '#C7CEEA', // Lavender
  '#A8E6CF', // Mint
  '#B983FF', // Violet
  '#FFB4B4', // Rose
];

function ConfettiParticle({
  delay,
  color,
  angle,
  distance,
}: {
  delay: number;
  color: string;
  angle: number;
  distance: number;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const radians = (angle * Math.PI) / 180;
    const targetX = Math.cos(radians) * distance;
    const targetY = Math.sin(radians) * distance;

    // Burst outward with easeOut
    translateX.value = withDelay(
      delay,
      withTiming(targetX, { duration: 500, easing: Easing.out(Easing.ease) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(targetY, { duration: 500, easing: Easing.out(Easing.ease) })
    );

    // Fade out
    opacity.value = withDelay(
      delay + 200,
      withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) })
    );

    // Rotate
    rotate.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );

    // Slight scale down
    scale.value = withDelay(
      delay,
      withTiming(0.5, { duration: 500, easing: Easing.out(Easing.ease) })
    );
  }, [delay, angle, distance]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Confetti component
 * Bursts particles radially from center
 * Auto-removes after animation completes
 */
export function Confetti({ onComplete, particleCount = 30 }: ConfettiProps) {
  useEffect(() => {
    // Call onComplete after animation finishes
    const timer = setTimeout(() => {
      onComplete?.();
    }, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (360 / particleCount) * i + (Math.random() * 20 - 10); // Evenly distributed with slight randomness
    const distance = 60 + Math.random() * 40; // Random distance 60-100px
    const delay = Math.random() * 100; // Slight stagger
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    return {
      id: i,
      angle,
      distance,
      delay,
      color,
    };
  });

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
      pointerEvents="none">
      {particles.map(particle => (
        <ConfettiParticle
          key={particle.id}
          angle={particle.angle}
          distance={particle.distance}
          delay={particle.delay}
          color={particle.color}
        />
      ))}
    </View>
  );
}

/**
 * Hook to trigger confetti programmatically
 * Usage:
 *   const { showConfetti, ConfettiComponent } = useConfetti();
 *   // ... later
 *   showConfetti();
 *   // Render: {ConfettiComponent}
 */
export function useConfetti() {
  const [isVisible, setIsVisible] = React.useState(false);

  const showConfetti = React.useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleComplete = React.useCallback(() => {
    setIsVisible(false);
  }, []);

  const ConfettiComponent = isVisible ? (
    <Confetti onComplete={handleComplete} />
  ) : null;

  return { showConfetti, ConfettiComponent };
}
