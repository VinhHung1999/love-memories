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
  /** Replaces the default pink gradient — renders absolutely, fills entire header */
  renderBackground?: () => React.ReactNode;
  renderLeft?: () => React.ReactNode;
  renderRight?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  /** White title + subtitle text (for dark photo backgrounds) */
  dark?: boolean;
  scrollY: SharedValue<number>;
}

export default function CollapsibleHeader({
  title,
  subtitle,
  expandedHeight = 120,
  collapsedHeight = 56,
  renderExpandedContent,
  renderBackground,
  renderLeft,
  renderRight,
  dark = false,
  scrollY,
  renderFooter,
}: CollapsibleHeaderProps) {
  const insets = useSafeAreaInsets();
  const scrollRange = expandedHeight - collapsedHeight;

  // ── Animated styles ─────────────────────────────────────────────────────────

  // Visual header slides up via translateY — pure GPU, zero layout cost.
  // Outer spacer is STATIC so ScrollView frame never moves → no contentOffset conflict.
  // Exception: Animated transform — cannot be expressed as className.
  const innerTranslateStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(
        scrollY.value,
        [0, scrollRange],
        [0, -scrollRange],
        Extrapolation.CLAMP,
      ),
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
      {/* Static spacer — NEVER changes height, so siblings (filter bar, ScrollView)
          never shift position. Eliminates the contentOffset.y conflict entirely. */}
      {/* Exception: height from insets — device-specific runtime value */}
      <View style={{ height: collapsedHeight + insets.top }} />

      {/* Visual header — position:absolute, translateY only (no layout impact).
          LinearGradient is absolute inset-0: fixed size, never re-draws. */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: expandedHeight + insets.top,
            overflow: 'hidden',
            zIndex: 10,
          },
          innerTranslateStyle,
        ]}>

        {renderBackground ? (
          <View className="absolute inset-0">{renderBackground()}</View>
        ) : (
          <LinearGradient
            colors={['#FFE4EA', '#FFF0F6', '#FFF5EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}

        {/* Exception: paddingTop from useSafeAreaInsets() — device-specific runtime value */}
        <View style={{ paddingTop: insets.top }} className="flex-1 px-5 pb-3 justify-end">
          {renderExpandedContent ? (
            <Animated.View style={expandedStyle} className="mb-1">
              {renderExpandedContent()}
            </Animated.View>
          ) : null}

          <View className="flex-row items-end justify-between">
            {renderLeft ? <View className="mr-3">{renderLeft()}</View> : null}
            <View className="flex-1">
              {subtitle ? (
                <Animated.View style={expandedStyle}>
                  <Text className={`text-[11px] font-semibold tracking-[1.5px] uppercase mb-0.5 ${dark ? 'text-white/80' : 'text-primary'}`}>
                    {subtitle}
                  </Text>
                </Animated.View>
              ) : null}
              <Animated.Text
                className={`font-bold tracking-tight ${dark ? 'text-white' : 'text-textDark'}`}
                style={titleStyle}
                numberOfLines={1}>
                {title}
              </Animated.Text>
            </View>
            {renderRight ? <View className="ml-3">{renderRight()}</View> : null}
          </View>
        </View>
        {renderFooter?.()}
      </Animated.View>
      
    </>
  );
}
