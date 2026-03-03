import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import t from '../../../locales/en';

interface ReactionsBarProps {
  presetEmojis: string[];
  reactionCounts: (emoji: string) => number;
  hasReacted: (emoji: string) => boolean;
  onToggle: (emoji: string) => void;
}

export default function ReactionsBar({ presetEmojis, reactionCounts, hasReacted, onToggle }: ReactionsBarProps) {
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
                className={`flex-row items-center gap-1 px-3 py-[6px] rounded-full border ${
                  reacted
                    ? 'bg-primary/12 border-primary/30'
                    : 'bg-textDark/4 border-[rgba(196,168,168,0.2)]'
                }`}>
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
