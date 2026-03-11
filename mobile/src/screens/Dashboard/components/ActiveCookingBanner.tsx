import React from 'react';
import { Text, View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import t from '../../../locales/en';

interface ActiveCookingBannerProps {
  recipeTitles: string;
  onPress: () => void;
}

export function ActiveCookingBanner({ recipeTitles, onPress }: ActiveCookingBannerProps) {
  return (
    <Pressable onPress={onPress}>
      <View className="bg-white rounded-3xl shadow-lg shadow-secondary/15 px-4 py-3.5 flex-row items-center gap-3 border-2 border-secondary/10">
        <View className="w-9 h-9 rounded-2xl bg-secondary/10 items-center justify-center">
          <Icon name="chef-hat" size={18} color="#FFD93D" />
        </View>
        <View className="flex-1">
          <Text className="text-textDark font-heading text-[13px]">{t.dashboard.activeCooking}</Text>
          <Text className="text-textMid font-body text-[11px] mt-0.5" numberOfLines={1}>{recipeTitles}</Text>
        </View>
        <Icon name="arrow-right" size={18} color="#FFD93D" />
      </View>
    </Pressable>
  );
}
