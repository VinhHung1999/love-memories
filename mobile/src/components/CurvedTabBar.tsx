/**
 * CurvedTabBar — custom bottom tab bar with SVG notch at center top.
 * The camera button floats above the notch, perfectly seated in the concave curve.
 *
 * Layout:
 *   - SVG background: fills from notch top to safe-area bottom
 *   - 4 regular tab items (2 left, 2 right of the empty camera slot)
 *   - CameraFloatButton: absolutely positioned, center-top of bar, overflows above
 */
import React, { useEffect } from 'react';
import { Dimensions, Platform, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CircleUser, Heart, Home, Mail, Camera } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { launchCamera } from 'react-native-image-picker';
import CreateMomentSheet from '../screens/CreateMoment/CreateMomentSheet';
import { Caption } from './Typography';

const { width: W } = Dimensions.get('window');

// ── Dimensions ────────────────────────────────────────────────────────────────

const TAB_H = 80;          // height of the visible tab items area
const CAMERA_SIZE = 64;    // diameter of floating camera button
// Notch geometry — tuned to fully seat the 64px camera button
const NOTCH_W = 56;        // horizontal half-width of notch (full = 112px, button + 24px each side)
const NOTCH_D = 36;        // notch floor depth from top edge
const NOTCH_BOTTOM = NOTCH_D + 8; // actual lowest point of curve (44px)
const CURVE_T = 16;        // horizontal extent of bezier transition shoulder

const cx = W / 2; // center x = notch center

// ── Colors ────────────────────────────────────────────────────────────────────

const ACTIVE_COLOR = '#E8788A';
const INACTIVE_COLOR = '#A898AD';
const BAR_FILL = '#FFFAFA';

// ── SVG Path Builder ─────────────────────────────────────────────────────────
// Draws the tab bar shape: flat top edge with deep concave notch at center,
// rectangular bottom. Uses cubic bezier curves for a smooth, natural shape
// that fully seats the 64px floating camera button.
// Height is dynamic to include safe area padding.

function buildNotchPath(height: number): string {
  const L = cx - NOTCH_W;
  const R = cx + NOTCH_W;
  return [
    'M0,0',
    // Flat left side up to notch shoulder
    `L${L - CURVE_T},0`,
    // Cubic bezier — left shoulder curving down into notch floor
    `C${L - CURVE_T},0 ${L},0 ${L},${NOTCH_D}`,
    // Cubic bezier — notch floor curves down to the deepest point at center
    `C${L},${NOTCH_D} ${cx},${NOTCH_BOTTOM} ${cx},${NOTCH_BOTTOM}`,
    // Cubic bezier — deepest point back up to right notch floor
    `C${cx},${NOTCH_BOTTOM} ${R},${NOTCH_D} ${R},${NOTCH_D}`,
    // Cubic bezier — right notch floor curves back up to flat
    `C${R},0 ${R + CURVE_T},0 ${R + CURVE_T},0`,
    // Flat right side
    `L${W},0 L${W},${height} L0,${height} Z`,
  ].join(' ');
}

// ── Tab Config ────────────────────────────────────────────────────────────────

const TABS = [
  { name: 'Dashboard',  label: 'Home',    Icon: Home },
  { name: 'MomentsTab', label: 'Moments', Icon: Heart },
  { name: 'CameraTab',  label: '',        Icon: null },   // spacer slot
  { name: 'LettersTab', label: 'Letters', Icon: Mail },
  { name: 'ProfileTab', label: 'Profile', Icon: CircleUser },
] as const;

// ── Floating Camera Button ────────────────────────────────────────────────────

function CameraFloatButton() {
  const navigation = useNavigation<any>();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0,  { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0,  { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    const result = await launchCamera({ mediaType: 'photo', saveToPhotos: false });
    if (result.didCancel || !result.assets?.[0]) return;
    const photo = result.assets[0];
    navigation.navigate('MomentsTab', {
      screen: 'BottomSheet',
      params: {
        screen: CreateMomentSheet,
        props: { initialPhoto: { uri: photo.uri!, mimeType: photo.type ?? 'image/jpeg' } },
      },
    });
  };

  // Position button so its center aligns with the notch top edge (y=0).
  // Button top = -CAMERA_SIZE/2 = -32, button bottom = +32.
  // With NOTCH_BOTTOM = 44, bottom of button stays 12px above notch floor —
  // perfectly seated in the curve with notch edges visible on both sides.
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -(CAMERA_SIZE / 2),
          left: (W - CAMERA_SIZE) / 2,
          width: CAMERA_SIZE,
          height: CAMERA_SIZE,
          borderRadius: CAMERA_SIZE / 2,
          zIndex: 10,
          shadowColor: '#E8788A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 14,
          elevation: 10,
        },
        animStyle,
      ]}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          width: CAMERA_SIZE,
          height: CAMERA_SIZE,
          borderRadius: CAMERA_SIZE / 2,
          overflow: 'hidden',
          opacity: pressed ? 0.88 : 1,
        })}>
        <LinearGradient
          colors={['#F4A0B0', '#E8788A']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {/* Explicit center wrapper guarantees icon pixel-perfect center */}
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={28} color="#FFFFFF" strokeWidth={1.8} />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CurvedTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  const totalHeight = TAB_H + bottomPad;
  const svgPath = buildNotchPath(totalHeight);

  return (
    <View
      style={{
        width: W,
        height: totalHeight,
        overflow: 'visible',
        // iOS shadow on the bar panel — avoid elevation here so overflow visible works on Android
        ...Platform.select({
          ios: {
            shadowColor: '#4A2040',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.07,
            shadowRadius: 12,
          },
        }),
      }}>

      {/* ── SVG background with notch ── */}
      <Svg
        width={W}
        height={totalHeight}
        style={{ position: 'absolute', top: 0, left: 0 }}>
        <Path d={svgPath} fill={BAR_FILL} />
      </Svg>

      {/* Android elevation workaround — separate layer that can have elevation */}
      {Platform.OS === 'android' && (
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: W, height: totalHeight,
            elevation: 8,
            backgroundColor: 'transparent',
          }}
        />
      )}

      {/* ── Tab items row ── */}
      <View
        style={{
          flexDirection: 'row',
          height: TAB_H,
          alignItems: 'center',
        }}>
        {TABS.map((tab, index) => {
          const route = state.routes[index];
          if (!route) return null;

          const isFocused = state.index === index;

          // Camera slot — empty spacer (floating button renders above)
          if (tab.Icon === null) {
            return <View key={tab.name} style={{ flex: 1 }} />;
          }

          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
          const Icon = tab.Icon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              // Navigate to root screen of each stack tab
              if (route.name === 'MomentsTab') {
                navigation.navigate('MomentsTab', { screen: 'MomentsList' } as any);
              } else if (route.name === 'LettersTab') {
                navigation.navigate('LettersTab', { screen: 'LettersList' } as any);
              } else if (route.name === 'ProfileTab') {
                navigation.navigate('ProfileTab', { screen: 'ProfileMain' } as any);
              } else {
                navigation.navigate(route.name);
              }
            }
          };

          return (
            <Pressable
              key={tab.name}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: NOTCH_D - 4,  // push items below the notch curve
                gap: 3,
              }}>
              <Icon
                size={22}
                color={color}
                strokeWidth={isFocused ? 2 : 1.6}
              />
              <Caption
                style={{
                  color,
                  fontSize: 10,
                  lineHeight: 12,
                  fontWeight: isFocused ? '600' : '400',
                }}>
                {tab.label}
              </Caption>
            </Pressable>
          );
        })}
      </View>

      {/* Bottom safe area fill */}
      {bottomPad > 0 && (
        <View style={{ height: bottomPad, backgroundColor: BAR_FILL }} />
      )}

      {/* ── Floating camera button — overflows above container ── */}
      <CameraFloatButton />

    </View>
  );
}
