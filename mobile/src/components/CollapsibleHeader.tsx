import React from 'react';
import { View, Text } from 'react-native';
import Animated, {
  interpolate,
  Extrapolation,
  useAnimatedStyle,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CollapsibleHeaderProps {
  title: string;
  subtitle?: string;
  expandedHeight?: number;
  collapsedHeight?: number;
  renderExpandedContent?: () => React.ReactNode;
  renderRight?: () => React.ReactNode;
  scrollY: SharedValue<number>;
}

export default function CollapsibleHeader({
  title,
  subtitle,
  expandedHeight = 120,
  collapsedHeight = 56,
  renderExpandedContent,
  renderRight,
  scrollY,
}: CollapsibleHeaderProps) {
  const insets = useSafeAreaInsets();
  const scrollRange = expandedHeight - collapsedHeight;

  // Exception: useAnimatedStyle output — Animated transforms required
  const containerStyle = useAnimatedStyle(() => {
    return  ({
      height: interpolate(
        scrollY.value,
        [0, scrollRange],
        [200 + insets.top, 56 + insets.top],
        Extrapolation.CLAMP,
      ),
    })
  });

  // Exception: animated fontSize cannot be expressed as className
  const titleStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(scrollY.value, [0, scrollRange], [28, 18], Extrapolation.CLAMP),
  }));

  // Exception: animated opacity + maxHeight — both are Animated.Value outputs
  // maxHeight collapses layout space so collapsed header has no dead space
  const expandedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, scrollRange * 0.7], [1, 0], Extrapolation.CLAMP),
    maxHeight: interpolate(scrollY.value, [0, scrollRange], [200, 0], Extrapolation.CLAMP),
    overflow: 'hidden',
  }));

  return (
    <Animated.View 
    style={containerStyle}
     className="overflow-hidden">
      <LinearGradient
        colors={['#FFE4EA', '#FFF0F6', '#FFF5EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1">
        {/* Exception: paddingTop from useSafeAreaInsets() — device-specific runtime value */}
        <View style={{ paddingTop: insets.top }} className="flex-1 px-5 pb-3 justify-end">
          {renderExpandedContent ? (
            <Animated.View style={expandedStyle} className="mb-1">
              {renderExpandedContent()}
            </Animated.View>
          ) : null}

          <View className="flex-row items-end justify-between">
            <View className="flex-1">
              {subtitle ? (
                <Animated.View style={expandedStyle}>
                  <Text className="text-[11px] font-semibold text-primary tracking-[1.5px] uppercase mb-0.5">
                    {subtitle}
                  </Text>
                </Animated.View>
              ) : null}
              <Animated.Text
                className="font-bold text-textDark tracking-tight"
                style={titleStyle}
                numberOfLines={1}>
                {title}
              </Animated.Text>
            </View>
            {renderRight ? <View className="ml-3">{renderRight()}</View> : null}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
