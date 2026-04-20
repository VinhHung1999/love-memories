import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Camera, Home, Images, Mail, UsersRound } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
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
      <View pointerEvents="box-none" className="flex-row items-center px-3">
        {/* T361: BlurView dropped — solid bg-bg-elev + shadow-pill matches
            prototype tabbar.jsx:85-91 (bgElev + soft double shadow).
            Text labels removed; active state is a 4px primary dot under the
            icon (prototype compact TabItem line 169-171). Icons swapped to
            lucide for cross-surface consistency with SettingsRow. */}
        {/* h-[62px] must stay in sync with TAB_BAR_HEIGHT above. */}
        <View className="flex-1 flex-row items-center justify-around h-[62px] rounded-full bg-bg-elev border border-line-on-surface px-2 shadow-pill mr-2.5">
          {TABS.map((tab) => {
            const isActive = tab.route === activeRoute;
            const Icon = tab.icon;
            const iconColor = isActive ? colors.primary : colors.inkMute;
            return (
              <Pressable
                key={tab.key}
                onPress={() => onTabPress(tab)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={t(tab.labelKey)}
                className="flex-1 items-center justify-center py-2"
              >
                <Icon size={22} color={iconColor} strokeWidth={1.75} />
                <View
                  className={`mt-1 w-1 h-1 rounded-full ${
                    isActive ? 'bg-primary' : 'bg-transparent'
                  }`}
                />
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
            <Camera size={24} color="#FFFFFF" strokeWidth={2} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
