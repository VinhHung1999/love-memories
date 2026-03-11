import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';
import { GradientCard } from '../../../components/GradientCard';

interface ActiveCookingBannerProps {
  recipeTitles: string;
  onPress: () => void;
}

export function ActiveCookingBanner({ recipeTitles, onPress }: ActiveCookingBannerProps) {
  const colors = useAppColors();
  return (
    <GradientCard
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="px-4 py-3.5 flex-row items-center gap-3"
      pressableClassName="shadow-sm"
      onPress={onPress}>
      <View className="w-9 h-9 rounded-2xl bg-white/20 items-center justify-center">
        <Icon name="chef-hat" size={18} color="#fff" />
      </View>
      <View className="flex-1">
        <Text className="text-white font-bold text-[13px]">{t.dashboard.activeCooking}</Text>
        <Text className="text-white/80 text-[11px] mt-0.5" numberOfLines={1}>{recipeTitles}</Text>
      </View>
      <Icon name="arrow-right" size={18} color="rgba(255,255,255,0.8)" />
    </GradientCard>
  );
}
