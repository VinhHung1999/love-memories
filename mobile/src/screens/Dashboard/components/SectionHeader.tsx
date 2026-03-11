import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  const colors = useAppColors();
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-base font-bold text-textDark tracking-tight">{title}</Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} className="flex-row items-center gap-0.5">
          <Text className="text-xs font-semibold text-primary">{t.dashboard.sections.seeAll}</Text>
          <Icon name="chevron-right" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}
