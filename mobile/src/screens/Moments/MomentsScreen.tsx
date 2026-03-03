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
      <View className="w-full" style={{ minHeight: 110 }}>
        {coverPhoto ? (
          <Image
            source={{ uri: coverPhoto.url }}
            className="w-full"
            style={{ height: 130, resizeMode: 'cover' }}
          />
        ) : (
          <View
            className="w-full items-center justify-center"
            style={{ height: 110, backgroundColor: colors.primaryMuted }}>
            <Icon name="image-outline" size={28} color={colors.textLight} />
          </View>
        )}
        {/* Date badge */}
        <View
          className="absolute top-2 right-2 rounded-xl px-2 py-0.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
          <Text className="text-[10px] font-bold text-textDark">{formatDate(moment.date)}</Text>
        </View>
        {/* Location */}
        {moment.location ? (
          <View className="absolute bottom-2 left-2">
            <Text
              className="text-[9px] font-semibold"
              style={{
                color: 'rgba(255,255,255,0.95)',
                textShadowColor: 'rgba(0,0,0,0.6)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
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
              <View key={tag} className="px-2 py-[2px] rounded-lg" style={{ backgroundColor: colors.primaryMuted }}>
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
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-5"
        style={{ backgroundColor: colors.primaryMuted }}>
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
        className="px-6 py-3 rounded-2xl"
        style={{ backgroundColor: colors.primary }}>
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
        className="pb-2 pt-2">
        <View className="flex-row items-center justify-between px-5 pb-2">
          <View>
            <Text className="text-xs text-textLight font-normal tracking-wide">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text className="text-2xl font-bold text-textDark tracking-tight">
              <Text style={{ color: colors.primary }}>Our</Text> {t.moments.title.replace('Our ', '')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={openCreateSheet}
            className="w-10 h-10 rounded-2xl items-center justify-center"
            style={{ backgroundColor: colors.primary }}>
            <Icon name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tag filter bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5 px-5"
          contentContainerStyle={{ paddingRight: 20, gap: 8, flexDirection: 'row', paddingBottom: 12 }}>
          <Pressable
            onPress={() => vm.handleTagPress(null)}
            className="px-4 py-[5px] rounded-full"
            style={{
              backgroundColor: !vm.activeTag ? colors.primary : 'rgba(255,255,255,0.7)',
              borderWidth: !vm.activeTag ? 0 : 1,
              borderColor: 'rgba(196,168,168,0.25)',
            }}>
            <Text className="text-xs font-semibold" style={{ color: !vm.activeTag ? '#fff' : colors.textMid }}>
              {t.moments.allFilter}
            </Text>
          </Pressable>
          {vm.allTags.map(tag => (
            <Pressable
              key={tag}
              onPress={() => vm.handleTagPress(tag)}
              className="px-4 py-[5px] rounded-full"
              style={{
                backgroundColor: vm.activeTag === tag ? colors.primary : 'rgba(255,255,255,0.7)',
                borderWidth: vm.activeTag === tag ? 0 : 1,
                borderColor: 'rgba(196,168,168,0.25)',
              }}>
              <Text className="text-xs font-semibold" style={{ color: vm.activeTag === tag ? '#fff' : colors.textMid }}>
                {tag}
              </Text>
            </Pressable>
          ))}
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
          contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.handleRefresh}
              tintColor={colors.primary}
            />
          }>
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
