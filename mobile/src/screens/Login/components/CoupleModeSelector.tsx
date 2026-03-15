import React from 'react';
import { View } from 'react-native';
import { Caption } from '../../../components/Typography';
import { Heart, Plus } from 'lucide-react-native';
import { useAppColors } from '../../../navigation/theme';
import SpringPressable from '../../../components/SpringPressable';
import t from '../../../locales/en';
type CoupleMode = 'create' | 'join' | null;

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
              {opt === 'create'
                ? <Plus size={20} color={active ? colors.primary : colors.textLight} strokeWidth={1.5} />
                : <Heart size={20} color={active ? colors.primary : colors.textLight} strokeWidth={1.5} />}
              <Caption style={{ color: active ? colors.primary : colors.textLight, fontWeight: active ? '600' : '500' }}>
                {opt === 'create' ? t.login.couple.createNew : t.login.couple.joinExisting}
              </Caption>
            </SpringPressable>
          </View>
        );
      })}
    </View>
  );
}
