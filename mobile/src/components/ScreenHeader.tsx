import React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import HeaderIcon from './HeaderIcon';
import { Body, Heading } from './Typography';
import { useAppColors } from '../navigation/theme';

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
  // Capture outside worklet — hooks cannot be called inside useAnimatedStyle
  const baseBg = colors.baseBg;
  const borderSoft = colors.borderSoft;

  // Opacity: 0→1 over first 50px of scroll. When no scrollY → always opaque.
  const bgStyle = useAnimatedStyle(() => {
    const progress = Math.min(
      Math.max((scrollY.value - fadeStart) / (fadeEnd - fadeStart), 0),
      1,
    );
    return {
      backgroundColor: baseBg === '#121212'
        ? `rgba(18,18,18,${progress})`
        : `rgba(255,248,246,${progress})`,
      borderBottomWidth: progress > 0.1 ? 1 : 0,
      borderBottomColor: borderSoft,
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
            <Heading size="md" className="text-textDark dark:text-darkTextDark" numberOfLines={1}>
              {title}
            </Heading>
            {subtitle ? (
              <Body
                size="sm"
                className="text-textMid dark:text-darkTextMid font-medium"
                numberOfLines={1}
              >
                {subtitle}
              </Body>
            ) : null}
          </View>
          {right ? <View>{right}</View> : null}
        </View>
      </View>
    </Animated.View>
  );
}
