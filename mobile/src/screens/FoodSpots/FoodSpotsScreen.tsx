import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { FoodSpot } from '../../types';
import { useFoodSpotsViewModel } from './useFoodSpotsViewModel';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import EmptyState from '../../components/EmptyState';
import TagBadge from '../../components/TagBadge';
import Skeleton from '../../components/Skeleton';
import CreateFoodSpotSheet from '../CreateFoodSpot/CreateFoodSpotSheet';

// ── Skeleton ──────────────────────────────────────────────────────────────────

function FoodSpotCardSkeleton() {
  return (
    <View className="bg-white rounded-3xl overflow-hidden mb-3 shadow-sm">
      <Skeleton className="w-full h-[130px]" />
      <View className="px-3 pt-2 pb-3">
        <Skeleton className="w-3/4 h-3.5 rounded-md mb-1.5" />
        <Skeleton className="w-1/3 h-2.5 rounded-md mb-2" />
        <View className="flex-row gap-1">
          <Skeleton className="w-12 h-[18px] rounded-full" />
          <Skeleton className="w-10 h-[18px] rounded-full" />
        </View>
      </View>
    </View>
  );
}

function FoodSpotsLoadingSkeleton() {
  return (
    <ScrollView scrollEnabled={false} className="flex-1">
      <View className="px-[14px] pb-[100px] pt-14">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FoodSpotCardSkeleton />
            <FoodSpotCardSkeleton />
          </View>
          <View className="flex-1 mt-6">
            <FoodSpotCardSkeleton />
            <FoodSpotCardSkeleton />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function priceLabel(priceRange: number): string {
  return '$'.repeat(Math.max(1, Math.min(4, priceRange)));
}

// ── FoodSpotCard ──────────────────────────────────────────────────────────────

function FoodSpotCard({ spot, onPress }: { spot: FoodSpot; onPress: () => void }) {
  const colors = useAppColors();
  const coverPhoto = spot.photos[0];

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-3xl overflow-hidden shadow-sm mb-3">

      {/* Photo / placeholder */}
      <View className="w-full min-h-[110px]">
        {coverPhoto ? (
          <FastImage
            source={{ uri: coverPhoto.url, priority: FastImage.priority.normal }}
            className="w-full h-[130px]"
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <View className="w-full h-[110px] items-center justify-center bg-secondary/10">
            <Icon name="food-fork-drink" size={28} color={colors.secondary} />
          </View>
        )}

        {/* Rating + Price overlay */}
        <View className="absolute top-2 left-2 flex-row gap-1.5">
          <View className="rounded-xl px-2 py-0.5 bg-black/50 flex-row items-center">
            <Icon name="star" size={9} color={colors.starRating} />
            <Text className="text-[10px] font-bold text-white ml-0.5">{spot.rating}</Text>
          </View>
          <View className="rounded-xl px-2 py-0.5 bg-black/50">
            <Text className="text-[10px] font-bold text-white">{priceLabel(spot.priceRange)}</Text>
          </View>
        </View>

        {/* Location overlay */}
        {spot.location ? (
          <View className="absolute bottom-2 left-2 right-2">
            <Text className="text-[9px] font-semibold text-white/95" numberOfLines={1}>
              📍 {spot.location}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Body */}
      <View className="px-3 pt-2 pb-3">
        <Text
          className="text-sm font-semibold text-textDark leading-snug mb-1.5"
          numberOfLines={2}>
          {spot.name}
        </Text>

        {/* Stars row */}
        <View className="flex-row items-center gap-1 mb-1.5">
          {[1, 2, 3, 4, 5].map(i => (
            <Icon
              key={i}
              name={i <= Math.round(spot.rating) ? 'star' : 'star-outline'}
              size={10}
              color={colors.starRating}
            />
          ))}
        </View>

        {spot.tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-1">
            {spot.tags.slice(0, 2).map(tag => (
              <TagBadge key={tag} label={tag} variant="display" />
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function FoodSpotsScreen() {
  const colors = useAppColors();
  const navigation = useAppNavigation();
  const vm = useFoodSpotsViewModel();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  return (
    <View className="flex-1 bg-gray-50">
      <CollapsibleHeader
        title={t.foodSpots.title}
        subtitle={t.foodSpots.subtitle}
        expandedHeight={140}
        collapsedHeight={96}
        scrollY={scrollY}
        renderRight={() => (
          <Pressable
            onPress={() => navigation.showBottomSheet(CreateFoodSpotSheet)}
            className="w-10 h-10 rounded-full items-center justify-center bg-secondary">
            <Icon name="plus" size={22} color="#fff" />
          </Pressable>
        )}
        renderFooter={() => (
          <View className="bg-[#FFF8F3]">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-5">
              <View className="flex-row gap-2 py-2 pr-5">
                <TagBadge
                  label={t.foodSpots.allFilter}
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

      {vm.isLoading ? (
        <FoodSpotsLoadingSkeleton />
      ) : vm.isEmpty ? (
        <EmptyState
          icon="food-fork-drink"
          title={t.foodSpots.emptyTitle}
          subtitle={t.foodSpots.emptySubtitle}
          actionLabel={t.foodSpots.emptyAction}
          onAction={() => navigation.showBottomSheet(CreateFoodSpotSheet)}
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
              tintColor={colors.secondary}
            />
          }>
          {/* pt-14 = 56px = scrollRange(44) + gap(12) */}
          <View className="px-[14px] pt-14 pb-[100px]">
            <View className="flex-row gap-3">
              <View className="flex-1">
                {vm.leftColumn.map(spot => (
                  <FoodSpotCard
                    key={spot.id}
                    spot={spot}
                    onPress={() => vm.handleSpotPress(spot.id)}
                  />
                ))}
              </View>
              <View className="flex-1 mt-6">
                {vm.rightColumn.map(spot => (
                  <FoodSpotCard
                    key={spot.id}
                    spot={spot}
                    onPress={() => vm.handleSpotPress(spot.id)}
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
