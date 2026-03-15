import React from 'react';
import { View, Pressable } from 'react-native';
import { ArrowRight, BarChart2 } from 'lucide-react-native';
import { Caption } from '../../../components/Typography';
import { useTranslation } from 'react-i18next';
interface CompactRecapCardProps {
  onPress: () => void;
}

export function CompactRecapCard({ onPress }: CompactRecapCardProps) {
  const { t } = useTranslation();
  return (
    <Pressable onPress={onPress} className="flex-1" style={{ minHeight: 80 }}>
      <View className="bg-white dark:bg-darkBgCard rounded-3xl p-4 justify-between flex-1 border border-borderSoft dark:border-darkBorder">
        <View className="flex-row items-center gap-1.5">
          <View className="w-6 h-6 rounded-xl bg-accent/10 items-center justify-center">
            <BarChart2 size={12} strokeWidth={1.5} />
          </View>
          <Caption className="font-headingSemi text-accent tracking-widest uppercase">
            {t('dashboard.compactRecapCard.label')}
          </Caption>
        </View>
        <View className="flex-row items-center gap-1 mt-2">
          <Caption className="font-heading text-textDark dark:text-darkTextDark" style={{ fontSize: 12 }}>{t('dashboard.compactRecapCard.action')}</Caption>
          <ArrowRight size={12} strokeWidth={1.5} />
        </View>
      </View>
    </Pressable>
  );
}
