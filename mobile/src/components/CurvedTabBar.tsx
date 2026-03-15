/**
 * CurvedTabBar — custom bottom tab bar with SVG elliptical-arc notch.
 *
 * Layout (all within bounds — no negative positioning):
 *
 *   CONTAINER_H = TAB_H + CAMERA_SIZE = 60 + 64 = 124px
 *   ┌─────────────────────────────────────────┐ y=0
 *   │         [ camera button 64×64 ]         │
 *   ├──────────────────────────────────────────┤ y=CAMERA_SIZE=64
 *   │  SVG background (arc notch at top=0)    │
 *   │  [ Home ] [ Moments ] [ ] [ Letters ] [ Profile ] │
 *   └──────────────────────────────────────────┘ y=124 (+bottomPad)
 *
 *   Camera sits in the notch arc: the arc's center is at y=CAMERA_SIZE, the
 *   camera button occupies y=0..64, perfectly centered in the cutout.
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
import { tabBarRefs } from '../lib/tabBarRefs';

const { width: W } = Dimensions.get('window');

// ── Dimensions ────────────────────────────────────────────────────────────────

const TAB_H       = 60;              // visible tab bar height
const CAMERA_SIZE = 60;              // floating camera button diameter
const CUTOUT_R    = 36;              // arc radius (slightly > CAMERA_SIZE/2=32)
// Total container: camera zone on top + tab bar below — everything in-bounds
const CONTAINER_H = TAB_H + CAMERA_SIZE;   // 124px

// ── Colors ────────────────────────────────────────────────────────────────────

const ACTIVE_COLOR   = '#E8788A';
const INACTIVE_COLOR = '#A898AD';

// ── SVG Path ──────────────────────────────────────────────────────────────────
// Flat rectangle with semicircle arc notch at center-top.
// Arc: sweep-flag=0 → counter-clockwise → bows upward (concave notch).
// Stroke '#F0E6E3' gives a subtle top-edge shadow line without extra layers.

function buildArcPath(h: number): string {
  const x1 = W / 2 - CUTOUT_R;
  const x2 = W / 2 + CUTOUT_R;
  return [
    'M0,0',
    `L${x1},0`,
    `A${CUTOUT_R},${CUTOUT_R} 0 0 0 ${x2},0`,
    `L${W},0`,
    `L${W},${h}`,
    `L0,${h}`,
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
          backgroundColor:"red"
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
          style={{width: "100%", height: "100%",  borderRadius: CAMERA_SIZE / 2,}}>
          <View style={{ flex: 1,  alignItems: 'center', justifyContent: 'center' }}>
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
        // Full container: camera zone (CAMERA_SIZE) + tab bar (TAB_H) + safe area
        height: CONTAINER_H,
        overflow: 'visible',
      }}>

      {/* ── SVG background: pinned to bottom, arc notch opens upward ── */}
      <Svg
        width={W}
        height={barHeight}
        style={{ position: 'absolute', bottom: 0, left: 0 }}>
        {/* Stroke gives subtle top-edge shadow line without an extra layer */}
        <Path d={svgPath} fill="#FFFFFF" stroke="#F0E6E3" strokeWidth={1} />
      </Svg>

      {/* iOS bar shadow */}
      {Platform.OS === 'ios' && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: W,
            height: barHeight,
            shadowColor: '#4A2040',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
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

      {/* ── Tab items: 2 left + spacer + 2 right, pinned to bottom ── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: W,
          height: barHeight,
          flexDirection: 'row',
          alignItems: 'center',
          paddingBottom: bottomPad,
        }}>
        {TABS.map((tab, index) => {
          const route = state.routes[index];
          if (!route) return null;

          // Camera slot — empty spacer matching arc cutout width
          if (tab.Icon === null) {
            return (
              <View key={tab.name} style={{ width: CUTOUT_R * 2 + 8 }} />
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

          // Attach measurable ref for tour spotlight
          const tourRef =
            tab.name === 'MomentsTab' ? tabBarRefs.momentsTab :
            tab.name === 'LettersTab' ? tabBarRefs.lettersTab :
            undefined;

          return (
            <Pressable
              key={tab.name}
              ref={tourRef}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
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

      {/* ── Camera button: top=0 = sits at container top (inside bounds) ── */}
      {/* Container top = y=0, SVG starts at y=CAMERA_SIZE=64              */}
      {/* Camera occupies y=0..64, centered over arc notch                 */}
      <View
        ref={tabBarRefs.cameraButton}
        style={{
          position: 'absolute',
          top: -5,
          left: W / 2 - CAMERA_SIZE / 2,
          zIndex: 100,
          elevation: 100,
        }}>
        <CameraFloatButton />
      </View>

    </View>
  );
}
