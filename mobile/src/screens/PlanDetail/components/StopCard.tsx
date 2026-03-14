import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Body, Caption } from '../../../components/Typography';
import { Check, CheckCircle } from 'lucide-react-native';
import { useAppColors } from '../../../navigation/theme';
import type { DatePlanStop } from '../../../types';

export default function StopCard({
  stop,
  isLast,
  onMarkDone,
}: {
  stop: DatePlanStop;
  isLast: boolean;
  onMarkDone: () => void;
}) {
  const colors = useAppColors();

  return (
    <View className="flex-row gap-3">
      {/* Timeline column */}
      <View className="items-center" style={{ width: 24 }}>
        {/* Dot */}
        <View
          className="w-5 h-5 rounded-full items-center justify-center border-2"
          style={{
            backgroundColor: stop.done ? colors.accent : colors.white,
            borderColor: stop.done ? colors.accent : colors.border,
          }}>
          {stop.done ? <Check size={11} strokeWidth={1.5} /> : null}
        </View>
        {/* Line */}
        {!isLast ? (
          <View
            className="w-0.5 flex-1 min-h-[20px] mt-1"
            style={{ backgroundColor: colors.border }}
          />
        ) : null}
      </View>

      {/* Content */}
      <View className="flex-1 pb-5">
        <View className="bg-white rounded-2xl p-3">
          <View className="flex-row items-start gap-2">
            <View className="flex-1">
              {stop.time ? (
                <Caption className="text-textLight mb-0.5 uppercase tracking-wider">
                  {stop.time}
                </Caption>
              ) : null}
              <Text
                className="text-[14px] font-semibold"
                style={{ color: stop.done ? colors.textLight : colors.textDark }}>
                {stop.title}
              </Text>
              {stop.description ? (
                <Body size="sm" className="text-textLight mt-0.5">{stop.description}</Body>
              ) : null}
              {stop.notes ? (
                <Body size="sm" className="text-textMid mt-1 italic">{stop.notes}</Body>
              ) : null}
            </View>
            {!stop.done ? (
              <Pressable
                onPress={onMarkDone}
                className="w-8 h-8 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.accentMuted }}>
                <Check size={15} color={colors.accent} strokeWidth={1.5} />
              </Pressable>
            ) : (
              <CheckCircle size={18} color={colors.accent} strokeWidth={1.5} />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
