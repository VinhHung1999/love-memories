import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';
import SpringPressable from '../../../components/SpringPressable';
import t from '../../../locales/en';
import { CoupleMode } from '../useLoginViewModel';

export default function CoupleModeSelector({
  value,
  onChange,
}: {
  value: CoupleMode;
  onChange: (v: CoupleMode) => void;
}) {
  const colors = useAppColors();

  return (
    <View className="flex-row gap-[10px] mb-[14px]">
      {(['create', 'join'] as const).map(opt => {
        const active = value === opt;
        return (
          <SpringPressable
            key={opt}
            className={`flex-1 flex-col items-center gap-[6px] py-3 rounded-[14px] border-[1.5px] ${
              active ? 'border-primary bg-primary/[8%]' : 'border-white/60 bg-white/70'
            }`}
            onPress={() => onChange(opt)}>
            <Icon
              name={opt === 'create' ? 'plus-circle-outline' : 'account-heart-outline'}
              size={20}
              color={active ? colors.primary : colors.textLight}
            />
            <Text className={`text-xs ${active ? 'text-primary font-semibold' : 'text-textLight font-medium'}`}>
              {opt === 'create' ? t.login.couple.createNew : t.login.couple.joinExisting}
            </Text>
          </SpringPressable>
        );
      })}
    </View>
  );
}
