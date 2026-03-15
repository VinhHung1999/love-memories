/**
 * CurvedTabBar — custom bottom tab bar with SVG elliptical-arc notch.
 *
 * Layout:
 *   Root View: position absolute, bottom 0, height = TAB_H + 32 (overflow for camera)
 *   SVG background: fills TAB_H at bottom, arc notch cut at center top
 *   Tab items row: 2 left + spacer + 2 right, positioned at bar bottom
 *   Camera float button: absolute center-top, zIndex 10, overflows above bar
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

const TAB_H      = 60;   // standard iOS tab bar height
const CAMERA_SIZE = 64;  // floating camera button diameter
const CUTOUT_R   = 36;   // arc radius — slightly larger than camera radius (32)

// Camera button overflows above the arc notch by (CAMERA_SIZE/2 - CUTOUT_R) + some clearance.
// Root container height = TAB_H + CAMERA_SIZE/2 so the button has room to render.
const CONTAINER_H = TAB_H + CAMERA_SIZE / 2;

// ── Colors ────────────────────────────────────────────────────────────────────

const ACTIVE_COLOR   = '#E8788A';
const INACTIVE_COLOR = '#A898AD';
const BAR_FILL       = '#FFFAFA';

// ── SVG Path Builder ──────────────────────────────────────────────────────────
// Flat top with a perfect semicircle notch at center.
// Arc command: A rx,ry x-rotation large-arc-flag sweep-flag x,y
//   sweep-flag=0 → counter-clockwise → arc curves UPWARD (concave notch).

function buildArcPath(barHeight: number): string {
  const x1 = W / 2 - CUTOUT_R;
  const x2 = W / 2 + CUTOUT_R;
  return [
    'M0,0',
    `L${x1},0`,
    // Semicircle arc — counter-clockwise so it bows upward into the notch
    `A${CUTOUT_R},${CUTOUT_R} 0 0 0 ${x2},0`,
    `L${W},0`,
    `L${W},${barHeight}`,
    `L0,${barHeight}`,
    'Z',
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

  return (
    <Animated.View
      style={[
        {
          width: CAMERA_SIZE,
          height: CAMERA_SIZE,
          borderRadius: CAMERA_SIZE / 2,
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
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
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
  const barHeight = TAB_H + bottomPad;
  const svgPath = buildArcPath(barHeight);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        width: W,
        // Container taller than bar so camera button can overflow upward
        height: CONTAINER_H + bottomPad,
        overflow: 'visible',
      }}>

      {/* ── SVG background with arc notch — sits at the bottom of container ── */}
      <Svg
        width={W}
        height={barHeight}
        style={{ position: 'absolute', bottom: 0, left: 0 }}>
        <Path d={svgPath} fill={BAR_FILL} />
      </Svg>

      {/* iOS shadow on bar panel */}
      {Platform.OS === 'ios' && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: W,
            height: barHeight,
            shadowColor: '#4A2040',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.07,
            shadowRadius: 12,
          }}
        />
      )}

      {/* Android elevation workaround */}
      {Platform.OS === 'android' && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: W,
            height: barHeight,
            elevation: 8,
            backgroundColor: 'transparent',
          }}
        />
      )}

      {/* ── Tab items row — absolute at bottom of container ── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: W,
          height: barHeight,
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingTop: 10,
        }}>
        {TABS.map((tab, index) => {
          const route = state.routes[index];
          if (!route) return null;

          // Camera spacer — floating button renders above
          if (tab.Icon === null) {
            return (
              <View
                key={tab.name}
                style={{ width: CUTOUT_R * 2 + 8 }}
              />
            );
          }

          const isFocused = state.index === index;
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
          const Icon = tab.Icon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
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
                gap: 3,
                paddingBottom: bottomPad,
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

      {/* ── Camera button — floats above arc notch, zIndex above SVG ── */}
      <View
        style={{
          position: 'absolute',
          // bottom = TAB_H - CAMERA_SIZE/2 so button center sits at the bar top edge
          // (half above bar = inside notch arc, half below = inside bar)
          bottom: TAB_H - CAMERA_SIZE / 2 + bottomPad,
          alignSelf: 'center',
          left: W / 2 - CAMERA_SIZE / 2,
          zIndex: 10,
        }}>
        <CameraFloatButton />
      </View>

    </View>
  );
}
