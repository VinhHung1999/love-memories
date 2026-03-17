import React, { JSX } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { Body, Heading } from './Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react-native';
import HeaderIcon from './HeaderIcon';
import { useAppColors } from '../navigation/theme';

interface OverlayHeaderProps {
  onBack?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  scrollY: SharedValue<number>;
  title: string;
  subtitle?: string;
  /** Scroll position where fade begins (default 80) */
  fadeStart?: number;
  /** Scroll position where header is fully opaque (default 200) */
  fadeEnd?: number;
  right?: () => JSX.Element
}

export default function OverlayHeader({
  onBack,
  onEdit,
  onDelete,
  scrollY,
  title,
  subtitle,
  fadeStart = 80,
  fadeEnd = 200,
  right,
}: OverlayHeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();

  // Parse baseBg hex → RGB components outside worklet (worklets can't call hooks)
  const baseBgHex = colors.baseBg;
  const bgR = parseInt(baseBgHex.slice(1, 3), 16);
  const bgG = parseInt(baseBgHex.slice(3, 5), 16);
  const bgB = parseInt(baseBgHex.slice(5, 7), 16);
  const borderCol = colors.border;

  // Header bg fades from transparent → baseBg over fadeStart→fadeEnd (linear, scroll-coupled)
  const bgStyle = useAnimatedStyle(() => {
    const progress = Math.min(
      Math.max((scrollY.value - fadeStart) / (fadeEnd - fadeStart), 0),
      1,
    );
    return {
      backgroundColor: `rgba(${bgR},${bgG},${bgB},${progress})`,
      borderBottomWidth: progress > 0.1 ? 1 : 0,
      borderBottomColor: borderCol,
    };
  });

  const titleStyle = useAnimatedStyle(() => {
    const progress = Math.min(
      Math.max((scrollY.value - fadeStart) / (fadeEnd - fadeStart), 0),
      1,
    );
    return {
      opacity: progress,
    };
  });

  return (
    <Animated.View
      style={[
        bgStyle,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingTop: insets.top,
        },
      ]}
    >
      <View
        className="flex-row items-center justify-between px-4"
        style={{ height: 44 }}
      >
        {/* Back */}
        <HeaderIcon icon={ArrowLeft} onPress={onBack} />
        <Animated.View className="flex-1" style={[{ paddingLeft: 12 },titleStyle]}>
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
        </Animated.View>

        {/* Right actions */}
        <View className="flex-row gap-2">
          <HeaderIcon icon={Pencil} onPress={onEdit} />
          <HeaderIcon icon={Trash2} onPress={onDelete} />
          {right?.()}
        </View>
      </View>
    </Animated.View>
  );
}
