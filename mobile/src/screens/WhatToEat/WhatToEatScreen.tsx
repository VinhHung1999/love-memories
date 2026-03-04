import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { Recipe } from '../../types';
import { useWhatToEatViewModel } from './useWhatToEatViewModel';
import Skeleton from '../../components/Skeleton';

// ── Recipe picker card ────────────────────────────────────────────────────────

function RecipePickCard({
  recipe,
  selected,
  onPress,
}: {
  recipe: Recipe;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useAppColors();
  const coverPhoto = recipe.photos[0];

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 p-3 rounded-2xl mb-2 border ${
        selected
          ? 'bg-primary/[8%] border-primary/40'
          : 'bg-white border-border/50'
      }`}>

      {/* Thumbnail */}
      <View className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        {coverPhoto ? (
          <Image source={{ uri: coverPhoto.url }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Icon name="chef-hat" size={22} color={colors.primary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-textDark" numberOfLines={1}>
          {recipe.title}
        </Text>
        {recipe.description ? (
          <Text className="text-xs text-textMid mt-0.5" numberOfLines={1}>
            {recipe.description}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-2 mt-1">
          {recipe.ingredients.length > 0 ? (
            <View className="flex-row items-center gap-0.5">
              <Icon name="format-list-bulleted" size={10} color={colors.textLight} />
              <Text className="text-[10px] text-textLight">{recipe.ingredients.length} ingr.</Text>
            </View>
          ) : null}
          {recipe.steps.length > 0 ? (
            <View className="flex-row items-center gap-0.5">
              <Icon name="numeric" size={10} color={colors.textLight} />
              <Text className="text-[10px] text-textLight">{recipe.steps.length} steps</Text>
            </View>
          ) : null}
          {recipe.cooked ? (
            <View className="flex-row items-center gap-0.5">
              <Icon name="check-circle" size={10} color={colors.success} />
              <Text className="text-[10px] text-green-600">Cooked</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Checkbox */}
      <View
        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
          selected ? 'bg-primary border-primary' : 'border-border'
        }`}>
        {selected ? <Icon name="check" size={13} color="#fff" /> : null}
      </View>
    </Pressable>
  );
}

// ── Active session banner ─────────────────────────────────────────────────────

function ActiveSessionBanner({ onResume }: { onResume: () => void }) {
  const colors = useAppColors();
  return (
    <Pressable
      onPress={onResume}
      className="mx-4 mb-4 rounded-2xl overflow-hidden">
      <LinearGradient
        colors={[colors.primary + 'DD', colors.secondary + 'DD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-4 py-4 flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
          <Icon name="chef-hat" size={20} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-sm">{t.whatToEat.activeSession}</Text>
          <Text className="text-white/80 text-xs mt-0.5">Tap to resume where you left off</Text>
        </View>
        <Icon name="arrow-right" size={20} color="#fff" />
      </LinearGradient>
    </Pressable>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function WhatToEatScreen() {
  const colors = useAppColors();
  const vm = useWhatToEatViewModel();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>

      {/* ── Header ── */}
      <View className="px-5 pt-4 pb-3 bg-white border-b border-border/30">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={vm.handleBack} className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center">
            <Icon name="arrow-left" size={18} color={colors.textDark} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-bold text-textDark">{t.whatToEat.title}</Text>
            <Text className="text-xs text-textLight">{t.whatToEat.subtitle}</Text>
          </View>
          <Pressable
            onPress={vm.handleViewHistory}
            className="px-3 py-1.5 rounded-xl border border-border">
            <Text className="text-xs font-semibold text-textMid">History</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Active session banner ── */}
      {vm.activeSession ? (
        <Animated.View entering={FadeInDown} className="mt-4">
          <ActiveSessionBanner onResume={vm.handleResumeSession} />
        </Animated.View>
      ) : null}

      {/* ── Recipe list — hidden when there's an active session ── */}
      {!vm.activeSession && (
        vm.isLoading ? (
          <ScrollView scrollEnabled={false} className="flex-1 px-4 mt-4">
            {[1, 2, 3].map(i => (
              <View key={i} className="flex-row items-center gap-3 p-3 bg-white rounded-2xl mb-2">
                <Skeleton className="w-14 h-14 rounded-xl" />
                <View className="flex-1 gap-2">
                  <Skeleton className="w-3/4 h-3.5 rounded-md" />
                  <Skeleton className="w-1/2 h-2.5 rounded-md" />
                </View>
              </View>
            ))}
          </ScrollView>
        ) : vm.recipes.length === 0 ? (
          <View className="flex-1 items-center justify-center pb-20">
            <Icon name="chef-hat" size={48} color={colors.textLight} />
            <Text className="text-textMid font-semibold text-base mt-4">{t.whatToEat.noRecipes}</Text>
            <Text className="text-textLight text-sm mt-1">{t.whatToEat.addRecipesFirst}</Text>
          </View>
        ) : (
          <>
            {/* Section title */}
            <View className="px-5 pt-4 pb-2">
              <Text className="text-base font-bold text-textDark">{t.whatToEat.selecting.title}</Text>
              <Text className="text-xs text-textLight mt-0.5">{t.whatToEat.selecting.subtitle}</Text>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
              <View className="pb-[120px]">
                {vm.recipes.map((recipe, idx) => (
                  <Animated.View key={recipe.id} entering={FadeInDown.delay(idx * 50)}>
                    <RecipePickCard
                      recipe={recipe}
                      selected={vm.selectedIds.has(recipe.id)}
                      onPress={() => vm.toggleRecipe(recipe.id)}
                    />
                  </Animated.View>
                ))}
              </View>
            </ScrollView>
          </>
        )
      )}

      {/* ── Bottom CTA — hidden when active session exists ── */}
      {!vm.activeSession && vm.selectedIds.size > 0 ? (
        <Animated.View
          entering={FadeInDown}
          className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-white/95">
          <Pressable
            onPress={vm.handleStart}
            disabled={vm.isCreating}
            className="rounded-2xl overflow-hidden">
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-4 flex-row items-center justify-center gap-2">
              <Icon name="chef-hat" size={18} color="#fff" />
              <Text className="text-white font-bold text-base">
                {t.whatToEat.selecting.startShopping}{' '}
                ({vm.selectedIds.size} {t.whatToEat.selecting.selected})
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      ) : null}

    </SafeAreaView>
  );
}
