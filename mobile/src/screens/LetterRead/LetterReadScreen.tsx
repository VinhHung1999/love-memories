import React, { useRef, useState } from 'react';
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
import { ChevronLeft, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../navigation/theme';
import { Body, Caption, Heading, Label } from '../../components/Typography';
import { useLetterReadViewModel } from './useLetterReadViewModel';
import VoiceMemoSection from '../MomentDetail/components/VoiceMemoSection';
import type { MomentAudio } from '../../types';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_WIDTH = SCREEN_WIDTH;
const PHOTO_HEIGHT = PHOTO_WIDTH * 0.75; // 4:3 ratio

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
  const flatRef = useRef<FlatList>(null);

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Close button */}
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

        {/* Photo slider */}
        <FlatList
          ref={flatRef}
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

        {/* Page dots */}
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
  const insets = useSafeAreaInsets();
  const vm = useLetterReadViewModel();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const [photoPage, setPhotoPage] = useState(0);
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

  // Format date nicely
  const dateStr = letter.createdAt
    ? new Date(letter.createdAt).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  return (
    <View className="flex-1 bg-baseBg dark:bg-darkBaseBg">
      {/* Custom transparent header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
        }}>
        {/* Back button */}
        <Pressable
          onPress={vm.handleBack}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ChevronLeft size={20} color={colors.primary} strokeWidth={2} />
        </Pressable>

        {/* Title */}
        <Body size="lg" className="font-bodyMedium text-textDark dark:text-darkTextDark flex-1 text-center mx-4" numberOfLines={1}>
          {letter.title}
        </Body>

        {/* Mood emoji badge */}
        {letter.mood ? (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: colors.primaryMuted,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}>
            <Text style={{ fontSize: 14 }}>{moodEmoji}</Text>
          </View>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        className="flex-1">

        {/* Hero photo section */}
        {photos.length > 0 && (
          <View>
            <FlatList
              data={photos}
              keyExtractor={item => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => {
                const newPage = Math.round(e.nativeEvent.contentOffset.x / PHOTO_WIDTH);
                setPhotoPage(newPage);
              }}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => setLightboxIndex(index)}
                  style={{ width: PHOTO_WIDTH, height: PHOTO_HEIGHT }}>
                  <FastImage
                    source={{ uri: item.url }}
                    style={{ width: PHOTO_WIDTH, height: PHOTO_HEIGHT }}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                </Pressable>
              )}
            />

            {/* Page dots */}
            {photos.length > 1 && (
              <View className="flex-row justify-center gap-[5px] py-2">
                {photos.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: i === photoPage ? 14 : 5,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: i === photoPage ? colors.primary : colors.primaryLight,
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Content card */}
        <View
          className="mx-4 mt-4 rounded-3xl bg-white dark:bg-darkBgCard px-6 py-6 mb-4"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}>
          {/* Date caption */}
          {dateStr ? (
            <Caption className="uppercase tracking-[1px] text-textLight dark:text-darkTextLight mb-3">
              {dateStr}
            </Caption>
          ) : null}

          {/* Title */}
          <Heading
            size="lg"
            className="text-textDark dark:text-darkTextDark mb-4"
            style={{ fontFamily: 'BeVietnamPro-Bold', lineHeight: 30 }}>
            {letter.title}
          </Heading>

          {/* Sender row */}
          <View className="flex-row items-center gap-3 mb-4">
            {/* Avatar circle */}
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
                <Caption className="text-primary" style={{ color: colors.primary, fontSize: 11 }}>
                  {moodLabel}
                </Caption>
              </View>
            )}
          </View>

          {/* Divider */}
          <View
            style={{ height: 1, backgroundColor: colors.border, marginBottom: 16, opacity: 0.7 }}
          />

          {/* Letter body */}
          <Body
            size="lg"
            className="text-textDark dark:text-darkTextDark"
            style={{ lineHeight: 28 }}>
            {letter.content}
          </Body>
        </View>

        {/* Voice memo section */}
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

        {/* Bottom padding */}
        <View style={{ height: 96 }} />
      </Animated.ScrollView>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </View>
  );
}
