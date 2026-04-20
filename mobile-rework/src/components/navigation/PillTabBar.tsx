import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { LinearGradient } from '@/components/Gradient';
import { useAppColors } from '@/theme/ThemeProvider';

type TabKey = 'home' | 'moments' | 'letters' | 'profile';

type TabDef = {
  key: TabKey;
  route: 'index' | 'moments' | 'letters' | 'profile';
  labelKey: string;
  icon: TabKey;
};

const TABS: TabDef[] = [
  { key: 'home', route: 'index', labelKey: 'tabs.home', icon: 'home' },
  { key: 'moments', route: 'moments', labelKey: 'tabs.moments', icon: 'moments' },
  { key: 'letters', route: 'letters', labelKey: 'tabs.letters', icon: 'letters' },
  { key: 'profile', route: 'profile', labelKey: 'tabs.profile', icon: 'profile' },
];

type Props = BottomTabBarProps & { onCameraPress?: () => void };

export function PillTabBar({ state, navigation, onCameraPress }: Props) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name;

  // T352: drop SafeAreaView wrap — prototype pill floats at fixed bottom-24 on
  // web, not system-reserved. Home-indicator devices still need clearance so
  // pill doesn't sit on the indicator's gesture zone; resolve via
  // useSafeAreaInsets + conditional className (Zero-style rule → arbitrary
  // px class strings are static-only, pair is safer). pb-9 = 36px clears the
  // 34pt iPhone indicator with 2px breathing; pb-3 = baseline for devices
  // without indicator (iPhone SE / Android 3-button nav gives its own inset).
  const bottomClass = insets.bottom > 0 ? 'pb-9' : 'pb-3';

  const onTabPress = (tab: TabDef) => {
    const route = state.routes.find((r) => r.name === tab.route);
    if (!route) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(tab.route);
    }
  };

  const handleCameraPress = () => {
    if (onCameraPress) onCameraPress();
    else console.log('camera-pill-press');
  };

  return (
    <View
      pointerEvents="box-none"
      className={`absolute left-0 right-0 bottom-0 ${bottomClass}`}
    >
      <View
        pointerEvents="box-none"
        className="flex-row items-center px-3"
      >
        <View className="flex-1 flex-row items-center justify-around h-[62px] rounded-full bg-bg-elev border border-line px-2 shadow-elevated mr-2.5">
          {TABS.map((tab) => {
            const isActive = tab.route === activeRoute;
            return (
              <Pressable
                key={tab.key}
                onPress={() => onTabPress(tab)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={t(tab.labelKey)}
                className="flex-1 items-center justify-center py-1.5"
              >
                <TabIcon
                  name={tab.icon}
                  color={isActive ? colors.primary : colors.inkMute}
                  filled={isActive}
                />
                <Text
                  className={`mt-0.5 font-bodySemibold text-[10px] ${
                    isActive ? 'text-primary' : 'text-ink-mute'
                  }`}
                >
                  {t(tab.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleCameraPress}
          accessibilityRole="button"
          accessibilityLabel={t('tabs.camera', { defaultValue: 'Camera' })}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-[62px] h-[62px] rounded-full items-center justify-center shadow-hero"
          >
            <TabIcon name="camera" color="#FFFFFF" filled={false} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

type IconName = TabKey | 'camera';

function TabIcon({
  name,
  color,
  filled,
}: {
  name: IconName;
  color: string;
  filled: boolean;
}) {
  const sw = 1.8;
  const fillProp = filled ? color : 'none';
  const fillOpacity = filled ? 0.18 : 1;

  if (name === 'home') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
          d="M3 11l9-8 9 8v9a2 2 0 01-2 2h-4v-6H10v6H6a2 2 0 01-2-2v-9z"
          stroke={color}
          strokeWidth={sw}
          fill={fillProp}
          fillOpacity={fillOpacity}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (name === 'moments') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Rect
          x={3}
          y={5}
          width={18}
          height={15}
          rx={3}
          stroke={color}
          strokeWidth={sw}
          fill={fillProp}
          fillOpacity={fillOpacity}
          strokeLinejoin="round"
        />
        <Circle cx={8.5} cy={10.5} r={1.5} fill={color} />
        <Path
          d="M3 16l5-5 4 4 3-3 6 6"
          stroke={color}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (name === 'letters') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Rect
          x={3}
          y={5}
          width={18}
          height={14}
          rx={2}
          stroke={color}
          strokeWidth={sw}
          fill={fillProp}
          fillOpacity={fillOpacity}
          strokeLinejoin="round"
        />
        <Path
          d="M3 7l9 6 9-6"
          stroke={color}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (name === 'profile') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Circle
          cx={9}
          cy={9}
          r={3}
          stroke={color}
          strokeWidth={sw}
          fill={fillProp}
          fillOpacity={fillOpacity}
        />
        <Circle
          cx={15}
          cy={9}
          r={3}
          stroke={color}
          strokeWidth={sw}
          fill={fillProp}
          fillOpacity={fillOpacity}
        />
        <Path
          d="M3 20c0-3 3-6 6-6M21 20c0-3-3-6-6-6"
          stroke={color}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  if (name === 'camera') {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 8a2 2 0 012-2h2l2-2h6l2 2h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Circle cx={12} cy={13} r={4} stroke={color} strokeWidth={2} />
      </Svg>
    );
  }
  return null;
}
