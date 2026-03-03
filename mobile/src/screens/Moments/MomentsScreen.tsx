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
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { Moment } from '../../types';
import { useMomentsViewModel } from './useMomentsViewModel';
import CreateMomentSheet from '../CreateMoment/CreateMomentSheet';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import EmptyState from '../../components/EmptyState';
import TagBadge from '../../components/TagBadge';

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
              <TagBadge key={tag} label={tag} variant="display" />
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MomentsScreen() {
  const colors = useAppColors();
  const vm = useMomentsViewModel();
  const sheetRef = useRef<BottomSheetModal>(null);
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  const openCreateSheet = () => sheetRef.current?.present();

  return (
    <View className="flex-1 bg-gray-50">

      {/* ── Collapsible Header ── */}
      <CollapsibleHeader
        title={t.moments.title}
        subtitle={t.moments.subtitle}
        expandedHeight={100}
        collapsedHeight={56}
        scrollY={scrollY}
        renderRight={() => (
          <TouchableOpacity
            onPress={openCreateSheet}
            className="w-10 h-10 rounded-full items-center justify-center bg-primary">
            <Icon name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      />

      {/* ── Tag filter bar — always visible ── */}
      <View className="bg-[#FFF5EE]">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5">
          <View className="flex-row gap-2 py-2 pr-5">
            <TagBadge
              label={t.moments.allFilter}
              active={!vm.activeTag}
              onPress={() => vm.handleTagPress(null)}
            />
            {vm.allTags.map(tag => (
              <TagBadge
                key={tag}
                label={tag}
                active={vm.activeTag === tag}
                onPress={() => vm.handleTagPress(tag)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* ── Body ── */}
      {vm.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : vm.isEmpty ? (
        <EmptyState
          icon="heart-multiple-outline"
          title={t.moments.emptyTitle}
          subtitle={t.moments.emptySubtitle}
          actionLabel={t.moments.emptyAction}
          onAction={openCreateSheet}
        />
      ) : (
        <Animated.ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.handleRefresh}
              tintColor={colors.primary}
            />
          }>
          <View className="px-[14px] pt-3 pb-[100px]" style={{ paddingTop: 44 + 12 }}>
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
        </Animated.ScrollView>
      )}

      {/* ── Create Sheet ── */}
      <CreateMomentSheet
        ref={sheetRef}
        momentId={null}
        onSuccess={vm.handleRefresh}
      />
    </View>
  );
}
