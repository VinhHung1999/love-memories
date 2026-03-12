import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { ArrowRight, ChefHat } from 'lucide-react-native';
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
          <ChefHat size={18} strokeWidth={1.5} />
        </View>
        <View className="flex-1">
          <Text className="text-textDark font-heading text-[13px]">{t.dashboard.activeCooking}</Text>
          <Text className="text-textMid font-body text-[11px] mt-0.5" numberOfLines={1}>{recipeTitles}</Text>
        </View>
        <ArrowRight size={18} strokeWidth={1.5} />
      </View>
    </Pressable>
  );
}
