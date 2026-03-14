import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Body, Heading } from '../../components/Typography';
import FastImage from 'react-native-fast-image';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useAppColors } from '../../navigation/theme';
import { useLetterReadViewModel } from './useLetterReadViewModel';
import ScreenHeader from '../../components/ScreenHeader';
import VoiceMemoSection from '../MomentDetail/components/VoiceMemoSection';
import t from '../../locales/en';
import type { MomentAudio } from '../../types';

const MOOD_EMOJI: Record<string, string> = {
  love: '❤️', happy: '😊', miss: '🥺', grateful: '🙏', playful: '😄', romantic: '🌹',
};

export default function LetterReadScreen() {
  const colors = useAppColors();
  const vm = useLetterReadViewModel();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  if (vm.isLoading || !vm.letter) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { letter } = vm;
  const moodEmoji = letter.mood ? (MOOD_EMOJI[letter.mood] ?? '💌') : '💌';
  const senderName = letter.sender?.name ?? '';
  // LetterAudio and MomentAudio share the same shape — safe cast
  const audios = (letter.audio ?? []) as unknown as MomentAudio[];

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={letter.title}
        subtitle={senderName}
        onBack={vm.handleBack}
        right={<Text className="text-2xl">{moodEmoji}</Text>}
        scrollY={scrollY}
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 }}>

        {/* Paper card */}
        <View className="bg-white rounded-3xl p-6 mb-4">
          <Heading size="lg" className="text-textDark mb-4">{letter.title}</Heading>
          <Body size="md" className="leading-7">{letter.content}</Body>
        </View>

        {/* Photos */}
        {letter.photos && letter.photos.length > 0 ? (
          <View className="mb-4">
            <Text className="text-[12px] font-bold text-textLight uppercase tracking-wider mb-2 px-1">
              {t.loveLetters.photosLabel}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
              <View className="flex-row gap-2 px-1">
                {letter.photos.map(photo => (
                  <View key={photo.id} className="w-28 h-28 rounded-2xl overflow-hidden">
                    <FastImage
                      source={{ uri: photo.url }}
                      style={{ width: 112, height: 112 }}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}

        {/* Voice memo */}
        <VoiceMemoSection
          audios={audios}
          playingAudioId={vm.playingAudioId}
          audioProgress={vm.audioProgress}
          onPlay={vm.handlePlayAudio}
          onStop={vm.handleStopAudio}
        />
      </Animated.ScrollView>
    </View>
  );
}
