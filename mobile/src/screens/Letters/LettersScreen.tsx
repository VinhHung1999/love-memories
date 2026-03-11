import React from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useLettersViewModel } from './useLettersViewModel';
import LetterCard from './components/LetterCard';
import ComposeLetterSheet from './components/ComposeLetterSheet';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';
import { useAppNavigation } from '../../navigation/useAppNavigation';

function LettersSkeleton() {
  return (
    <ScrollView scrollEnabled={false} className="flex-1 px-4 pt-14">
      {[0, 1, 2].map(i => (
        <View key={i} className="flex-row items-center gap-3 mb-3 p-4 bg-white rounded-3xl">
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
  const colors = useAppColors();
  const navigation = useAppNavigation();
  const rootNavigation = useNavigation();
  const vm = useLettersViewModel();
  const canGoBack = rootNavigation.canGoBack();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  return (
    <View className="flex-1 bg-background">
      <CollapsibleHeader
        title={t.loveLetters.title}
        subtitle={t.loveLetters.subtitle}
        expandedHeight={140}
        collapsedHeight={96}
        scrollY={scrollY}
        onBack={canGoBack ? vm.handleBack : undefined}
        renderFooter={() => (
          <View className="flex-row gap-2 px-4 py-2 bg-card">
            <Pressable
              onPress={() => vm.setActiveTab('inbox')}
              className="flex-1 rounded-xl py-2 items-center"
              style={{ backgroundColor: vm.activeTab === 'inbox' ? colors.primary : colors.gray100 }}>
              <Text
                className="text-[13px] font-semibold"
                style={{ color: vm.activeTab === 'inbox' ? '#fff' : colors.textMid }}>
                {t.loveLetters.inboxTab}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => vm.setActiveTab('sent')}
              className="flex-1 rounded-xl py-2 items-center"
              style={{ backgroundColor: vm.activeTab === 'sent' ? colors.primary : colors.gray100 }}>
              <Text
                className="text-[13px] font-semibold"
                style={{ color: vm.activeTab === 'sent' ? '#fff' : colors.textMid }}>
                {t.loveLetters.sentTab}
              </Text>
            </Pressable>
          </View>
        )}
      />

      {vm.isLoading ? (
        <LettersSkeleton />
      ) : vm.isEmpty ? (
        <EmptyState
          icon="email-heart-outline"
          title={vm.activeTab === 'inbox' ? t.loveLetters.emptyInboxTitle : t.loveLetters.emptySentTitle}
          subtitle={vm.activeTab === 'inbox' ? t.loveLetters.emptyInboxSubtitle : t.loveLetters.emptySentSubtitle}
          actionLabel={t.loveLetters.compose}
          onAction={() => navigation.showBottomSheet(ComposeLetterSheet)}
        />
      ) : (
        <Animated.FlatList
          data={vm.letters}
          keyExtractor={item => item.id}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.handleRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 100 }}
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
      <Pressable
        onPress={() => navigation.showBottomSheet(ComposeLetterSheet)}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: colors.primary }}>
        <Icon name="pencil-plus-outline" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}
