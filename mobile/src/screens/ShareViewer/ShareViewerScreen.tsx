import React from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import { useAppColors } from '../../navigation/theme';
import { Body, Heading, Caption } from '../../components/Typography';
import { useShareViewerViewModel } from './useShareViewerViewModel';
import ScreenHeader from '../../components/ScreenHeader';
import FastImage from 'react-native-fast-image';
import TagBadge from '../../components/TagBadge';
import { MapPin, Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
export default function ShareViewerScreen() {
  const { t } = useTranslation();
  const colors = useAppColors();
  const vm = useShareViewerViewModel();
  const scrollY = useSharedValue(0);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.baseBg }}>
      <ScreenHeader
        title={t('shareViewer.title')}
        onBack={vm.handleBack}
        scrollY={scrollY}
        fadeStart={0}
        fadeEnd={0}
      />

      {vm.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : vm.error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Heading size="md" className="text-textMid dark:text-darkTextMid text-center mb-2">
            {t('shareViewer.notFound')}
          </Heading>
          <Body size="sm" className="text-textLight dark:text-darkTextLight text-center">
            {t('shareViewer.notFoundDesc')}
          </Body>
        </View>
      ) : vm.data ? (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Cover image */}
          {vm.coverPhoto ? (
            <FastImage
              source={{ uri: vm.coverPhoto, priority: FastImage.priority.high }}
              style={{ width: '100%', height: 280 }}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View
              className="w-full h-[180px] items-center justify-center"
              style={{ backgroundColor: colors.primaryMuted }}
            >
              <Heart size={48} color={colors.primary} strokeWidth={1.5} />
            </View>
          )}

          <View className="px-4 py-4">
            {/* Type badge */}
            <View className="mb-2">
              <TagBadge label={vm.typeLabel} variant="display" />
            </View>

            {/* Title */}
            <Heading size="xl" className="text-textDark dark:text-darkTextDark mb-2 leading-tight">
              {vm.data.title}
            </Heading>

            {/* Caption */}
            {vm.data.caption ? (
              <Body size="md" className="text-textMid dark:text-darkTextMid italic leading-relaxed mb-3">
                "{vm.data.caption}"
              </Body>
            ) : null}

            {/* Location */}
            {vm.data.location ? (
              <View className="flex-row items-center gap-1.5 mb-3">
                <MapPin size={13} color={colors.textLight} strokeWidth={1.5} />
                <Caption className="text-textLight dark:text-darkTextLight">{vm.data.location}</Caption>
              </View>
            ) : null}

            {/* Tags */}
            {vm.data.tags && vm.data.tags.length > 0 ? (
              <View className="flex-row flex-wrap gap-1.5 mb-3">
                {vm.data.tags.map((tag: string) => (
                  <TagBadge key={tag} label={tag} variant="display" />
                ))}
              </View>
            ) : null}

            {/* Shared by */}
            <View
              className="mt-4 p-3 rounded-2xl"
              style={{ backgroundColor: colors.primaryMuted }}
            >
              <Caption className="text-textMid dark:text-darkTextMid text-center">
                {t('shareViewer.sharedVia')}
              </Caption>
            </View>
          </View>

          <View className="h-20" />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
