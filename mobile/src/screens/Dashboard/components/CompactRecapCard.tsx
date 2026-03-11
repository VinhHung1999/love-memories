import React from 'react';
import { Text, View, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import t from '../../../locales/en';

interface CompactRecapCardProps {
  onPress: () => void;
}

export function CompactRecapCard({ onPress }: CompactRecapCardProps) {
  return (
    <Pressable onPress={onPress} className="flex-1" style={{ minHeight: 80 }}>
      <View className="bg-white rounded-3xl shadow-lg shadow-accent/15 p-4 justify-between flex-1 border-2 border-accent/10">
        <View className="flex-row items-center gap-1.5">
          <View className="w-6 h-6 rounded-xl bg-accent/10 items-center justify-center">
            <Icon name="chart-bar" size={12} color="#C7CEEA" />
          </View>
          <Text className="text-[10px] font-headingSemi text-accent tracking-widest uppercase">
            {t.dashboard.compactRecapCard.label}
          </Text>
        </View>
        <View className="flex-row items-center gap-1 mt-2">
          <Text className="text-[12px] font-heading text-textDark">{t.dashboard.compactRecapCard.action}</Text>
          <Icon name="arrow-right" size={12} color="#C7CEEA" />
        </View>
      </View>
    </Pressable>
  );
}
