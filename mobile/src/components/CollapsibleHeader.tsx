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

  // ── Animated styles ─────────────────────────────────────────────────────────

  // Spacer: height animation drives layout so siblings (filter bar, ScrollView)
  // move correctly — but spacer has NO children so its layout recalc is trivial.
  const containerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, scrollRange],
      [expandedHeight + insets.top, collapsedHeight + insets.top],
      Extrapolation.CLAMP,
    ),
  }));

  // Visual header: position:absolute + translateY (pure GPU, zero layout cost).
  // As user scrolls, content slides upward out of view — same visual as shrinking height.
  // Exception: Animated transform — cannot be expressed as className.
  const innerTranslateStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(scrollY.value, [0, scrollRange], [0, -scrollRange], Extrapolation.CLAMP),
    }],
  }));

  // Exception: animated fontSize cannot be expressed as className
  const titleStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(scrollY.value, [0, scrollRange], [28, 18], Extrapolation.CLAMP),
  }));

  // Exception: animated opacity + maxHeight — both are Animated.Value outputs
  const expandedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, scrollRange * 0.7], [1, 0], Extrapolation.CLAMP),
    maxHeight: interpolate(scrollY.value, [0, scrollRange], [200, 0], Extrapolation.CLAMP),
    overflow: 'hidden',
  }));

  return (
    <>
      {/* Spacer — children-free, just pushes siblings down. Height recalc is cheap. */}
      <Animated.View style={containerStyle} />

      {/* Visual header — position:absolute so it has zero layout impact.
          translateY slides content upward; overflow:hidden clips it.
          LinearGradient is absolute inset-0: fixed size, never resizes, never re-draws. */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            // Exception: expandedHeight + insets.top — dynamic runtime value
            height: expandedHeight + insets.top,
            overflow: 'hidden',
            zIndex: 1,
          },
          innerTranslateStyle,
        ]}>

        <LinearGradient
          colors={['#FFE4EA', '#FFF0F6', '#FFF5EE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

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

      </Animated.View>
    </>
  );
}
