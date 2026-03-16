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

  // Header bg fades from transparent → white over fadeStart→fadeEnd (linear, scroll-coupled)
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
