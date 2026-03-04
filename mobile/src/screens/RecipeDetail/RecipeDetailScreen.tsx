import React, { useState } from 'react';
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
import { useRecipeDetailViewModel } from './useRecipeDetailViewModel';
import Skeleton from '../../components/Skeleton';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import HeaderIconButton from '../../components/HeaderIconButton';
import { Card, CardTitle } from '../../components/Card';
import TagBadge from '../../components/TagBadge';
import CreateRecipeSheet from '../Recipes/components/CreateRecipeSheet';

// ── Loading Skeleton ───────────────────────────────────────────────────────────

function RecipeDetailSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Skeleton className="w-full h-[280px]" />
      <View className="h-4" />
      <View className="bg-white mx-4 rounded-3xl px-4 py-4 mb-3">
        <Skeleton className="w-3/4 h-5 rounded-md mb-2" />
        <Skeleton className="w-full h-3 rounded-md mb-1" />
        <Skeleton className="w-2/3 h-3 rounded-md mb-3" />
        <View className="flex-row gap-1.5">
          <Skeleton className="w-14 h-5 rounded-xl" />
          <Skeleton className="w-16 h-5 rounded-xl" />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Ingredient Row ─────────────────────────────────────────────────────────────

function IngredientRow({
  ingredient,
  price,
  isLast,
}: {
  ingredient: string;
  price: number | undefined;
  isLast: boolean;
}) {
  const [checked, setChecked] = useState(false);
  const colors = useAppColors();

  return (
    <Pressable
      onPress={() => setChecked(v => !v)}
      className={`flex-row items-center gap-3 py-3 ${isLast ? '' : 'border-b border-border/40'}`}>
      <View
        className={`w-5 h-5 rounded-md border-2 items-center justify-center ${
          checked ? 'bg-green-500 border-green-500' : 'border-border'
        }`}>
        {checked ? <Icon name="check" size={11} color="#fff" /> : null}
      </View>
      <Text
        className={`flex-1 text-sm ${
          checked ? 'text-textLight line-through' : 'text-textDark'
        }`}>
        {ingredient}
      </Text>
      {price ? (
        <Text className="text-xs text-textLight font-medium">
          {price.toLocaleString()}đ
        </Text>
      ) : null}
    </Pressable>
  );
}

// ── Step Row ──────────────────────────────────────────────────────────────────

function StepRow({
  index,
  content,
  duration,
  isLast,
}: {
  index: number;
  content: string;
  duration: number | undefined;
  isLast: boolean;
}) {
  const [done, setDone] = useState(false);
  const colors = useAppColors();

  return (
    <Pressable
      onPress={() => setDone(v => !v)}
      className={`flex-row gap-3 py-3 ${isLast ? '' : 'border-b border-border/40'}`}>
      {/* Step number circle */}
      <View
        className={`w-7 h-7 rounded-full items-center justify-center flex-shrink-0 mt-0.5 ${
          done ? 'bg-green-500' : 'bg-primary/10'
        }`}>
        {done ? (
          <Icon name="check" size={13} color="#fff" />
        ) : (
          <Text className="text-xs font-bold text-primary">{index + 1}</Text>
        )}
      </View>

      <View className="flex-1">
        <Text
          className={`text-sm leading-relaxed ${
            done ? 'text-textLight line-through' : 'text-textDark'
          }`}>
          {content}
        </Text>
        {duration ? (
          <View className="flex-row items-center gap-1 mt-1">
            <Icon name="timer-outline" size={11} color={colors.textLight} />
            <Text className="text-[11px] text-textLight">
              {duration >= 60
                ? `${Math.floor(duration / 60)}m ${duration % 60 > 0 ? `${duration % 60}s` : ''}`
                : `${duration}s`}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function RecipeDetailScreen() {
  const colors = useAppColors();
  const navigation = useAppNavigation();
  const vm = useRecipeDetailViewModel();
  const { recipe } = vm;

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  if (vm.isLoading || !recipe) {
    return <RecipeDetailSkeleton />;
  }

  const coverPhoto = recipe.photos[0];
  const totalEstCost = recipe.ingredientPrices.reduce((sum, p) => sum + (p ?? 0), 0);

  return (
    <View className="flex-1 bg-gray-50">

      {/* ── Collapsible Header with hero photo ── */}
      <CollapsibleHeader
        title={recipe.title}
        expandedHeight={280}
        collapsedHeight={56}
        dark
        scrollY={scrollY}
        renderBackground={() => (
          <>
            {coverPhoto ? (
              <Image
                source={{ uri: coverPhoto.url }}
                className="absolute inset-0 w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
              />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.28)', 'transparent', 'rgba(0,0,0,0.35)']}
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
              onPress={() => navigation.showBottomSheet(CreateRecipeSheet, { recipe })}
            />
            <HeaderIconButton
              name="trash-can-outline"
              onPress={vm.handleDelete}
              disabled={vm.isDeleting}
            />
          </View>
        )}
      />

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 120 }}>
        {/* pt-[224px] = expandedHeight(280) - collapsedHeight(56) */}
        <View className="pt-[224px]">

          {/* ── Photo thumbnail strip ── */}
          {recipe.photos.length > 1 ? (
            <View className="bg-white mx-4 -mt-5 rounded-3xl shadow-sm px-3 py-3 mb-3">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {recipe.photos.map((photo, idx) => (
                    <Pressable
                      key={photo.id}
                      onPress={() => vm.handleOpenGallery(recipe.photos, idx)}>
                      <Image
                        source={{ uri: photo.url }}
                        className={`w-[52px] h-[52px] rounded-xl ${
                          idx === 0 ? 'border-2 border-primary' : 'opacity-70'
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
            {/* Title + cooked badge */}
            <View className="flex-row items-start gap-2 mb-1">
              <Text className="text-xl font-bold text-textDark leading-tight flex-1">
                {recipe.title}
              </Text>
              {recipe.cooked ? (
                <View className="bg-green-100 rounded-xl px-2 py-0.5 flex-row items-center gap-1">
                  <Icon name="check-circle" size={12} color={colors.success} />
                  <Text className="text-[10px] font-semibold text-green-700">Cooked</Text>
                </View>
              ) : null}
            </View>

            {recipe.description ? (
              <Text className="text-sm text-textMid italic leading-relaxed mb-3">
                {recipe.description}
              </Text>
            ) : null}

            {/* Tags */}
            {recipe.tags.length > 0 ? (
              <View className="flex-row flex-wrap gap-1.5 mb-3">
                {recipe.tags.map(tag => (
                  <TagBadge key={tag} label={tag} variant="display" />
                ))}
              </View>
            ) : null}

            {/* Linked food spot */}
            {recipe.foodSpot ? (
              <View className="flex-row items-center gap-1.5 pt-2 border-t border-border/30">
                <Icon name="map-marker-outline" size={13} color={colors.textLight} />
                <Text className="text-xs text-textMid flex-1">
                  {t.recipes.detail.linkedSpot}: <Text className="font-semibold text-secondary">{recipe.foodSpot.name}</Text>
                </Text>
              </View>
            ) : null}
          </Card>

          {/* ── Gallery link ── */}
          {recipe.photos.length > 0 ? (
            <Card>
              <TouchableOpacity
                onPress={() => vm.handleOpenGallery(recipe.photos, 0)}
                className="flex-row items-center gap-2 py-1">
                <Icon name="image-multiple-outline" size={16} color={colors.primary} />
                <Text className="text-sm font-semibold text-primary flex-1">
                  {t.recipes.detail.photos} ({recipe.photos.length})
                </Text>
                <Icon name="chevron-right" size={16} color={colors.textLight} />
              </TouchableOpacity>
            </Card>
          ) : null}

          {/* ── Ingredients ── */}
          {recipe.ingredients.length > 0 ? (
            <Card>
              <CardTitle>
                {t.recipes.detail.ingredients}
              </CardTitle>
              {recipe.ingredients.map((ing, idx) => (
                <IngredientRow
                  key={idx}
                  ingredient={ing}
                  price={recipe.ingredientPrices[idx]}
                  isLast={idx === recipe.ingredients.length - 1}
                />
              ))}
            </Card>
          ) : null}

          {/* ── Steps ── */}
          {recipe.steps.length > 0 ? (
            <Card>
              <CardTitle>{t.recipes.detail.steps}</CardTitle>
              {recipe.steps.map((step, idx) => (
                <StepRow
                  key={idx}
                  index={idx}
                  content={step}
                  duration={recipe.stepDurations[idx]}
                  isLast={idx === recipe.steps.length - 1}
                />
              ))}
            </Card>
          ) : null}

          {/* ── Notes ── */}
          {recipe.notes ? (
            <Card>
              <CardTitle>{t.recipes.detail.notes}</CardTitle>
              <Text className="text-sm text-textMid leading-relaxed pt-1">
                {recipe.notes}
              </Text>
            </Card>
          ) : null}

          {/* ── Tutorial link ── */}
          {recipe.tutorialUrl ? (
            <Card>
              <Pressable
                onPress={() => Linking.openURL(recipe.tutorialUrl!).catch(() => {})}
                className="flex-row items-center gap-3 py-1">
                <View className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center">
                  <Icon name="play-circle-outline" size={20} color="#ef4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-textDark">{t.recipes.detail.tutorialLink}</Text>
                  <Text className="text-xs text-textLight" numberOfLines={1}>{recipe.tutorialUrl}</Text>
                </View>
                <Icon name="open-in-new" size={15} color={colors.textLight} />
              </Pressable>
            </Card>
          ) : null}

        </View>
      </Animated.ScrollView>

      {/* ── "Cook This!" fixed bottom CTA ── */}
      <View className="absolute bottom-0 left-0 right-0 pb-6 px-5 pt-3 bg-white/95">
        <Pressable
          onPress={vm.handleCookThis}
          className="rounded-2xl overflow-hidden">
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 flex-row items-center justify-center gap-2">
            <Icon name="chef-hat" size={18} color="#fff" />
            <Text className="text-white font-bold text-base">{t.recipes.detail.cookNow}</Text>
          </LinearGradient>
        </Pressable>
      </View>

    </View>
  );
}
