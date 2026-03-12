import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Heart, ImageIcon, Plus } from 'lucide-react-native';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { Moment } from '../../types';
import { useMomentsViewModel } from './useMomentsViewModel';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import EmptyState from '../../components/EmptyState';
import TagBadge from '../../components/TagBadge';
import Skeleton from '../../components/Skeleton';
import CreateMomentSheet from '../CreateMoment/CreateMomentSheet';

// ── Skeleton ──────────────────────────────────────────────────────────────────

function MomentCardSkeleton() {
  return (
    <View className="bg-white rounded-3xl overflow-hidden mb-3 shadow-sm">
      <Skeleton className="w-full h-[130px]" />
      <View className="px-3 pt-2 pb-3">
        <Skeleton className="w-3/4 h-3.5 rounded-md mb-1.5" />
        <Skeleton className="w-1/2 h-3 rounded-md mb-2" />
        <View className="flex-row gap-1">
          <Skeleton className="w-12 h-[18px] rounded-full" />
          <Skeleton className="w-10 h-[18px] rounded-full" />
        </View>
      </View>
    </View>
  );
}

function MomentsLoadingSkeleton() {
  return (
    <ScrollView scrollEnabled={false} className="flex-1">
      <View className="px-[14px] pb-[100px]" style={{ paddingTop: 44 + 12 }}>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <MomentCardSkeleton />
            <MomentCardSkeleton />
          </View>
          <View className="flex-1 mt-6">
            <MomentCardSkeleton />
            <MomentCardSkeleton />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ── MomentCard ────────────────────────────────────────────────────────────────

function MomentCard({
  moment,
  onPress,
}: {
  moment: Moment;
  onPress: () => void;
}) {
  const colors = useAppColors();
  const coverPhoto = moment.photos[0];

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-accent/15 mb-3"
    >
      {/* Photo */}
      <View className="w-full min-h-[110px]">
        {coverPhoto ? (
          <FastImage
            source={{ uri: coverPhoto.url, priority: FastImage.priority.normal }}
            style={{ width: '100%', height: 130 }}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <View className="w-full h-[110px] items-center justify-center bg-primary/12">
            <ImageIcon size={28} color={colors.textLight} strokeWidth={1.5} />
          </View>
        )}
        {/* Date badge */}
        <View className="absolute top-2 right-2 rounded-xl px-2 py-0.5 bg-white/90">
          <Text className="text-[10px] font-bold text-textDark">
            {formatDate(moment.date)}
          </Text>
        </View>
        {/* Location */}
        {moment.location ? (
          <View className="absolute bottom-2 left-2">
            <Text
              className="text-[9px] font-semibold text-white/95"
              numberOfLines={1}
            >
              📍 {moment.location}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Body */}
      <View className="px-3 pt-2 pb-3">
        <Text
          className="text-sm font-semibold text-textDark leading-snug mb-1.5"
          numberOfLines={2}
        >
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
  const navigation = useAppNavigation();
  const vm = useMomentsViewModel();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  const openCreateForm = () => navigation.showBottomSheet(CreateMomentSheet);

  return (
    <View className="flex-1 bg-gray-50">
      {/* ── Collapsible Header ── */}
      <CollapsibleHeader
        title={t.moments.title}
        subtitle={t.moments.subtitle}
        expandedHeight={140}
        collapsedHeight={96}
        scrollY={scrollY}
        gradientColors={['#FFB4B4', '#C7CEEA', '#B4B8D5']}
        renderRight={() => (
          <TouchableOpacity
            onPress={openCreateForm}
            className="w-10 h-10 rounded-full items-center justify-center bg-white/20"
          >
            <Plus size={22} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
        renderFooter={() => (
          <View className="bg-white/10">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-5"
            >
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
        )}
      />

      {/* ── Tag filter bar — always visible ── */}

      {/* ── Body ── */}
      {vm.isLoading ? (
        <MomentsLoadingSkeleton />
      ) : vm.isEmpty ? (
        <EmptyState
          icon={Heart}
          title={t.moments.emptyTitle}
          subtitle={t.moments.emptySubtitle}
          actionLabel={t.moments.emptyAction}
          onAction={openCreateForm}
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
          }
        >
          <View
            className="px-[14px] pt-3 pb-[100px]"
            style={{ paddingTop: 44 + 12 }}
          >
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

    </View>
  );
}
