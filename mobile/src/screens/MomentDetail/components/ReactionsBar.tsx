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
        <View className="w-1.5 h-1.5 rounded-full bg-secondary" />
        <Text className="text-[10px] font-bold text-textLight tracking-[1px] uppercase">
          {t.moments.detail.reactions}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pr-1">
          {presetEmojis.map(emoji => {
            const count = reactionCounts(emoji);
            const reacted = hasReacted(emoji);
            return (
              <Pressable
                key={emoji}
                onPress={() => onToggle(emoji)}
                className="flex-row items-center gap-1 px-3 py-[6px] rounded-full border"
              style={{ backgroundColor: reacted ? colors.primaryMuted : colors.textDark + '0A', borderColor: reacted ? colors.primary + '4D' : colors.textLight + '33' }}>
                <Text className="text-sm">{emoji}</Text>
                {count > 0 ? (
                  <Text className="text-[11px] font-semibold text-textMid">{count}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
