import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { Mail, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../navigation/theme';
import { Body, Caption, Label } from '../../components/Typography';
import { useLetterReadViewModel } from './useLetterReadViewModel';
import VoiceMemoSection from '../MomentDetail/components/VoiceMemoSection';
import type { MomentAudio } from '../../types';
import DetailScreenLayout from '../../components/DetailScreenLayout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOOD_EMOJI: Record<string, string> = {
  love: '❤️', happy: '😊', miss: '🥺', grateful: '🙏', playful: '😄', romantic: '🌹',
};

const MOOD_LABELS: Record<string, string> = {
  love: 'Love', happy: 'Happy', miss: 'Missing you', grateful: 'Grateful',
  playful: 'Playful', romantic: 'Romantic',
};

// ── Lightbox Modal ────────────────────────────────────────────────────────────

function PhotoLightbox({
  photos,
  initialIndex,
  onClose,
}: {
  photos: { id: string; url: string }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute',
            top: insets.top + 12,
            right: 16,
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <X size={18} color="#fff" strokeWidth={2} />
        </TouchableOpacity>

        <FlatList
          data={photos}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={e => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(newIndex);
          }}
          renderItem={({ item }) => (
            <View style={{ width: SCREEN_WIDTH, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <FastImage
                source={{ uri: item.url }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                resizeMode={FastImage.resizeMode.contain}
              />
            </View>
          )}
        />

        {photos.length > 1 && (
          <View
            style={{
              position: 'absolute',
              bottom: insets.bottom + 16,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
            }}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === currentIndex ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function LetterReadScreen() {
  const { t } = useTranslation();
  const colors = useAppColors();
  const vm = useLetterReadViewModel();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (vm.isLoading || !vm.letter) {
    return (
      <View className="flex-1 items-center justify-center bg-baseBg dark:bg-darkBaseBg">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { letter } = vm;
  const moodEmoji = letter.mood ? (MOOD_EMOJI[letter.mood] ?? '💌') : '💌';
  const moodLabel = letter.mood ? (MOOD_LABELS[letter.mood] ?? '') : '';
  const senderName = letter.sender?.name ?? '';
  const senderAvatar = letter.sender?.avatar ?? null;
  const audios = (letter.audio ?? []) as unknown as MomentAudio[];
  const photos = letter.photos ?? [];

  const dateStr = letter.createdAt
    ? new Date(letter.createdAt).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  return (
    <>
      <DetailScreenLayout
        title={letter.title}
        coverSubtitle={senderName}
        coverImageUri={photos[0]?.url}
        icon={Mail}
        onBack={vm.handleBack}
      >
        {/* Thumbnail strip for 2+ photos */}
        {photos.length >= 2 && (
          <View className="mx-4 mt-4">
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={photos}
              keyExtractor={item => item.id}
              ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
              renderItem={({ item, index }) => (
                <Pressable onPress={() => setLightboxIndex(index)}>
                  <FastImage
                    source={{ uri: item.url }}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      borderWidth: index === 0 ? 2 : 0,
                      borderColor: colors.primary,
                    }}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Content */}
        <View className="mx-4 mt-4 mb-2">

          {/* Date */}
          {dateStr ? (
            <Caption className="uppercase tracking-[1px] text-textLight dark:text-darkTextLight mb-3">
              {dateStr}
            </Caption>
          ) : null}

          {/* Sender row */}
          <View className="flex-row items-center gap-3 mb-4">
            <View
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: colors.primaryMuted,
                alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
              {senderAvatar ? (
                <FastImage
                  source={{ uri: senderAvatar }}
                  style={{ width: 36, height: 36 }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : (
                <Text style={{ fontSize: 18 }}>💌</Text>
              )}
            </View>
            <View className="flex-1">
              <Label className="text-textDark dark:text-darkTextDark">
                {senderName}
              </Label>
              <Caption className="text-textLight dark:text-darkTextLight">
                {t('loveLetters.sentYouALetter', 'sent you a letter')}
              </Caption>
            </View>

            {/* Mood badge */}
            {letter.mood && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: colors.primaryMuted,
                }}>
                <Text style={{ fontSize: 12 }}>{moodEmoji}</Text>
                <Caption style={{ color: colors.primary, fontSize: 11 }}>
                  {moodLabel}
                </Caption>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16, opacity: 0.7 }} />

          {/* Letter body */}
          <Body
            size="lg"
            className="text-textDark dark:text-darkTextDark"
            style={{ lineHeight: 28 }}>
            {letter.content}
          </Body>
        </View>

        {/* Voice memo */}
        {audios.length > 0 && (
          <View className="mx-4 mb-4">
            <VoiceMemoSection
              audios={audios}
              playingAudioId={vm.playingAudioId}
              audioProgress={vm.audioProgress}
              onPlay={vm.handlePlayAudio}
              onStop={vm.handleStopAudio}
            />
          </View>
        )}

        <View className="h-20" />
      </DetailScreenLayout>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
