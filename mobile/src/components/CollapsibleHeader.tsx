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

  // Outer container clips content via overflow-hidden.
  // LinearGradient is NOT inside here — it sits on a fixed-size inner View
  // so it never resizes → no per-frame re-draw.
  const containerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, scrollRange],
      [totalExpandedHeight, collapsedHeight + insets.top],
      Extrapolation.CLAMP,
    ),
  }));

  // Subtitle + renderExpandedContent: fade + collapse as user scrolls
  // Exception: animated opacity + maxHeight — both are Animated.Value outputs
  const expandedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, scrollRange * 0.7], [1, 0], Extrapolation.CLAMP),
    maxHeight: interpolate(scrollY.value, [0, scrollRange], [200, 0], Extrapolation.CLAMP),
    overflow: 'hidden',
  }));

  // Title crossfade: large fades out, small fades in.
  // Avoids animating fontSize (which forces JS-thread text layout on every frame).
  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, scrollRange * 0.5], [1, 0], Extrapolation.CLAMP),
  }));
  const smallTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [scrollRange * 0.4, scrollRange], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={containerStyle} className="overflow-hidden">

      {/* Fixed-height inner View: LinearGradient absolute inside here so it
          never resizes with the animated container → zero per-frame re-draw. */}
      <View style={{ height: totalExpandedHeight }}>

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
                  Small title is absolute so it occupies no extra layout space. */}
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
      </View>

    </Animated.View>
  );
}
