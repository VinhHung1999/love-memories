import React from 'react';
import { Pressable, Text, View } from 'react-native';

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
 * Glass morphism tab bar for CollapsibleHeader footer.
 * Used in: LettersScreen, DailyQuestionsScreen
 */
export default function GlassTabBar<T extends string = string>({ tabs, activeTab, onTabPress }: GlassTabBarProps<T>) {
  return (
    <View className="flex-row gap-2 px-4 py-2 bg-white/10">
      {tabs.map(tab => (
        <Pressable
          key={tab.key}
          onPress={() => onTabPress(tab.key)}
          className={`flex-1 rounded-xl py-2 items-center ${activeTab === tab.key ? 'bg-white/30' : 'bg-white/10'}`}>
          <Text
            className={`text-[13px] font-semibold ${activeTab === tab.key ? 'text-white' : 'text-white/60'}`}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
