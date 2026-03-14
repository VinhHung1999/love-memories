import React from 'react';
import { Pressable, View } from 'react-native';
import { useAppColors } from '../navigation/theme';
import { Label } from './Typography';

interface Tab<T extends string = string> {
  key: T;
  label: string;
}

interface GlassTabBarProps<T extends string = string> {
  tabs: Tab<T>[];
  activeTab: T;
  onTabPress: (key: T) => void;
}

/**
 * Filter tab bar for ListHeader.
 * Used in: LettersScreen, DailyQuestionsScreen
 */
export default function GlassTabBar<T extends string = string>({ tabs, activeTab, onTabPress }: GlassTabBarProps<T>) {
  const colors = useAppColors();

  return (
    <View className="bg-white px-4 py-2">
      {/* Inner tray — subtle grey container that pills sit inside */}
      <View
        className="flex-row rounded-xl overflow-hidden"
        style={{ backgroundColor: '#F3F4F6', padding: 3, borderRadius: 12 }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              className="flex-1 items-center py-2"
              style={{
                borderRadius: 9,
                backgroundColor: isActive ? colors.primary : 'transparent',
                shadowColor: isActive ? colors.primary : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isActive ? 0.25 : 0,
                shadowRadius: 4,
              }}>
              <Label
                className="text-[13px]"
                style={{
                  color: isActive ? '#FFFFFF' : colors.textMid,
                  fontWeight: isActive ? '600' : '500',
                }}>
                {tab.label}
              </Label>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
