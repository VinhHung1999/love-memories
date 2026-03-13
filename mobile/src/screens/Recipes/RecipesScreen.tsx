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
} from 'react-native-reanimated';
import FastImage from 'react-native-fast-image';
import { Bot, Check, ChefHat, FilterX, List, Plus } from 'lucide-react-native';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { Recipe } from '../../types';
import { useRecipesViewModel, type RecipeFilter } from './useRecipesViewModel';
import ListHeader from '../../components/ListHeader';
import EmptyState from '../../components/EmptyState';
import TagBadge from '../../components/TagBadge';
import Skeleton from '../../components/Skeleton';
import CreateRecipeSheet from './components/CreateRecipeSheet';
import AIRecipeSheet from './components/AIRecipeSheet';
import HeaderIcon from '@/components/HeaderIcon';
import { FAB } from '@/components/FAB';

// ── Loading skeleton ───────────────────────────────────────────────────────────

function RecipeCardSkeleton() {
  return (
    <View className="bg-white rounded-3xl overflow-hidden mb-3">
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
      <View className="px-[14px] pb-[100px] pt-3">
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
      className="bg-white rounded-3xl overflow-hidden mb-3">

      {/* Photo / placeholder */}
      <View className="w-full">
        {coverPhoto ? (
          <FastImage
            source={{ uri: coverPhoto.url, priority: FastImage.priority.normal }}
            style={{ width: '100%', height: 150 }}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <View className="w-full h-[120px] items-center justify-center bg-primary/10">
            <ChefHat size={32} color={colors.primary} strokeWidth={1.5} />
          </View>
        )}

        {/* Cooked badge */}
        {recipe.cooked ? (
          <View className="absolute top-2 right-2 bg-green-500 rounded-xl px-2 py-0.5 flex-row items-center gap-1">
            <Check size={9} strokeWidth={1.5} />
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
            <List size={9} strokeWidth={1.5} />
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
  const colors = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      className="px-3 py-1.5 rounded-xl border"
      style={{ backgroundColor: active ? colors.primary : '#fff', borderColor: active ? colors.primary : colors.border }}>
      <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : colors.textMid }}>
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

  const filterOptions: { key: RecipeFilter; label: string }[] = [
    { key: 'all', label: t.recipes.allFilter },
    { key: 'cooked', label: t.recipes.cookedFilter },
    { key: 'uncooked', label: t.recipes.uncookedFilter },
  ];

  return (
    <View className="flex-1 bg-baseBg">
      <ListHeader
        title={t.recipes.title}
        subtitle={t.recipes.subtitle}
        onBack={() => navigation.goBack()}
        right={
          <HeaderIcon
            onPress={() => navigation.navigate('WhatToEat')}
            icon={ChefHat}
          />
        }
        filterBar={
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
        }
      />

      {vm.isLoading ? (
        <RecipesLoadingSkeleton />
      ) : vm.isEmpty && vm.totalCount === 0 ? (
        <EmptyState
          icon={ChefHat}
          title={t.recipes.emptyTitle}
          subtitle={t.recipes.emptySubtitle}
          actionLabel={t.recipes.emptyAction}
          onAction={() => navigation.showBottomSheet(CreateRecipeSheet)}
        />
      ) : vm.isEmpty ? (
        // Filtered empty
        <View className="flex-1 items-center justify-center pb-20">
          <FilterX size={36} color={colors.textLight} strokeWidth={1.5} />
          <Text className="text-textMid text-sm mt-3">No recipes match this filter</Text>
        </View>
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
              <View key={`left-${vm.filter}`} className="flex-1">
                {vm.leftColumn.map((recipe, idx) => (
                  <Animated.View key={recipe.id} entering={FadeInDown.delay(idx * 60)}>
                    <RecipeCard
                      recipe={recipe}
                      onPress={() => vm.handleRecipePress(recipe.id)}
                    />
                  </Animated.View>
                ))}
              </View>
              <View key={`right-${vm.filter}`} className="flex-1 mt-8">
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
        </ScrollView>
      )}

      {/* FAB — AI recipe */}
      <Pressable
        onPress={() => navigation.showBottomSheet(AIRecipeSheet)}
        className="absolute bottom-8 right-[82px] w-12 h-12 rounded-full items-center justify-center bg-white border-2 border-primary/30">
        <Bot size={22} color={colors.primary} strokeWidth={1.5} />
      </Pressable>

      {/* FAB — add recipe */}
      <FAB onPress={() => navigation.showBottomSheet(CreateRecipeSheet)} icon={Plus}/>
    </View>
  );
}
