import React from 'react';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { Moment } from '../../types';
import { useMomentsViewModel } from './useMomentsViewModel';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── MomentCard ────────────────────────────────────────────────────────────────

function MomentCard({ moment, onPress }: { moment: Moment; onPress: () => void }) {
  const colors = useAppColors();
  const coverPhoto = moment.photos[0];

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl overflow-hidden shadow-sm mb-3"
      style={{ shadowColor: colors.textDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 }}>
      {/* Photo */}
      <View className="w-full bg-primaryMuted" style={{ minHeight: 120 }}>
        {coverPhoto ? (
          <Image
            source={{ uri: coverPhoto.url }}
            className="w-full"
            style={{ height: 140, resizeMode: 'cover' }}
          />
        ) : (
          <View
            className="w-full items-center justify-center"
            style={{ height: 120, backgroundColor: colors.primaryMuted }}>
            <Icon name="image-outline" size={32} color={colors.textLight} />
          </View>
        )}
        {/* Date badge */}
        <View
          className="absolute top-2 right-2 rounded-xl px-2 py-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}>
          <Text className="text-[10px] font-semibold text-textDark">{formatDate(moment.date)}</Text>
        </View>
        {/* Location */}
        {moment.location ? (
          <View
            className="absolute bottom-2 left-2 flex-row items-center gap-1"
            style={{ backgroundColor: 'transparent' }}>
            <Text className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.9)', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
              📍 {moment.location}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Body */}
      <View className="px-3 pt-2 pb-3">
        <Text className="text-sm font-semibold text-textDark leading-snug mb-1" numberOfLines={2}>
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
      <Text className="text-xl font-semibold text-textDark text-center mb-2">
        {t.moments.emptyTitle}
      </Text>
      <Text className="text-sm text-textMid text-center mb-6 leading-relaxed">
        {t.moments.emptySubtitle}
      </Text>
      <TouchableOpacity
        onPress={onCreatePress}
        className="px-6 py-3 rounded-2xl"
        style={{ backgroundColor: colors.primary }}>
        <Text className="text-white font-semibold text-sm">{t.moments.emptyAction}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MomentsScreen() {
  const colors = useAppColors();
  const vm = useMomentsViewModel();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FDF8F5' }}>
      {/* Header */}
      <View className="px-5 pt-2 pb-0">
        <View className="flex-row items-start justify-between mb-1">
          <View>
            <Text className="text-xs text-textLight font-normal tracking-wide">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text className="text-3xl font-bold text-textDark tracking-tight leading-tight">
              <Text style={{ color: colors.primary }}>Our</Text>
              {'\n'}
              {t.moments.title.replace('Our ', '')}
            </Text>
          </View>
        </View>

        {/* Tag filter bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 -mx-5 px-5"
          contentContainerStyle={{ paddingRight: 20, gap: 8, flexDirection: 'row', paddingBottom: 12 }}>
          {/* All filter */}
          <Pressable
            onPress={() => vm.handleTagPress(null)}
            className="px-4 py-[6px] rounded-full"
            style={{
              backgroundColor: !vm.activeTag ? colors.textDark : colors.white,
              borderWidth: !vm.activeTag ? 0 : 1,
              borderColor: 'rgba(196,168,168,0.3)',
            }}>
            <Text className="text-xs font-semibold" style={{ color: !vm.activeTag ? '#fff' : colors.textMid }}>
              {t.moments.allFilter}
            </Text>
          </Pressable>
          {vm.allTags.map(tag => (
            <Pressable
              key={tag}
              onPress={() => vm.handleTagPress(tag)}
              className="px-4 py-[6px] rounded-full"
              style={{
                backgroundColor: vm.activeTag === tag ? colors.textDark : colors.white,
                borderWidth: vm.activeTag === tag ? 0 : 1,
                borderColor: 'rgba(196,168,168,0.3)',
              }}>
              <Text className="text-xs font-semibold" style={{ color: vm.activeTag === tag ? '#fff' : colors.textMid }}>
                {tag}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Body */}
      {vm.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : vm.isEmpty ? (
        <EmptyState onCreatePress={vm.handleCreatePress} />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.handleRefresh}
              tintColor={colors.primary}
            />
          }>
          <View className="flex-row gap-3">
            {/* Left column */}
            <View className="flex-1">
              {vm.leftColumn.map(moment => (
                <MomentCard
                  key={moment.id}
                  moment={moment}
                  onPress={() => vm.handleMomentPress(moment.id)}
                />
              ))}
            </View>
            {/* Right column — offset down for masonry feel */}
            <View className="flex-1 mt-5">
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

      {/* FAB */}
      <TouchableOpacity
        onPress={vm.handleCreatePress}
        className="absolute right-5 bottom-24 w-14 h-14 rounded-2xl items-center justify-center"
        style={{
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.45,
          shadowRadius: 16,
          elevation: 8,
        }}>
        <Icon name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
