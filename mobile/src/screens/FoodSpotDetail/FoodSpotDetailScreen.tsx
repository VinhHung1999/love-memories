import React from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Heading, Body, Caption } from '../../components/Typography';
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Images, MapPin, Share2, Star, Utensils } from 'lucide-react-native';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useFoodSpotDetailViewModel } from './useFoodSpotDetailViewModel';
import Skeleton from '../../components/Skeleton';
import { Card } from '../../components/Card';
import TagBadge from '../../components/TagBadge';
import CreateFoodSpotSheet from '../CreateFoodSpot/CreateFoodSpotSheet';
import DetailScreenLayout from '../../components/DetailScreenLayout';

// ── Loading skeleton ───────────────────────────────────────────────────────────

function FoodSpotDetailLoadingSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Skeleton className="w-full h-[280px]" />
      <View className="h-4" />
      <View className="bg-white dark:bg-darkBgCard mx-4 rounded-3xl px-4 py-4 mb-3">
        <Skeleton className="w-3/4 h-5 rounded-md mb-2" />
        <Skeleton className="w-1/3 h-3 rounded-md mb-3" />
        <Skeleton className="w-full h-3 rounded-md mb-1" />
        <Skeleton className="w-2/3 h-3 rounded-md mb-3" />
        <View className="flex-row gap-1.5">
          <Skeleton className="w-12 h-5 rounded-full" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function priceLabel(priceRange: number): string {
  return '$'.repeat(Math.max(1, Math.min(4, priceRange)));
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function FoodSpotDetailScreen() {
  const colors = useAppColors();
  const navigation = useAppNavigation();
  const vm = useFoodSpotDetailViewModel();
  const { spot } = vm;

  if (vm.isLoading || !spot) {
    return <FoodSpotDetailLoadingSkeleton />;
  }

  const coverPhoto = spot.photos[0];

  return (
    <DetailScreenLayout
      title={spot.name}
      coverImageUri={coverPhoto?.url}
      fallbackGradient={[colors.secondary + '22', colors.secondary + '08']}
      onBack={vm.handleBack}
      onEdit={() => navigation.showBottomSheet(CreateFoodSpotSheet, { foodSpot: spot })}
      onDelete={vm.handleDeleteSpot}
      icon={Utensils}
    >
      {/* ── Photo thumbnail strip ── */}
      {spot.photos.length > 1 ? (
        <View className="bg-white dark:bg-darkBgCard mx-4 mt-5 rounded-3xl px-3 py-3 mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} >
            <View className="flex-row gap-2">
              {spot.photos.map((photo, idx) => (
                <Pressable
                  key={photo.id}
                  onPress={() => vm.handleOpenGallery(spot.photos, idx)}
                >
                  <FastImage
                    source={{ uri: photo.url, priority: FastImage.priority.high }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 12,
                      borderWidth: idx === 0 ? 2 : 0,
                      borderColor: colors.secondary,
                      opacity: idx === 0 ? 1 : 0.75,
                    }}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : (
        <View className="h-4" />
      )}

      {/* ── Info card ── */}
      <Card>
        {/* Name */}
        <Heading size="lg" className="text-textDark dark:text-darkTextDark leading-tight tracking-tight mb-2">
          {spot.name}
        </Heading>

        {/* Rating + Price row */}
        <View className="flex-row items-center gap-3 mb-3">
          <View className="flex-row items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                size={14}
                color={colors.starRating}
                strokeWidth={1.5}
                fill={i <= Math.round(spot.rating) ? colors.starRating : 'none'}
              />
            ))}
            <Caption className="text-textMid dark:text-darkTextMid ml-1">{spot.rating}/5</Caption>
          </View>
          <View className="w-px h-3 bg-border" />
          <Body size="md" className="font-semibold text-textMid dark:text-darkTextMid">
            {priceLabel(spot.priceRange)}
          </Body>
        </View>

        {/* Description */}
        {spot.description ? (
          <Body size="md" className="text-textMid dark:text-darkTextMid italic leading-relaxed mb-3">
            "{spot.description}"
          </Body>
        ) : null}

        {/* Location */}
        {spot.location ? (
          <View className="flex-row items-center gap-1.5 pt-2 border-t border-border dark:border-darkBorder/30">
            <MapPin size={13} color={colors.textLight} strokeWidth={1.5} />
            <Caption className="text-textMid dark:text-darkTextMid flex-1">{spot.location}</Caption>
            {spot.latitude && spot.longitude ? (
              <Pressable
                onPress={() =>
                  Linking.openURL(
                    `https://maps.google.com/?q=${spot.latitude},${spot.longitude}`,
                  ).catch(() => {})
                }
              >
                <Caption className="font-semibold text-secondary">
                  {t.foodSpots.detail.mapsLink}
                </Caption>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Tags */}
        {spot.tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5 pt-2">
            {spot.tags.map(tag => (
              <TagBadge key={tag} label={tag} variant="display" />
            ))}
          </View>
        ) : null}
      </Card>

      {/* ── Photos gallery link ── */}
      {spot.photos.length > 0 ? (
        <Card>
          <TouchableOpacity
            onPress={() => vm.handleOpenGallery(spot.photos, 0)}
            className="flex-row items-center gap-2 py-1"
          >
            <Images size={16} color={colors.secondary} strokeWidth={1.5} />
            <Body size="md" className="font-semibold text-secondary flex-1">
              {t.foodSpots.detail.viewGallery} ({spot.photos.length})
            </Body>
            <ChevronRight size={16} color={colors.textLight} strokeWidth={1.5} />
          </TouchableOpacity>
        </Card>
      ) : null}

      {/* ── Share ── */}
      <View className="mx-4 mb-4">
        <Pressable
          onPress={vm.handleShare}
          className="flex-row items-center justify-center gap-2 rounded-2xl py-3"
          style={{ backgroundColor: colors.primaryMuted }}
        >
          <Share2 size={16} color={colors.primary} strokeWidth={1.5} />
          <Body size="sm" className="font-semibold text-primary">
            {t.shareViewer.share}
          </Body>
        </Pressable>
      </View>

      {/* Bottom spacer */}
      <View className="h-[60px]" />
    </DetailScreenLayout>
  );
}
