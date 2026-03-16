import React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useAppColors } from '../../../navigation/theme';
import { useTranslation } from 'react-i18next';
import { Heading, Caption } from '../../../components/Typography';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  const { t } = useTranslation();
  const colors = useAppColors();
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Heading size="sm" className="text-textDark dark:text-darkTextDark tracking-tight">{title}</Heading>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} className="flex-row items-center gap-0.5">
          <Caption className="font-headingSemi text-primary">{t('dashboard.sections.seeAll')}</Caption>
          <ChevronRight size={14} color={colors.primary} strokeWidth={1.5} />
        </Pressable>
      ) : null}
    </View>
  );
}
