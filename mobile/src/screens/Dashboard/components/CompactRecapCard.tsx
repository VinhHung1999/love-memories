import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GradientCard } from '../../../components/GradientCard';
import t from '../../../locales/en';

interface CompactRecapCardProps {
  onPress: () => void;
}

export function CompactRecapCard({ onPress }: CompactRecapCardProps) {
  return (
    <GradientCard
      colors={['#C3517A', '#E8788A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 p-4 justify-between"
      pressableClassName="flex-1"
      style={{ minHeight: 80 }}
      onPress={onPress}>
      <View className="flex-row items-center gap-1.5">
        <View className="w-6 h-6 rounded-xl bg-white/20 items-center justify-center">
          <Icon name="chart-bar" size={12} color="#fff" />
        </View>
        <Text className="text-[10px] font-semibold text-white/60 tracking-widest uppercase">
          {t.dashboard.compactRecapCard.label}
        </Text>
      </View>
      <View className="flex-row items-center gap-1 mt-2">
        <Text className="text-[12px] font-bold text-white">{t.dashboard.compactRecapCard.action}</Text>
        <Icon name="arrow-right" size={12} color="rgba(255,255,255,0.80)" />
      </View>
    </GradientCard>
  );
}
