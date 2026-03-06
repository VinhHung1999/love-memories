import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import { useLetterReadViewModel } from './useLetterReadViewModel';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import t from '../../locales/en';

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

  return (
    <View className="flex-1 bg-background">
      <CollapsibleHeader
        title={letter.title}
        subtitle={senderName}
        expandedHeight={130}
        collapsedHeight={96}
        scrollY={scrollY}
        renderRight={() => (
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl">{moodEmoji}</Text>
            <Pressable
              onPress={vm.handleBack}
              className="w-10 h-10 rounded-full items-center justify-center bg-white/20">
              <Icon name="arrow-left" size={20} color="#fff" />
            </Pressable>
          </View>
        )}
      />

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 }}>

        {/* Paper card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <Text className="text-xl font-bold text-textDark mb-4">{letter.title}</Text>
          <Text className="text-[15px] text-textMid leading-7">{letter.content}</Text>
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
      </Animated.ScrollView>
    </View>
  );
}
