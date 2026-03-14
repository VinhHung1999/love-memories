import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Body, Caption } from '../../../components/Typography';
import FastImage from 'react-native-fast-image';
import { Music2, Trash2 } from 'lucide-react-native';
import { useAppColors } from '../../../navigation/theme';
import type { LoveLetter } from '../../../types';
import t from '../../../locales/en';

const MOOD_EMOJI: Record<string, string> = {
  love: '❤️',
  happy: '😊',
  miss: '🥺',
  grateful: '🙏',
  playful: '😄',
  romantic: '🌹',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function LetterCard({
  letter,
  onPress,
  onDelete,
  showSender = true,
}: {
  letter: LoveLetter;
  onPress: () => void;
  onDelete?: () => void;
  showSender?: boolean;
}) {
  const colors = useAppColors();
  const isUnread = letter.status === 'DELIVERED';
  const moodEmoji = letter.mood ? (MOOD_EMOJI[letter.mood] ?? '💌') : '💌';
  const hasPhotos = (letter.photos?.length ?? 0) > 0;
  const hasAudio = (letter.audio?.length ?? 0) > 0;
  const firstPhoto = letter.photos?.[0];

  const statusLabel =
    letter.status === 'DRAFT' ? t.loveLetters.draft :
    letter.status === 'DELIVERED' ? t.loveLetters.delivered :
    letter.status === 'READ' ? t.loveLetters.read :
    t.loveLetters.sent;

  const statusColor =
    letter.status === 'DRAFT' ? colors.textLight :
    letter.status === 'DELIVERED' ? colors.primary :
    letter.status === 'READ' ? colors.accent :
    colors.secondary;

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-3xl px-4 py-3.5 flex-row items-center gap-3 mb-3">
      {/* Mood circle */}
      <View
        className="w-12 h-12 rounded-2xl items-center justify-center flex-shrink-0"
        style={{ backgroundColor: isUnread ? colors.primaryMuted : colors.gray100 }}>
        <Text className="text-2xl">{moodEmoji}</Text>
      </View>

      {/* Content */}
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[14px] font-semibold text-textDark flex-1" numberOfLines={1}>
            {letter.title}
          </Text>
          {isUnread ? (
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />
          ) : null}
        </View>
        {showSender && letter.sender ? (
          <Caption className="text-textLight">{letter.sender.name}</Caption>
        ) : null}
        <Body size="sm" className="text-textMid" numberOfLines={1}>
          {letter.content.slice(0, 60)}
        </Body>

        {/* Media indicators */}
        {(hasPhotos || hasAudio) ? (
          <View className="flex-row items-center gap-2 mt-1">
            {hasPhotos && firstPhoto ? (
              <View className="flex-row items-center gap-1">
                <View className="w-5 h-5 rounded overflow-hidden">
                  <FastImage
                    source={{ uri: firstPhoto.url }}
                    style={{ width: 20, height: 20 }}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                </View>
                {(letter.photos?.length ?? 0) > 1 ? (
                  <Caption className="text-textLight">+{(letter.photos?.length ?? 0) - 1}</Caption>
                ) : null}
              </View>
            ) : null}
            {hasAudio ? (
              <View className="flex-row items-center gap-0.5">
                <Music2 size={12} color={colors.textLight} strokeWidth={1.5} />
                <Caption className="text-textLight">{letter.audio?.length}</Caption>
              </View>
            ) : null}
          </View>
        ) : null}

        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-[11px]" style={{ color: statusColor }}>{statusLabel}</Text>
          <Caption className="text-textLight">·</Caption>
          <Caption className="text-textLight">{formatDate(letter.createdAt)}</Caption>
        </View>
      </View>

      {/* Delete button */}
      {onDelete ? (
        <Pressable
          onPress={onDelete}
          className="w-8 h-8 rounded-xl items-center justify-center bg-gray-100">
          <Trash2 size={15} color={colors.textLight} strokeWidth={1.5} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
