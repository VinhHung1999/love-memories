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
  const totalExpandedHeight = expandedHeight + insets.top;

  // ── Animated styles ─────────────────────────────────────────────────────────

  // Outer container height is STATIC → zero layout recalculation on scroll.
  // Inner wrapper slides up via translateY (GPU-only, no layout pass).
  // Exception: Animated transform — cannot be expressed as className.
  const innerTranslateStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(scrollY.value, [0, scrollRange], [0, -scrollRange], Extrapolation.CLAMP),
    }],
  }));

  // Subtitle + renderExpandedContent: fade + collapse as user scrolls.
  // Exception: animated opacity + maxHeight — both are Animated.Value outputs.
  const expandedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, scrollRange * 0.7], [1, 0], Extrapolation.CLAMP),
    maxHeight: interpolate(scrollY.value, [0, scrollRange], [200, 0], Extrapolation.CLAMP),
    overflow: 'hidden',
  }));

  // Title crossfade: large fades out, small fades in.
  // Avoids animating fontSize which forces JS-thread text layout per frame.
  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, scrollRange * 0.5], [1, 0], Extrapolation.CLAMP),
  }));
  const smallTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [scrollRange * 0.4, scrollRange], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    // STATIC height — content below header never shifts → no layout recalc on scroll.
    // Exception: paddingTop via insets — device-specific runtime value.
    <View style={{ height: collapsedHeight + insets.top, overflow: 'hidden' }}>

      {/* Inner wrapper: absolute, full expanded height, slides up via translateY.
          LinearGradient is absolute inset-0 here — never resizes, zero re-draw. */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, height: totalExpandedHeight },
          innerTranslateStyle,
        ]}>

        <LinearGradient
          colors={['#FFE4EA', '#FFF0F6', '#FFF5EE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
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

              {/* Two static-font Text elements with opacity crossfade.
                  Small title is absolute so it takes no extra layout space. */}
              <View>
                <Animated.Text
                  className="font-bold text-[28px] text-textDark tracking-tight"
                  style={largeTitleStyle}
                  numberOfLines={1}>
                  {title}
                </Animated.Text>
                <Animated.Text
                  className="font-bold text-[18px] text-textDark tracking-tight"
                  style={[{ position: 'absolute', bottom: 0, left: 0, right: 0 }, smallTitleStyle]}
                  numberOfLines={1}>
                  {title}
                </Animated.Text>
              </View>

            </View>
            {renderRight ? <View className="ml-3">{renderRight()}</View> : null}
          </View>

        </View>
      </Animated.View>

    </View>
  );
}
