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
          <View key={opt} className="flex-1">
            <SpringPressable
              className="flex-col items-center gap-[6px] py-3 rounded-[14px] border-[1.5px]"
              style={{ borderColor: active ? colors.primary : 'rgba(255,255,255,0.6)', backgroundColor: active ? 'rgba(232,120,138,0.08)' : 'rgba(255,255,255,0.7)' }}
              onPress={() => onChange(opt)}>
              <Icon
                name={opt === 'create' ? 'plus-circle-outline' : 'account-heart-outline'}
                size={20}
                color={active ? colors.primary : colors.textLight}
              />
              <Text className="text-xs" style={{ color: active ? colors.primary : colors.textLight, fontWeight: active ? '600' : '500' }}>
                {opt === 'create' ? t.login.couple.createNew : t.login.couple.joinExisting}
              </Text>
            </SpringPressable>
          </View>
        );
      })}
    </View>
  );
}
