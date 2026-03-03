import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { Moment } from '../../types';
import { useMomentsViewModel } from './useMomentsViewModel';
import CreateMomentSheet from '../CreateMoment/CreateMomentSheet';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── MomentCard ────────────────────────────────────────────────────────────────

function MomentCard({ moment, onPress }: { moment: Moment; onPress: () => void }) {
  const colors = useAppColors();
  const coverPhoto = moment.photos[0];

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-3xl overflow-hidden shadow-sm mb-3">
      {/* Photo */}
      <View className="w-full min-h-[110px]">
        {coverPhoto ? (
          <Image
            source={{ uri: coverPhoto.url }}
            className="w-full h-[130px]"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-[110px] items-center justify-center bg-primary/12">
            <Icon name="image-outline" size={28} color={colors.textLight} />
          </View>
        )}
        {/* Date badge */}
        <View className="absolute top-2 right-2 rounded-xl px-2 py-0.5 bg-white/90">
          <Text className="text-[10px] font-bold text-textDark">{formatDate(moment.date)}</Text>
        </View>
        {/* Location */}
        {moment.location ? (
          <View className="absolute bottom-2 left-2">
            <Text
              className="text-[9px] font-semibold text-white/95"
              numberOfLines={1}>
              📍 {moment.location}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Body */}
      <View className="px-3 pt-2 pb-3">
        <Text className="text-sm font-semibold text-textDark leading-snug mb-1.5" numberOfLines={2}>
          {moment.title}
        </Text>
        {moment.tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-1">
            {moment.tags.slice(0, 2).map(tag => (
              <View key={tag} className="px-2 py-[2px] rounded-lg bg-primary/12">
                <Text className="text-[10px] font-medium text-primary">{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onCreatePress }: { onCreatePress: () => void }) {
  const colors = useAppColors();
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 rounded-full items-center justify-center mb-5 bg-primary/12">
        <Icon name="heart-multiple-outline" size={36} color={colors.primary} />
      </View>
      <Text className="text-xl font-bold text-textDark text-center mb-2">
        {t.moments.emptyTitle}
      </Text>
      <Text className="text-sm text-textMid text-center mb-6 leading-relaxed">
        {t.moments.emptySubtitle}
      </Text>
      <Pressable
        onPress={onCreatePress}
        className="px-6 py-3 rounded-2xl bg-primary">
        <Text className="text-white font-semibold text-sm">{t.moments.emptyAction}</Text>
      </Pressable>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MomentsScreen() {
  const colors = useAppColors();
  const vm = useMomentsViewModel();
  const sheetRef = useRef<BottomSheetModal>(null);

  const openCreateSheet = () => sheetRef.current?.present();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={['#FFE4EA', '#FFF0F6', '#FFF5EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pb-3 pt-2">
        <View className="flex-row items-center justify-between px-5 pb-3">
          <View>
            <Text className="text-[11px] font-semibold text-primary tracking-[1.5px] uppercase mb-0.5">
              ♥ Our Story
            </Text>
            <Text className="text-2xl font-bold text-textDark tracking-tight">
              {t.moments.title}
            </Text>
          </View>
          <TouchableOpacity
            onPress={openCreateSheet}
            className="w-10 h-10 rounded-full items-center justify-center bg-primary">
            <Icon name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tag filter bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5 px-5">
          <View className="flex-row gap-2 pb-3 pr-5">
            <Pressable
              onPress={() => vm.handleTagPress(null)}
              className={`px-4 py-[5px] rounded-full ${
                !vm.activeTag ? 'bg-primary' : 'bg-white/70 border border-[rgba(196,168,168,0.25)]'
              }`}>
              <Text className={`text-xs font-semibold ${!vm.activeTag ? 'text-white' : 'text-textMid'}`}>
                {t.moments.allFilter}
              </Text>
            </Pressable>
            {vm.allTags.map(tag => (
              <Pressable
                key={tag}
                onPress={() => vm.handleTagPress(tag)}
                className={`px-4 py-[5px] rounded-full ${
                  vm.activeTag === tag ? 'bg-primary' : 'bg-white/70 border border-[rgba(196,168,168,0.25)]'
                }`}>
                <Text className={`text-xs font-semibold ${vm.activeTag === tag ? 'text-white' : 'text-textMid'}`}>
                  {tag}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* ── Body ── */}
      {vm.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : vm.isEmpty ? (
        <EmptyState onCreatePress={openCreateSheet} />
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.handleRefresh}
              tintColor={colors.primary}
            />
          }>
          <View className="px-[14px] pt-3 pb-[100px]">
            <View className="flex-row gap-3">
              <View className="flex-1">
                {vm.leftColumn.map(moment => (
                  <MomentCard
                    key={moment.id}
                    moment={moment}
                    onPress={() => vm.handleMomentPress(moment.id)}
                  />
                ))}
              </View>
              <View className="flex-1 mt-6">
                {vm.rightColumn.map(moment => (
                  <MomentCard
                    key={moment.id}
                    moment={moment}
                    onPress={() => vm.handleMomentPress(moment.id)}
                  />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── Create Sheet ── */}
      <CreateMomentSheet
        ref={sheetRef}
        momentId={null}
        onSuccess={vm.handleRefresh}
      />
    </SafeAreaView>
  );
}
