import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Camera, Home, Images, Mail, UsersRound } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from '@/components/Gradient';
import { useAppColors } from '@/theme/ThemeProvider';

// T369 — shared tab-bar layout constant so scroll containers inside (tabs)/*
// can compute bottom inset via `useTabBarBottomInset()` instead of magic
// `pb-36` numbers scattered across screens. Matches the pill's `h-[62px]`
// below so any change here flows through the hook.
export const TAB_BAR_HEIGHT = 62;

type TabKey = 'home' | 'moments' | 'letters' | 'profile';

type TabDef = {
  key: TabKey;
  route: 'index' | 'moments' | 'letters' | 'profile';
  labelKey: string;
  icon: LucideIcon;
};

const TABS: TabDef[] = [
  { key: 'home', route: 'index', labelKey: 'tabs.home', icon: Home },
  { key: 'moments', route: 'moments', labelKey: 'tabs.moments', icon: Images },
  { key: 'letters', route: 'letters', labelKey: 'tabs.letters', icon: Mail },
  { key: 'profile', route: 'profile', labelKey: 'tabs.profile', icon: UsersRound },
];

// T370 — per-tab cell with Reanimated lift + dot reveal. Icon sits dead-center
// when idle (no dot in flow) and translates up ICON_LIFT_PX with a fade-in dot
// below when active. Prototype tabbar.jsx:154-172 renders the dot only on
// active — we match that by absolute-positioning + opacity/scale animation so
// layout stays stable across states.
const ICON_LIFT_PX = 5;
const TRANSITION_MS = 180;

type PillTabItemProps = {
  tab: TabDef;
  isActive: boolean;
  activeColor: string;
  idleColor: string;
  label: string;
  onPress: () => void;
};

function PillTabItem({ tab, isActive, activeColor, idleColor, label, onPress }: PillTabItemProps) {
  const Icon = tab.icon;
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: TRANSITION_MS });
  }, [isActive, progress]);

  const iconAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: -progress.value * ICON_LIFT_PX }],
  }));
  const dotAnim = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.4 + progress.value * 0.6 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
      className="flex-1 h-[62px] items-center justify-center"
    >
      <Animated.View style={iconAnim}>
        <Icon size={22} color={isActive ? activeColor : idleColor} strokeWidth={1.75} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={dotAnim}
        className="absolute bottom-[12px] w-1 h-1 rounded-full bg-primary"
      />
    </Pressable>
  );
}

type Props = BottomTabBarProps & { onCameraPress?: () => void };

export function PillTabBar({ state, navigation, onCameraPress }: Props) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name;

  // Home-indicator clearance (same rationale as Sprint 60 T352).
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
        {/* T361: BlurView dropped — solid bg-bg-elev + shadow-pill matches
            prototype tabbar.jsx:85-91 (bgElev + soft double shadow).
            Text labels removed; active state is a 4px primary dot under the
            icon (prototype compact TabItem line 169-171). Icons swapped to
            lucide for cross-surface consistency with SettingsRow. */}
        {/* h-[62px] must stay in sync with TAB_BAR_HEIGHT above. */}
        <View className="flex-1 flex-row items-stretch h-[62px] rounded-full bg-bg-elev border border-line-on-surface px-2 shadow-pill mr-2.5">
          {TABS.map((tab) => (
            <PillTabItem
              key={tab.key}
              tab={tab}
              isActive={tab.route === activeRoute}
              activeColor={colors.primary}
              idleColor={colors.inkMute}
              label={t(tab.labelKey)}
              onPress={() => onTabPress(tab)}
            />
          ))}
        </View>

        {/* T371: camera pill rose glow. iOS supports colored shadow natively
            (shadowColor), so we inline it — no Tailwind class maps to a
            themed shadow color. Android can't render colored shadows, so we
            layer an absolute primary-tinted aura behind the pill as a
            fallback. style= on Pressable is a documented narrow carve-out
            (see .claude/rules/mobile-rework.md). */}
        <View className="relative">
          {Platform.OS === 'android' ? (
            <View
              pointerEvents="none"
              className="absolute -inset-[10px] rounded-full bg-primary/30"
            />
          ) : null}
          <Pressable
            onPress={handleCameraPress}
            accessibilityRole="button"
            accessibilityLabel={t('tabs.camera', { defaultValue: 'Camera' })}
            style={
              Platform.OS === 'ios'
                ? {
                    shadowColor: colors.primary,
                    shadowOpacity: 0.45,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 6 },
                  }
                : undefined
            }
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-[62px] h-[62px] rounded-full items-center justify-center"
            >
              <Camera size={24} color="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
