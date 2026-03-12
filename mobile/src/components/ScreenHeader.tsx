import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAppColors } from '../navigation/theme';
import HeaderIcon from './HeaderIcon';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Optional scrollY SharedValue — fades header from transparent (0) to opaque (1) over first 50px */
  scrollY: SharedValue<number>;
  /** Scroll position where fade begins (default 80) */
  fadeStart?: number;
  /** Scroll position where header is fully opaque (default 200) */
  fadeEnd?: number;
}

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  scrollY,
  fadeStart = 80,
  fadeEnd = 200,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();

  // Opacity: 0→1 over first 50px of scroll. When no scrollY → always opaque.
  const bgStyle = useAnimatedStyle(() => {
    const progress = Math.min(
      Math.max((scrollY.value - fadeStart) / (fadeEnd - fadeStart), 0),
      1,
    );
    return {
      backgroundColor: `rgba(255,255,255,${progress})`,
      borderBottomWidth: progress > 0.1 ? 1 : 0,
      borderBottomColor: '#F0E6E3',
    };
  });

  return (
    <Animated.View
      style={[
        bgStyle,
      ]}
    >
      <View style={{ paddingTop: insets.top }}>
        <View
          className="flex-row items-center px-4 gap-3"
          style={{ height: 56 }}
        >
          {onBack && (
            <HeaderIcon icon={ArrowLeft} onPress={onBack} />
          )}
          <View className="flex-1">
            <Text
              className="font-bold text-textDark"
              style={{ fontSize: 18, color: colors.text }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                className="text-textMid font-medium"
                style={{ fontSize: 12 }}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
          {right ? <View>{right}</View> : null}
        </View>
      </View>
    </Animated.View>
  );
}
