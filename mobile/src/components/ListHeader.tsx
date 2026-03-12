import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAppColors } from '../navigation/theme';

interface ListHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  filterBar?: React.ReactNode;
  /** Optional scrollY SharedValue — fades header from transparent (0) to opaque (1) over first 50px */
  scrollY?: SharedValue<number>;
}

export default function ListHeader({ title, subtitle, onBack, right, filterBar, scrollY }: ListHeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();

  // Opacity: 0→1 over first 50px of scroll (linear, scroll-coupled per design spec)
  // When no scrollY passed: always fully opaque (opacity: 1)
  const bgStyle = useAnimatedStyle(() => {
    const opacity = scrollY
      ? Math.min(Math.max(scrollY.value / 50, 0), 1)
      : 1;
    return {
      opacity,
      backgroundColor: '#FFFFFF',
    };
  });

  return (
    <Animated.View
      style={[
        bgStyle,
        {
          borderBottomWidth: 1,
          borderBottomColor: '#F0E6E3',
          shadowColor: '#E8788A',
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: 1 },
          shadowRadius: 4,
          elevation: 2,
        },
      ]}>
      {/* Title row */}
      <View style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-4 gap-3" style={{ height: 56 }}>
          {onBack && (
            <Pressable
              onPress={onBack}
              className="items-center justify-center rounded-xl"
              style={{ width: 36, height: 36, backgroundColor: colors.textDark + '10' }}>
              <ArrowLeft size={20} color={colors.textDark} strokeWidth={1.5} />
            </Pressable>
          )}
          <View className="flex-1">
            <Text className="font-bold text-textDark" style={{ fontSize: 18 }} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text className="text-textMid font-medium" style={{ fontSize: 12 }} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {right ? <View>{right}</View> : null}
        </View>
      </View>

      {/* Filter bar */}
      {filterBar ?? null}
    </Animated.View>
  );
}
