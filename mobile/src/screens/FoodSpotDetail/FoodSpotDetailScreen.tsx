import React from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useFoodSpotDetailViewModel } from './useFoodSpotDetailViewModel';
import Skeleton from '../../components/Skeleton';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import HeaderIconButton from '../../components/HeaderIconButton';
import { Card } from '../../components/Card';
import TagBadge from '../../components/TagBadge';
import CreateFoodSpotSheet from '../CreateFoodSpot/CreateFoodSpotSheet';

// ── Loading skeleton ───────────────────────────────────────────────────────────

function FoodSpotDetailLoadingSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Skeleton className="w-full h-[280px]" />
      <View className="h-4" />
      <View className="bg-white mx-4 rounded-3xl px-4 py-4 mb-3">
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

  // Hooks before early return
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  if (vm.isLoading || !spot) {
    return <FoodSpotDetailLoadingSkeleton />;
  }

  const coverPhoto = spot.photos[0];

  return (
    <View className="flex-1 bg-gray-50">

      {/* ── Collapsible header (hero photo + back/edit/delete) ── */}
      <CollapsibleHeader
        title={spot.name}
        expandedHeight={280}
        collapsedHeight={56}
        dark
        scrollY={scrollY}
        renderBackground={() => (
          <>
            {coverPhoto ? (
              <Animated.Image
                source={{ uri: coverPhoto.url }}
                sharedTransitionTag={`foodspot-photo-${spot.id}`}
                className="absolute inset-0 w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['#FFF8F3', colors.secondary, '#E8903A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
              />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.22)', 'transparent', 'rgba(0,0,0,0.3)']}
              locations={[0, 0.4, 1]}
              className="absolute inset-0"
            />
          </>
        )}
        renderLeft={() => (
          <HeaderIconButton name="arrow-left" size={20} onPress={vm.handleBack} />
        )}
        renderRight={() => (
          <View className="flex-row gap-2">
            <HeaderIconButton
              name="pencil-outline"
              onPress={() => navigation.showBottomSheet(CreateFoodSpotSheet, { foodSpot: spot })}
            />
            <HeaderIconButton
              name="trash-can-outline"
              onPress={vm.handleDeleteSpot}
              disabled={vm.isDeleting}
            />
          </View>
        )}
      />

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}>
        {/* pt-[224px] = expandedHeight(280) - collapsedHeight(56) */}
        <View className="pt-[224px] pb-[60px]">

          {/* ── Photo thumbnail strip ── */}
          {spot.photos.length > 1 ? (
            <View className="bg-white mx-4 -mt-5 rounded-3xl shadow-sm px-3 py-3 mb-3">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {spot.photos.map((photo, idx) => (
                    <Pressable
                      key={photo.id}
                      onPress={() => vm.handleOpenGallery(spot.photos, idx)}>
                      <Image
                        source={{ uri: photo.url }}
                        className={`w-[52px] h-[52px] rounded-xl ${
                          idx === 0
                            ? 'border-2 border-secondary opacity-100'
                            : 'opacity-75'
                        }`}
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
            <Text className="text-xl font-bold text-textDark leading-tight tracking-tight mb-2">
              {spot.name}
            </Text>

            {/* Rating + Price row */}
            <View className="flex-row items-center gap-3 mb-3">
              <View className="flex-row items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Icon
                    key={i}
                    name={i <= Math.round(spot.rating) ? 'star' : 'star-outline'}
                    size={14}
                    color="#F59E0B"
                  />
                ))}
                <Text className="text-xs text-textMid ml-1">{spot.rating}/5</Text>
              </View>
              <View className="w-px h-3 bg-border" />
              <Text className="text-sm font-semibold text-textMid">
                {priceLabel(spot.priceRange)}
              </Text>
            </View>

            {/* Description */}
            {spot.description ? (
              <Text className="text-sm text-textMid italic leading-relaxed mb-3">
                "{spot.description}"
              </Text>
            ) : null}

            {/* Location */}
            {spot.location ? (
              <View className="flex-row items-center gap-1.5 pt-2 border-t border-border/30">
                <Icon name="map-marker-outline" size={13} color={colors.textLight} />
                <Text className="text-xs text-textMid flex-1">{spot.location}</Text>
                {spot.latitude && spot.longitude ? (
                  <Pressable
                    onPress={() =>
                      Linking.openURL(
                        `https://maps.google.com/?q=${spot.latitude},${spot.longitude}`,
                      ).catch(() => {})
                    }>
                    <Text className="text-xs font-semibold text-secondary">
                      {t.foodSpots.detail.mapsLink}
                    </Text>
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
                className="flex-row items-center gap-2 py-1">
                <Icon name="image-multiple-outline" size={16} color={colors.secondary} />
                <Text className="text-sm font-semibold text-secondary flex-1">
                  {t.foodSpots.detail.viewGallery} ({spot.photos.length})
                </Text>
                <Icon name="chevron-right" size={16} color={colors.textLight} />
              </TouchableOpacity>
            </Card>
          ) : null}

        </View>
      </Animated.ScrollView>

    </View>
  );
}
