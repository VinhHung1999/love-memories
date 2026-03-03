import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';

interface ReactionsBarProps {
  presetEmojis: string[];
  reactionCounts: (emoji: string) => number;
  hasReacted: (emoji: string) => boolean;
  onToggle: (emoji: string) => void;
}

export default function ReactionsBar({ presetEmojis, reactionCounts, hasReacted, onToggle }: ReactionsBarProps) {
  const colors = useAppColors();

  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.secondary }} />
        <Text className="text-[10px] font-bold text-textLight tracking-[1px] uppercase">
          {t.moments.detail.reactions}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
        {presetEmojis.map(emoji => {
          const count = reactionCounts(emoji);
          const reacted = hasReacted(emoji);
          return (
            <Pressable
              key={emoji}
              onPress={() => onToggle(emoji)}
              className="flex-row items-center gap-1 px-3 py-[6px] rounded-full"
              style={{
                backgroundColor: reacted ? colors.primaryMuted : 'rgba(26,22,36,0.04)',
                borderWidth: 1.5,
                borderColor: reacted ? `rgba(232,120,138,0.3)` : 'rgba(196,168,168,0.2)',
              }}>
              <Text className="text-sm">{emoji}</Text>
              {count > 0 ? (
                <Text className="text-[11px] font-semibold text-textMid">{count}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
