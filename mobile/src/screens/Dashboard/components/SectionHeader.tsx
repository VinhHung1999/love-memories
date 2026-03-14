import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';
import { Heading } from '../../../components/Typography';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  const colors = useAppColors();
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Heading size="sm" className="text-textDark tracking-tight">{title}</Heading>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} className="flex-row items-center gap-0.5">
          <Text className="text-xs font-headingSemi text-primary">{t.dashboard.sections.seeAll}</Text>
          <ChevronRight size={14} color={colors.primary} strokeWidth={1.5} />
        </Pressable>
      ) : null}
    </View>
  );
}
