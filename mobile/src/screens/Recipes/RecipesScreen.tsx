import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { Recipe } from '../../types';
import { useRecipesViewModel, type RecipeFilter } from './useRecipesViewModel';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import EmptyState from '../../components/EmptyState';
import TagBadge from '../../components/TagBadge';
import Skeleton from '../../components/Skeleton';
import CreateRecipeSheet from './components/CreateRecipeSheet';
import AIRecipeSheet from './components/AIRecipeSheet';

// ── Loading skeleton ───────────────────────────────────────────────────────────

function RecipeCardSkeleton() {
  return (
    <View className="bg-white rounded-3xl overflow-hidden mb-3 shadow-sm">
      <Skeleton className="w-full h-[140px]" />
      <View className="px-3 pt-2 pb-3">
        <Skeleton className="w-3/4 h-3.5 rounded-md mb-1.5" />
        <Skeleton className="w-1/2 h-2.5 rounded-md mb-2" />
        <View className="flex-row gap-1">
          <Skeleton className="w-12 h-[18px] rounded-xl" />
          <Skeleton className="w-10 h-[18px] rounded-xl" />
        </View>
      </View>
    </View>
  );
}

function RecipesLoadingSkeleton() {
  return (
    <ScrollView scrollEnabled={false} className="flex-1">
      <View className="px-[14px] pb-[100px] pt-14">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <RecipeCardSkeleton />
            <RecipeCardSkeleton />
          </View>
          <View className="flex-1 mt-8">
            <RecipeCardSkeleton />
            <RecipeCardSkeleton />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Recipe Card ───────────────────────────────────────────────────────────────

function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const colors = useAppColors();
  const coverPhoto = recipe.photos[0];

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-3xl overflow-hidden shadow-sm mb-3">

      {/* Photo / placeholder */}
      <View className="w-full">
        {coverPhoto ? (
          <FastImage
            source={{ uri: coverPhoto.url, priority: FastImage.priority.normal }}
            className="w-full h-[150px]"
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <LinearGradient
            colors={[colors.primary + '22', colors.secondary + '33']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-full h-[120px] items-center justify-center">
            <Icon name="chef-hat" size={32} color={colors.primary} />
          </LinearGradient>
        )}

        {/* Cooked badge */}
        {recipe.cooked ? (
          <View className="absolute top-2 right-2 bg-green-500 rounded-xl px-2 py-0.5 flex-row items-center gap-1">
            <Icon name="check" size={9} color="#fff" />
            <Text className="text-[9px] font-bold text-white">{t.recipes.detail.cookedBadge}</Text>
          </View>
        ) : (
          <View className="absolute top-2 right-2 bg-white/80 rounded-xl px-2 py-0.5">
            <Text className="text-[9px] font-semibold text-primary">To Try</Text>
          </View>
        )}

        {/* Ingredient count badge */}
        {recipe.ingredients.length > 0 ? (
          <View className="absolute bottom-2 left-2 bg-black/40 rounded-xl px-2 py-0.5 flex-row items-center gap-1">
            <Icon name="format-list-bulleted" size={9} color="#fff" />
            <Text className="text-[9px] text-white">{recipe.ingredients.length} ingredients</Text>
          </View>
        ) : null}
      </View>

      {/* Body */}
      <View className="px-3 pt-2 pb-3">
        <Text
          className="text-sm font-semibold text-textDark leading-snug mb-1.5"
          numberOfLines={2}>
          {recipe.title}
        </Text>

        {recipe.description ? (
          <Text className="text-[11px] text-textMid mb-1.5" numberOfLines={1}>
            {recipe.description}
          </Text>
        ) : null}

        {recipe.tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-1">
            {recipe.tags.slice(0, 2).map(tag => (
              <TagBadge key={tag} label={tag} variant="display" />
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

// ── Filter chip ───────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1.5 rounded-xl border ${
        active ? 'bg-primary border-primary' : 'bg-white border-border'
      }`}>
      <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-textMid'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function RecipesScreen() {
  const colors = useAppColors();
  const navigation = useAppNavigation();
  const vm = useRecipesViewModel();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  const filterOptions: { key: RecipeFilter; label: string }[] = [
    { key: 'all', label: t.recipes.allFilter },
    { key: 'cooked', label: t.recipes.cookedFilter },
    { key: 'uncooked', label: t.recipes.uncookedFilter },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <CollapsibleHeader
        title={t.recipes.title}
        subtitle={t.recipes.subtitle}
        expandedHeight={140}
        collapsedHeight={96}
        scrollY={scrollY}
        dark
        renderBackground={() => (
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0"
          />
        )}
        renderRight={() => (
          <Pressable
            onPress={() => navigation.navigate('WhatToEat')}
            className="w-10 h-10 rounded-xl items-center justify-center bg-white/20">
            <Icon name="chef-hat" size={20} color="#fff" />
          </Pressable>
        )}
        renderFooter={() => (
          <View className="bg-white border-b border-border/30">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-5">
              <View className="flex-row gap-2 py-2 pr-5">
                {filterOptions.map(opt => (
                  <FilterChip
                    key={opt.key}
                    label={opt.label}
                    active={vm.filter === opt.key}
                    onPress={() => vm.setFilter(opt.key)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      />

      {vm.isLoading ? (
        <RecipesLoadingSkeleton />
      ) : vm.isEmpty && vm.totalCount === 0 ? (
        <EmptyState
          icon="chef-hat"
          title={t.recipes.emptyTitle}
          subtitle={t.recipes.emptySubtitle}
          actionLabel={t.recipes.emptyAction}
          onAction={() => navigation.showBottomSheet(CreateRecipeSheet)}
        />
      ) : vm.isEmpty ? (
        // Filtered empty
        <View className="flex-1 items-center justify-center pb-20">
          <Icon name="filter-remove-outline" size={36} color={colors.textLight} />
          <Text className="text-textMid text-sm mt-3">No recipes match this filter</Text>
        </View>
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
          {/* pt-14 = scrollRange(44) + gap */}
          <View className="px-[14px] pt-14 pb-[100px]">
            <View className="flex-row gap-3">
              <View className="flex-1">
                {vm.leftColumn.map((recipe, idx) => (
                  <Animated.View key={recipe.id} entering={FadeInDown.delay(idx * 60)}>
                    <RecipeCard
                      recipe={recipe}
                      onPress={() => vm.handleRecipePress(recipe.id)}
                    />
                  </Animated.View>
                ))}
              </View>
              <View className="flex-1 mt-8">
                {vm.rightColumn.map((recipe, idx) => (
                  <Animated.View key={recipe.id} entering={FadeInDown.delay(idx * 60 + 30)}>
                    <RecipeCard
                      recipe={recipe}
                      onPress={() => vm.handleRecipePress(recipe.id)}
                    />
                  </Animated.View>
                ))}
              </View>
            </View>
          </View>
        </Animated.ScrollView>
      )}

      {/* FAB — AI recipe */}
      <Pressable
        onPress={() => navigation.showBottomSheet(AIRecipeSheet)}
        className="absolute bottom-8 right-[82px] w-12 h-12 rounded-full items-center justify-center shadow-sm bg-white border-2 border-primary/30">
        <Icon name="robot-outline" size={22} color={colors.primary} />
      </Pressable>

      {/* FAB — add recipe */}
      <Pressable
        onPress={() => navigation.showBottomSheet(CreateRecipeSheet)}
        className="absolute bottom-8 right-5 w-14 h-14 rounded-full items-center justify-center shadow-md"
        style={{ backgroundColor: colors.primary }}>
        <Icon name="plus" size={26} color="#fff" />
      </Pressable>

    </View>
  );
}
