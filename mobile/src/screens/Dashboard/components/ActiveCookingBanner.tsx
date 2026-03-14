import React from 'react';
import { View, Pressable } from 'react-native';
import { ArrowRight, ChefHat } from 'lucide-react-native';
import t from '../../../locales/en';
import { Label, Caption } from '../../../components/Typography';

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
          <Label className="text-textDark">{t.dashboard.activeCooking}</Label>
          <Caption className="text-textMid mt-0.5" numberOfLines={1}>{recipeTitles}</Caption>
        </View>
        <ArrowRight size={18} strokeWidth={1.5} />
      </View>
    </Pressable>
  );
}
