// Sprint 67 T454 — Section 08 firsts list (prototype `recap.jsx`
// L431-464). Numbered chips (01..NN, gradient heroA→heroB) + first-time
// title + accent-color "lần đầu" / "first" tag.
//
// Empty-state copy when the BE returns an empty `firsts` array — per Boss
// Q2 chốt 2026-04-27: educate user to tag #lầnđầu on moments. Module
// tour will reinforce later.

import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppColors } from '@/theme/ThemeProvider';

import type { RecapFirst } from '../types';

type Props = {
  items: RecapFirst[];
  emptyBody: string;
  tagLabel: string;          // 'lần đầu' / 'first'
};

export function FirstsList({ items, emptyBody, tagLabel }: Props) {
  const c = useAppColors();

  if (items.length === 0) {
    return (
      <View className="mt-3.5 rounded-[20px] border border-dashed border-line bg-surface px-5 py-6">
        <Text className="font-body text-[13px] leading-[20px] text-ink-soft">
          {emptyBody}
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-3.5 overflow-hidden rounded-[20px] border border-line bg-surface">
      {items.map((item, i) => (
        <View
          key={item.id}
          className={
            i < items.length - 1
              ? 'flex-row items-center gap-3 border-b border-line-soft-on-surface px-4 py-3.5'
              : 'flex-row items-center gap-3 px-4 py-3.5'
          }
        >
          <View className="h-8 w-8 items-center justify-center overflow-hidden rounded-md">
            <LinearGradient
              colors={[c.heroA, c.heroB]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text className="font-displayBold text-[13px] text-white">
                {String(i + 1).padStart(2, '0')}
              </Text>
            </LinearGradient>
          </View>
          <Text
            className="flex-1 font-bodyMedium text-[14px] leading-[19px] text-ink"
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text className="font-displayItalic text-[11px] uppercase tracking-wider text-primary">
            {tagLabel}
          </Text>
        </View>
      ))}
    </View>
  );
}
