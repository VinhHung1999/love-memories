import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import { useLetterReadViewModel } from './useLetterReadViewModel';
import t from '../../locales/en';

const MOOD_EMOJI: Record<string, string> = {
  love: '❤️', happy: '😊', miss: '🥺', grateful: '🙏', playful: '😄', romantic: '🌹',
};

export default function LetterReadScreen() {
  const colors = useAppColors();
  const vm = useLetterReadViewModel();

  if (vm.isLoading || !vm.letter) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { letter } = vm;
  const moodEmoji = letter.mood ? (MOOD_EMOJI[letter.mood] ?? '💌') : '💌';

  return (
    <LinearGradient
      colors={['#FFF0F5', '#FFF8F0', '#F5F0FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3">
          <Pressable
            onPress={vm.handleBack}
            className="w-9 h-9 rounded-xl items-center justify-center"
            style={{ backgroundColor: colors.primaryMuted }}>
            <Icon name="arrow-left" size={18} color={colors.primary} />
          </Pressable>
          {letter.sender ? (
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-textDark">{letter.sender.name}</Text>
              <Text className="text-[11px] text-textLight">
                {new Date(letter.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          ) : null}
          <Text className="text-3xl">{moodEmoji}</Text>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
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
                        className="w-full h-full"
                        resizeMode={FastImage.resizeMode.cover}
                      />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
