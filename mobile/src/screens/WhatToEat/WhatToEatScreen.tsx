import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Heading, Body, Caption, Label } from '../../components/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, ArrowRight, Check, CheckCircle, ChefHat, Hash, List } from 'lucide-react-native';
import HeaderIcon from '../../components/HeaderIcon';
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
      className="flex-row items-center gap-3 p-3 rounded-2xl mb-2 border"
      style={{ backgroundColor: selected ? colors.primary + '14' : colors.bgCard, borderColor: selected ? colors.primary + '66' : colors.border + '80' }}>

      {/* Thumbnail */}
      <View className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        {coverPhoto ? (
          <Image source={{ uri: coverPhoto.url }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <ChefHat size={22} color={colors.primary} strokeWidth={1.5} />
          </View>
        )}
      </View>

      {/* Info */}
      <View className="flex-1">
        <Label className="text-textDark dark:text-darkTextDark" numberOfLines={1}>
          {recipe.title}
        </Label>
        {recipe.description ? (
          <Caption className="text-textMid dark:text-darkTextMid mt-0.5" numberOfLines={1}>
            {recipe.description}
          </Caption>
        ) : null}
        <View className="flex-row items-center gap-2 mt-1">
          {recipe.ingredients.length > 0 ? (
            <View className="flex-row items-center gap-0.5">
              <List size={10} color={colors.textLight} strokeWidth={1.5} />
              <Caption className="text-textLight dark:text-darkTextLight">{recipe.ingredients.length} ingr.</Caption>
            </View>
          ) : null}
          {recipe.steps.length > 0 ? (
            <View className="flex-row items-center gap-0.5">
              <Hash size={10} color={colors.textLight} strokeWidth={1.5} />
              <Caption className="text-textLight dark:text-darkTextLight">{recipe.steps.length} steps</Caption>
            </View>
          ) : null}
          {recipe.cooked ? (
            <View className="flex-row items-center gap-0.5">
              <CheckCircle size={10} color={colors.success} strokeWidth={1.5} />
              <Caption className="text-green-600">Cooked</Caption>
            </View>
          ) : null}
        </View>
      </View>

      {/* Checkbox */}
      <View
        className="w-6 h-6 rounded-full border-2 items-center justify-center"
        style={{ backgroundColor: selected ? colors.primary : 'transparent', borderColor: selected ? colors.primary : colors.border }}>
        {selected ? <Check size={13} strokeWidth={1.5} /> : null}
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
      className="mx-4 mb-4 rounded-2xl overflow-hidden bg-white dark:bg-darkBgCard border border-borderSoft dark:border-darkBorder px-4 py-4 flex-row items-center gap-3">
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
        <ChefHat size={20} color={colors.primary} strokeWidth={1.5} />
      </View>
      <View className="flex-1">
        <Body size="md" className="text-textDark dark:text-darkTextDark font-bold">{t.whatToEat.activeSession}</Body>
        <Body size="sm" className="text-textMid dark:text-darkTextMid mt-0.5">Tap to resume where you left off</Body>
      </View>
      <ArrowRight size={20} color={colors.textMid} strokeWidth={1.5} />
    </Pressable>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function WhatToEatScreen() {
  const colors = useAppColors();
  const vm = useWhatToEatViewModel();

  return (
    <SafeAreaView className="flex-1 bg-baseBg dark:bg-darkBaseBg" edges={['top']}>

      {/* ── Header ── */}
      <View className="px-5 pt-4 pb-3 bg-white dark:bg-darkBgCard border-b border-border dark:border-darkBorder/30">
        <View className="flex-row items-center gap-3">
          <HeaderIcon icon={ArrowLeft} onPress={vm.handleBack} />
          <View className="flex-1">
            <Heading size="md">{t.whatToEat.title}</Heading>
            <Body size="sm" className="text-textLight dark:text-darkTextLight">{t.whatToEat.subtitle}</Body>
          </View>
          <Pressable
            onPress={vm.handleViewHistory}
            className="px-3 py-1.5 rounded-xl border border-border dark:border-darkBorder">
            <Caption className="font-semibold text-textMid dark:text-darkTextMid">History</Caption>
          </Pressable>
        </View>
      </View>

      {/* ── Active session banner ── */}
      {vm.activeSession ? (
        <Animated.View key={vm.activeSession.id} entering={FadeInDown} className="mt-4">
          <ActiveSessionBanner onResume={vm.handleResumeSession} />
        </Animated.View>
      ) : null}

      {/* ── Recipe list — hidden when there's an active session ── */}
      {!vm.activeSession && (
        vm.isLoading ? (
          <ScrollView scrollEnabled={false} className="flex-1 px-4 mt-4">
            {[1, 2, 3].map(i => (
              <View key={i} className="flex-row items-center gap-3 p-3 bg-white dark:bg-darkBgCard rounded-2xl mb-2">
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
            <ChefHat size={48} color={colors.textLight} strokeWidth={1.5} />
            <Heading size="sm" className="text-textMid dark:text-darkTextMid mt-4">{t.whatToEat.noRecipes}</Heading>
            <Body size="md" className="text-textLight dark:text-darkTextLight mt-1">{t.whatToEat.addRecipesFirst}</Body>
          </View>
        ) : (
          <>
            {/* Section title */}
            <View className="px-5 pt-4 pb-2">
              <Heading size="sm">{t.whatToEat.selecting.title}</Heading>
              <Body size="sm" className="text-textLight dark:text-darkTextLight mt-0.5">{t.whatToEat.selecting.subtitle}</Body>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
              <View key={`recipes-${vm.recipes.length}`} className="pb-[120px]">
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

      {/* ── Bottom action bar — slim, appears when recipes selected ── */}
      {!vm.activeSession && vm.selectedIds.size > 0 ? (
        <Animated.View entering={FadeInDown} className="border-t border-border dark:border-darkBorder bg-white dark:bg-darkBgCard px-5 py-3 flex-row items-center">
          <View className="flex-1 flex-row items-center gap-2">
            <View className="w-7 h-7 rounded-full bg-primary/12 items-center justify-center">
              <Label className="text-primary">{vm.selectedIds.size}</Label>
            </View>
            <Body size="sm" className="text-textMid dark:text-darkTextMid">{t.whatToEat.selecting.recipesSelected}</Body>
          </View>
          <Pressable
            onPress={vm.handleStart}
            disabled={vm.isCreating}
            className="rounded-2xl px-4 py-2.5 flex-row items-center gap-1.5"
            style={{ backgroundColor: colors.primary }}>
            <ChefHat size={14} strokeWidth={1.5} />
            <Label className="text-white">{t.whatToEat.selecting.startShopping}</Label>
          </Pressable>
        </Animated.View>
      ) : null}

    </SafeAreaView>
  );
}
