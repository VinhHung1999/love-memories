import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Caption, Label } from '../../components/Typography';
import FastImage from 'react-native-fast-image';
import { Plus, Star, Utensils } from 'lucide-react-native';

import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useAppColors } from '../../navigation/theme';
import { useTranslation } from 'react-i18next';
import type { FoodSpot } from '../../types';
import { useFoodSpotsViewModel } from './useFoodSpotsViewModel';
import ListHeader from '../../components/ListHeader';
import EmptyState from '../../components/EmptyState';
import TagBadge from '../../components/TagBadge';
import Skeleton from '../../components/Skeleton';
import CreateFoodSpotSheet from '../CreateFoodSpot/CreateFoodSpotSheet';

// ── Skeleton ──────────────────────────────────────────────────────────────────

function FoodSpotCardSkeleton() {
  return (
    <View className="bg-white dark:bg-darkBgCard rounded-3xl overflow-hidden mb-3">
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
      <View className="px-[14px] pb-[100px] pt-3">
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
      className="bg-white dark:bg-darkBgCard rounded-3xl overflow-hidden border border-borderSoft dark:border-darkBorder mb-3">

      {/* Photo / placeholder */}
      <View className="w-full min-h-[110px]">
        {coverPhoto ? (
          <FastImage
            source={{ uri: coverPhoto.url, priority: FastImage.priority.normal }}
            style={{ width: '100%', height: 130 }}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <View className="w-full h-[110px] items-center justify-center bg-secondary/10">
            <Utensils size={28} color={colors.secondary} strokeWidth={1.5} />
          </View>
        )}

        {/* Rating + Price overlay */}
        <View className="absolute top-2 left-2 flex-row gap-1.5">
          <View className="rounded-xl px-2 py-0.5 bg-black/50 flex-row items-center">
            <Star size={9} color={colors.starRating} strokeWidth={1.5} />
            <Caption className="font-bold text-white ml-0.5">{spot.rating}</Caption>
          </View>
          <View className="rounded-xl px-2 py-0.5 bg-black/50">
            <Caption className="font-bold text-white">{priceLabel(spot.priceRange)}</Caption>
          </View>
        </View>

        {/* Location overlay */}
        {spot.location ? (
          <View className="absolute bottom-2 left-2 right-2">
            <Caption className="font-semibold text-white/95" numberOfLines={1}>
              📍 {spot.location}
            </Caption>
          </View>
        ) : null}
      </View>

      {/* Body */}
      <View className="px-3 pt-2 pb-3">
        <Label className="text-textDark dark:text-darkTextDark leading-snug mb-1.5" numberOfLines={2}>
          {spot.name}
        </Label>

        {/* Stars row */}
        <View className="flex-row items-center gap-1 mb-1.5">
          {[1, 2, 3, 4, 5].map(i => (
            <Star
              key={i}
              size={10}
              color={colors.starRating}
              strokeWidth={1.5}
              fill={i <= Math.round(spot.rating) ? colors.starRating : 'none'}
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
  const { t } = useTranslation();
  const colors = useAppColors();
  const navigation = useAppNavigation();
  const vm = useFoodSpotsViewModel();

  return (
    <View className="flex-1 bg-baseBg dark:bg-darkBaseBg">
      <ListHeader
        title={t('foodSpots.title')}
        subtitle={t('foodSpots.subtitle')}
        onBack={navigation.goBack}
        right={
          <Pressable
            onPress={() => navigation.showBottomSheet(CreateFoodSpotSheet)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}>
            <Plus size={22} color="#fff" strokeWidth={1.5} />
          </Pressable>
        }
        filterBar={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-5">
            <View className="flex-row gap-2 py-2 pr-5">
              <TagBadge
                label={t('foodSpots.allFilter')}
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
        }
      />

      {vm.isLoading ? (
        <FoodSpotsLoadingSkeleton />
      ) : vm.isEmpty ? (
        <EmptyState
          icon={Utensils}
          title={t('foodSpots.emptyTitle')}
          subtitle={t('foodSpots.emptySubtitle')}
          actionLabel={t('foodSpots.emptyAction')}
          onAction={() => navigation.showBottomSheet(CreateFoodSpotSheet)}
        />
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.handleRefresh}
              tintColor={colors.secondary}
            />
          }>
          <View className="px-[14px] pt-3 pb-[100px]">
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
        </ScrollView>
      )}

    </View>
  );
}
