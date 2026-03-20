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
 *
 * Camera tap → 2 floating icon buttons spring up (left = Quick Photo, right = Photo Booth).
 * Dismiss: tap either icon, tap camera button again, or tap backdrop.
 */
import React, { useState } from 'react';
import { Dimensions, Modal, Platform, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CircleUser, Heart, Home, LayoutGrid, Mail, Camera } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { launchCamera } from 'react-native-image-picker';
import CreateMomentSheet from '../screens/CreateMoment/CreateMomentSheet';
import { Caption, Label } from './Typography';
import { tabBarRefs } from '../lib/tabBarRefs';
import { useAppColors } from '../navigation/theme';
import { useUnreadLettersCount } from '../lib/useUnreadLettersCount';

const { width: W } = Dimensions.get('window');

// ── Dimensions ────────────────────────────────────────────────────────────────

const TAB_H = 60;
export const CAMERA_SIZE = 60;
const CUTOUT_R = 36;
export const CONTAINER_H = TAB_H + CAMERA_SIZE;

const ICON_BTN_SIZE = 48;

// ── Colors ────────────────────────────────────────────────────────────────────

const ACTIVE_COLOR = '#E8788A';
const INACTIVE_COLOR = '#A898AD';

// ── SVG Path ──────────────────────────────────────────────────────────────────

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
  { name: 'Dashboard', label: 'Home', Icon: Home },
  { name: 'MomentsTab', label: 'Moments', Icon: Heart },
  { name: 'CameraTab', label: '', Icon: null },
  { name: 'LettersTab', label: 'Letters', Icon: Mail },
  { name: 'ProfileTab', label: 'Profile', Icon: CircleUser },
] as const;

// ── Floating Camera Button ────────────────────────────────────────────────────

function CameraFloatButton({ navigation }: { navigation: BottomTabBarProps['navigation'] }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);

  // Pulse animation for main camera button
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Floating icon animations
  const leftScale  = useSharedValue(0);
  const leftY      = useSharedValue(16);
  const rightScale = useSharedValue(0);
  const rightY     = useSharedValue(16);
  const backdropOpacity = useSharedValue(0);

  const collapse = (onDone?: () => void) => {
    backdropOpacity.value = withTiming(0, { duration: 150 });
    leftScale.value  = withTiming(0, { duration: 120 });
    rightScale.value = withTiming(0, { duration: 120 }, () => {
      runOnJS(setExpanded)(false);
      if (onDone) runOnJS(onDone)();
    });
    leftY.value  = withTiming(16, { duration: 120 });
    rightY.value = withTiming(16, { duration: 120 });
  };

  const expand = () => {
    setExpanded(true);
    backdropOpacity.value = withTiming(0.45, { duration: 200 });
    leftScale.value  = withSpring(1, { mass: 0.5, stiffness: 280, damping: 18 });
    leftY.value      = withSpring(0, { mass: 0.5, stiffness: 280, damping: 18 });
    rightScale.value = withDelay(50, withSpring(1, { mass: 0.5, stiffness: 280, damping: 18 }));
    rightY.value     = withDelay(50, withSpring(0, { mass: 0.5, stiffness: 280, damping: 18 }));
  };

  const handlePress = () => {
    if (expanded) collapse();
    else expand();
  };

  const launchQuickPhoto = async () => {
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

  const launchPhotoBooth = () => {
    (navigation as any).navigate('PhotoBooth');
  };

  // Animated styles for floating buttons
  const leftBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leftScale.value }, { translateY: leftY.value }],
    opacity: leftScale.value,
  }));
  const rightBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rightScale.value }, { translateY: rightY.value }],
    opacity: rightScale.value,
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Camera center position from screen bottom (for floating button placement in Modal)
  const cameraCenterBottom = insets.bottom + TAB_H + CAMERA_SIZE / 2;
  const floatBtnBottom = cameraCenterBottom + 56; // ~56px above camera center

  return (
    <>
      {/* Main camera button */}
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
          pulseStyle,
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
            style={{ width: '100%', height: '100%', borderRadius: CAMERA_SIZE / 2 }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={28} color="#FFFFFF" strokeWidth={1.8} />
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Floating icon modal — backdrop + 2 buttons */}
      <Modal transparent visible={expanded} animationType="none" statusBarTranslucent>
        {/* Backdrop */}
        <Animated.View
          style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#1a0f18' }, backdropStyle]}
        />
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={() => collapse()}
        />

        {/* Left button: Camera / Quick Photo */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: floatBtnBottom,
              left: W / 2 - ICON_BTN_SIZE - 20,
              alignItems: 'center',
              gap: 6,
            },
            leftBtnStyle,
          ]}>
          <Pressable
            onPress={() => collapse(launchQuickPhoto)}
            style={{ alignItems: 'center', gap: 6 }}>
            {/* Shadow ring — no overflow */}
            <View style={{
              width: ICON_BTN_SIZE, height: ICON_BTN_SIZE,
              borderRadius: ICON_BTN_SIZE / 2,
              shadowColor: '#E8788A', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
            }}>
              {/* Clip ring — overflow here, not on shadow ring */}
              <View style={{ width: ICON_BTN_SIZE, height: ICON_BTN_SIZE, borderRadius: ICON_BTN_SIZE / 2, overflow: 'hidden' }}>
                <LinearGradient
                  colors={['#F4A0B0', '#E8788A']}
                  start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }}
                  style={{ width: '100%', height: '100%', borderRadius: ICON_BTN_SIZE / 2 }}>
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={22} color="#fff" strokeWidth={1.8} />
                  </View>
                </LinearGradient>
              </View>
            </View>
            <Label style={{ color: '#fff', fontSize: 11, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
              {t('photoBooth.quickLabel')}
            </Label>
          </Pressable>
        </Animated.View>

        {/* Right button: Grid / Photo Booth */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: floatBtnBottom,
              left: W / 2 + 20,
              alignItems: 'center',
              gap: 6,
            },
            rightBtnStyle,
          ]}>
          <Pressable
            onPress={() => collapse(launchPhotoBooth)}
            style={{ alignItems: 'center', gap: 6 }}>
            {/* Shadow ring — no overflow */}
            <View style={{
              width: ICON_BTN_SIZE, height: ICON_BTN_SIZE,
              borderRadius: ICON_BTN_SIZE / 2,
              shadowColor: '#E8788A', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
            }}>
              {/* Clip ring — overflow here, not on shadow ring */}
              <View style={{ width: ICON_BTN_SIZE, height: ICON_BTN_SIZE, borderRadius: ICON_BTN_SIZE / 2, overflow: 'hidden' }}>
                <LinearGradient
                  colors={['#F4A0B0', '#E8788A']}
                  start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }}
                  style={{ width: '100%', height: '100%', borderRadius: ICON_BTN_SIZE / 2 }}>
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <LayoutGrid size={22} color="#fff" strokeWidth={1.8} />
                  </View>
                </LinearGradient>
              </View>
            </View>
            <Label style={{ color: '#fff', fontSize: 11, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
              {t('photoBooth.boothLabel')}
            </Label>
          </Pressable>
        </Animated.View>
      </Modal>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CurvedTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const unreadLettersCount = useUnreadLettersCount();
  const bottomPad = Math.max(insets.bottom, 8);
  const barHeight = TAB_H + bottomPad;
  const svgPath = buildArcPath(barHeight);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        width: W,
        height: CONTAINER_H,
        overflow: 'visible',
      }}>

      {/* SVG background */}
      <Svg
        width={W}
        height={barHeight}
        style={{ position: 'absolute', bottom: 0, left: 0 }}>
        <Path d={svgPath} fill={colors.bgCard} stroke={colors.borderSoft} strokeWidth={1} />
      </Svg>

      {/* iOS bar shadow */}
      {Platform.OS === 'ios' && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, width: W, height: barHeight,
          shadowColor: '#4A2040', shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06, shadowRadius: 10,
        }} />
      )}

      {/* Android elevation */}
      {Platform.OS === 'android' && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, width: W, height: barHeight,
          elevation: 8, backgroundColor: 'transparent',
        }} />
      )}

      {/* Tab items */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, width: W, height: barHeight,
        flexDirection: 'row', alignItems: 'center', paddingBottom: bottomPad,
      }}>
        {TABS.map((tab, index) => {
          const route = state.routes[index];
          if (!route) return null;

          if (tab.Icon === null) {
            return <View key={tab.name} style={{ width: CUTOUT_R * 2 + 8 }} />;
          }

          const isFocused = state.index === index;
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
          const Icon = tab.Icon;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
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

          const tourRef =
            tab.name === 'MomentsTab' ? tabBarRefs.momentsTab :
              tab.name === 'LettersTab' ? tabBarRefs.lettersTab :
                undefined;

          const showBadge = tab.name === 'LettersTab' && unreadLettersCount > 0;
          const badgeLabel = unreadLettersCount > 9 ? '9+' : String(unreadLettersCount);

          return (
            <Pressable
              key={tab.name}
              ref={tourRef}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <View style={{ position: 'relative' }}>
                <Icon size={22} color={color} strokeWidth={isFocused ? 2 : 1.6} />
                {showBadge && (
                  <View style={{
                    position: 'absolute', top: -4, right: -6,
                    minWidth: 16, height: 16, borderRadius: 8,
                    backgroundColor: '#EF4444',
                    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
                  }}>
                    <Caption style={{ color: '#FFFFFF', fontSize: 9, lineHeight: 11, fontWeight: '700' }}>
                      {badgeLabel}
                    </Caption>
                  </View>
                )}
              </View>
              <Caption style={{ color, fontSize: 10, lineHeight: 12, fontWeight: isFocused ? '600' : '400' }}>
                {tab.label}
              </Caption>
            </Pressable>
          );
        })}
      </View>

      {/* Camera button */}
      <View
        ref={tabBarRefs.cameraButton}
        style={{ position: 'absolute', top: -5, left: W / 2 - CAMERA_SIZE / 2, zIndex: 100, elevation: 100 }}>
        <CameraFloatButton navigation={navigation} />
      </View>

    </View>
  );
}
