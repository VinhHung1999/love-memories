import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { Mail, PenLine } from 'lucide-react-native';
import { useAppColors } from '../../navigation/theme';
import { useTranslation } from 'react-i18next';
import { useLettersViewModel } from './useLettersViewModel';
import LetterCard from './components/LetterCard';
import ComposeLetterSheet from './components/ComposeLetterSheet';
import ListHeader from '../../components/ListHeader';
import GlassTabBar from '../../components/GlassTabBar';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { FAB } from '@/components/FAB';

function LettersSkeleton() {
  return (
    <ScrollView scrollEnabled={false} className="flex-1 px-4 pt-4">
      {[0, 1, 2].map(i => (
        <View key={i} className="flex-row items-center gap-3 mb-3 p-4 bg-white dark:bg-darkBgCard rounded-3xl">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <View className="flex-1 gap-2">
            <Skeleton className="w-3/4 h-3.5 rounded-md" />
            <Skeleton className="w-full h-3 rounded-md" />
            <Skeleton className="w-1/3 h-2.5 rounded-md" />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

export default function LettersScreen() {
  const { t } = useTranslation();
  const colors = useAppColors();
  const navigation = useAppNavigation();
  const vm = useLettersViewModel();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const tabs = [
    { key: 'inbox' as const, label: t('loveLetters.inboxTab') },
    { key: 'sent' as const, label: t('loveLetters.sentTab') },
  ];

  return (
    <View className="flex-1 bg-background">
      <ListHeader
        title={t('loveLetters.title')}
        subtitle={t('loveLetters.subtitle')}
        filterBar={
          <GlassTabBar
            tabs={tabs}
            activeTab={vm.activeTab}
            onTabPress={vm.setActiveTab}
          />
        }
      />

      {vm.isLoading ? (
        <LettersSkeleton />
      ) : vm.isEmpty ? (
        <EmptyState
          icon={Mail}
          title={vm.activeTab === 'inbox' ? t('loveLetters.emptyInboxTitle') : t('loveLetters.emptySentTitle')}
          subtitle={vm.activeTab === 'inbox' ? t('loveLetters.emptyInboxSubtitle') : t('loveLetters.emptySentSubtitle')}
          actionLabel={t('loveLetters.compose')}
          onAction={() => { if (vm.handleCompose()) navigation.showBottomSheet(ComposeLetterSheet); }}
        />
      ) : (
        <Animated.FlatList
          data={vm.letters}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.handleRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).duration(350)}>
              <LetterCard
                letter={item}
                onPress={() => vm.handleLetterPress(item.id)}
                onDelete={() => vm.handleDeleteWithConfirm(item.id, navigation.showAlert)}
                showSender={vm.activeTab === 'inbox'}
              />
            </Animated.View>
          )}
        />
      )}

      {/* FAB */}
      <FAB onPress={() => { if (vm.handleCompose()) navigation.showBottomSheet(ComposeLetterSheet); }} icon={PenLine}/>
    </View>
  );
}
