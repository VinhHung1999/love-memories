import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { CalendarHeart } from 'lucide-react-native';
import { Caption } from '../../../components/Typography';
import type { DatePlan } from '../../../types';
import t from '../../../locales/en';

interface CompactDateCardProps {
  plans: DatePlan[];
  onPress: () => void;
}

export function CompactDateCard({ plans, onPress }: CompactDateCardProps) {
  const firstPlan = plans[0];

  function fmtDateShort(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  return (
    <Pressable onPress={onPress} className="flex-1">
      <View className="bg-white rounded-3xl p-4 justify-between flex-1 border border-borderSoft">
        <View className="flex-row items-center gap-1.5">
          <View className="w-6 h-6 rounded-xl bg-secondary/10 items-center justify-center">
            <CalendarHeart size={12} strokeWidth={1.5} />
          </View>
          <Text className="text-[10px] font-headingSemi text-secondary tracking-widest uppercase">
            {t.dashboard.compactDateCard.label}
          </Text>
        </View>
        {firstPlan ? (
          <View className="mt-2">
            <Text className="text-[12px] font-heading text-textDark" numberOfLines={1}>
              {firstPlan.title}
            </Text>
            <Text className="text-[10px] font-bodyLight text-textMid mt-0.5">
              {fmtDateShort(firstPlan.date)}
            </Text>
          </View>
        ) : (
          <Caption className="text-textMid italic mt-2">
            {t.dashboard.compactDateCard.noPlans}
          </Caption>
        )}
      </View>
    </Pressable>
  );
}
