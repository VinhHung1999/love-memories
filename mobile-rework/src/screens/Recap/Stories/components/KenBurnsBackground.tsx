// Sprint 67 T459 — Slow scale animation on a full-bleed background
// image. Applied to slides whose `bgPhotoUrl` is set. Reanimated v4
// withRepeat oscillates scale 1.0 → 1.08 → 1.0 over 8s; combined with
// the 6s slide auto-advance the user always sees a different framing
// when transitioning forward.
//
// Useful gotcha (memory `bugs_lineargradient_padding`): we wrap the
// image in a clipping View so the scaled image doesn't bleed past the
// slide bounds. The dim gradient sits ABOVE the image so text stays
// readable regardless of photo tone.

import { useEffect } from 'react';
import { Image, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  uri: string;
  dim?: number; // 0..1, default 0.35
};

export function KenBurnsBackground({ uri, dim = 0.35 }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.08, { duration: 8000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="absolute inset-0 overflow-hidden">
      <Animated.View className="absolute inset-0" style={animStyle}>
        <Image
          source={{ uri }}
          resizeMode="cover"
          className="h-full w-full"
        />
      </Animated.View>
      <LinearGradient
        colors={['rgba(0,0,0,0)', `rgba(0,0,0,${dim})`, `rgba(0,0,0,${Math.min(1, dim + 0.25)})`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
    </View>
  );
}
