import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Caption, Label } from '../../../components/Typography';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutDown } from 'react-native-reanimated';
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
  const [pickerVisible, setPickerVisible] = useState(false);

  const handlePickerSelect = (emoji: string) => {
    onToggle(emoji);
    setPickerVisible(false);
  };

  // Emojis that have at least one reaction (for compact display)
  const activeEmojis = presetEmojis.filter(e => reactionCounts(e) > 0);
  const myReactions = presetEmojis.filter(e => hasReacted(e));

  return (
    <View className="mb-3">
      {/* Active reactions row + add button */}
      <View className="flex-row items-center flex-wrap gap-2">
        {/* Show active emojis with counts */}
        {activeEmojis.map(emoji => {
          const count = reactionCounts(emoji);
          const reacted = hasReacted(emoji);
          return (
            <Pressable
              key={emoji}
              onPress={() => onToggle(emoji)}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border"
              style={{
                backgroundColor: reacted ? colors.primaryMuted : colors.textDark + '0A',
                borderColor: reacted ? colors.primary + '4D' : colors.textLight + '33',
              }}>
              <Text className="text-base">{emoji}</Text>
              <Label
                className="font-semibold"
                style={{ color: reacted ? colors.primary : colors.textMid }}>
                {count}
              </Label>
            </Pressable>
          );
        })}

        {/* Add reaction button — long press OR short press opens picker */}
        <Pressable
          onPress={() => setPickerVisible(true)}
          onLongPress={() => setPickerVisible(true)}
          delayLongPress={200}
          className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border"
          style={{ borderColor: colors.textLight + '33', backgroundColor: colors.textDark + '0A' }}>
          <Text className="text-base">😊</Text>
          <Caption className="font-semibold" style={{ color: colors.textLight }}>
            {myReactions.length > 0 ? myReactions[0] : '+'}
          </Caption>
        </Pressable>
      </View>

      {/* Hint */}
      {activeEmojis.length === 0 ? (
        <Caption className="text-textLight dark:text-darkTextLight mt-1 italic">
          {t.moments.detail.reactHint ?? 'Tap + to react'}
        </Caption>
      ) : null}

      {/* ── Emoji picker modal ── */}
      <Modal
        transparent
        visible={pickerVisible}
        animationType="none"
        onRequestClose={() => setPickerVisible(false)}>
        <Pressable
          className="flex-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          onPress={() => setPickerVisible(false)}>
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            className="flex-1"
          />
        </Pressable>

        {/* Picker bubble */}
        <Animated.View
          entering={FadeInDown.springify().damping(20).stiffness(200)}
          exiting={FadeOutDown.duration(200)}
          className="absolute bottom-8 left-4 right-4">
          <View
            className="bg-white dark:bg-darkBgCard rounded-3xl px-4 py-4 shadow-lg"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 12,
            }}>
            <Caption className="font-bold text-textLight dark:text-darkTextLight uppercase tracking-wider mb-3 text-center">
              React to this moment
            </Caption>
            <View className="flex-row flex-wrap justify-center gap-2">
              {presetEmojis.map((emoji, idx) => {
                const reacted = hasReacted(emoji);
                const count = reactionCounts(emoji);
                return (
                  <Animated.View
                    key={emoji}
                    entering={FadeInDown.delay(idx * 30).duration(300)}>
                    <Pressable
                      onPress={() => handlePickerSelect(emoji)}
                      className="items-center gap-0.5 px-2 py-2 rounded-2xl"
                      style={{
                        backgroundColor: reacted
                          ? colors.primaryMuted
                          : 'transparent',
                        minWidth: 52,
                      }}>
                      <Text style={{ fontSize: 32 }}>{emoji}</Text>
                      {count > 0 ? (
                        <Caption
                          className="font-bold"
                          style={{ color: reacted ? colors.primary : colors.textLight }}>
                          {count}
                        </Caption>
                      ) : (
                        <Caption style={{ color: 'transparent' }}>0</Caption>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}
