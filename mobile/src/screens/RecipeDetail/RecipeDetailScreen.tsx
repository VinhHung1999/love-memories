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
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import {
  Check,
  CheckCircle,
  ChefHat,
  ChevronRight,
  ExternalLink,
  Images,
  MapPin,
  PlayCircle,
  Timer,
} from 'lucide-react-native';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useRecipeDetailViewModel } from './useRecipeDetailViewModel';
import Skeleton from '../../components/Skeleton';
import OverlayHeader from '../../components/OverlayHeader';
import { Card, CardTitle } from '../../components/Card';
import TagBadge from '../../components/TagBadge';
import CreateRecipeSheet from '../Recipes/components/CreateRecipeSheet';
import { styles } from './RecipeDetailScreen.styles';

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
      className="flex-row items-center gap-3 py-3"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border + '66',
      }}
    >
      <View
        className="w-5 h-5 rounded-md border-2 items-center justify-center"
        style={{
          backgroundColor: checked ? '#22c55e' : 'transparent',
          borderColor: checked ? '#22c55e' : colors.border,
        }}
      >
        {checked ? <Check size={11} strokeWidth={1.5} /> : null}
      </View>
      <Text
        className="flex-1 text-sm"
        style={{
          color: checked ? colors.textLight : colors.textDark,
          textDecorationLine: checked ? 'line-through' : 'none',
        }}
      >
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
      className="flex-row gap-3 py-3"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border + '66',
      }}
    >
      {/* Step number circle */}
      <View
        className="w-7 h-7 rounded-full items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: done ? '#22c55e' : colors.primaryMuted }}
      >
        {done ? (
          <Check size={13} strokeWidth={1.5} />
        ) : (
          <Text className="text-xs font-bold text-primary">{index + 1}</Text>
        )}
      </View>

      <View className="flex-1">
        <Text
          className="text-sm leading-relaxed"
          style={{
            color: done ? colors.textLight : colors.textDark,
            textDecorationLine: done ? 'line-through' : 'none',
          }}
        >
          {content}
        </Text>
        {duration ? (
          <View className="flex-row items-center gap-1 mt-1">
            <Timer size={11} color={colors.textLight} strokeWidth={1.5} />
            <Text className="text-[11px] text-textLight">
              {duration >= 60
                ? `${Math.floor(duration / 60)}m ${
                    duration % 60 > 0 ? `${duration % 60}s` : ''
                  }`
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

  return (
    <View className="flex-1 bg-white">
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Full-bleed cover (280px) ── */}
        <View style={{ height: 280 }}>
          {coverPhoto ? (
            <>
              <FastImage
                source={{
                  uri: coverPhoto.url,
                  priority: FastImage.priority.high,
                }}
                style={styles.absolute}
                resizeMode={FastImage.resizeMode.cover}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.28)', 'transparent', 'rgba(0,0,0,0.50)']}
                locations={[0, 0.4, 1]}
                style={styles.absolute}
              />
            </>
          ) : (
            <View
              className="w-full items-center justify-center bg-primary/10"
              style={styles.absolute}
            >
              <ChefHat size={32} color={colors.primary} strokeWidth={1.5} />
            </View>
          )}
          {/* Title at bottom of cover */}
          <View
            style={{ position: 'absolute', bottom: 28, left: 20, right: 20 }}
          >
            <Text
              style={{
                fontSize: 26,
                fontWeight: 'bold',
                color: coverPhoto ? '#fff' : '#2D2D2D',
                lineHeight: 32,
              }}
              numberOfLines={2}
            >
              {recipe.title}
            </Text>
          </View>
        </View>

        {/* ── Content card (overlaps cover, rounded top) ── */}
        <View className="bg-white rounded-t-3xl -mt-6 pb-6">
          {/* ── Photo thumbnail strip ── */}
          {recipe.photos.length > 1 ? (
            <View className="bg-white mx-4 mt-5 rounded-3xl shadow-sm px-3 py-3 mb-3">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {recipe.photos.map((photo, idx) => (
                    <Pressable
                      key={photo.id}
                      onPress={() => vm.handleOpenGallery(recipe.photos, idx)}
                    >
                      <Image
                        source={{ uri: photo.url }}
                        className="w-[52px] h-[52px] rounded-xl"
                        style={{
                          borderWidth: idx === 0 ? 2 : 0,
                          borderColor: colors.primary,
                          opacity: idx === 0 ? 1 : 0.7,
                        }}
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
                  <CheckCircle
                    size={12}
                    color={colors.success}
                    strokeWidth={1.5}
                  />
                  <Text className="text-[10px] font-semibold text-green-700">
                    Cooked
                  </Text>
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
                <MapPin size={13} color={colors.textLight} strokeWidth={1.5} />
                <Text className="text-xs text-textMid flex-1">
                  {t.recipes.detail.linkedSpot}:{' '}
                  <Text className="font-semibold text-secondary">
                    {recipe.foodSpot.name}
                  </Text>
                </Text>
              </View>
            ) : null}
          </Card>

          {/* ── Gallery link ── */}
          {recipe.photos.length > 0 ? (
            <Card>
              <TouchableOpacity
                onPress={() => vm.handleOpenGallery(recipe.photos, 0)}
                className="flex-row items-center gap-2 py-1"
              >
                <Images size={16} color={colors.primary} strokeWidth={1.5} />
                <Text className="text-sm font-semibold text-primary flex-1">
                  {t.recipes.detail.photos} ({recipe.photos.length})
                </Text>
                <ChevronRight
                  size={16}
                  color={colors.textLight}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            </Card>
          ) : null}

          {/* ── Ingredients ── */}
          {recipe.ingredients.length > 0 ? (
            <Card>
              <CardTitle>{t.recipes.detail.ingredients}</CardTitle>
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
                onPress={() =>
                  Linking.openURL(recipe.tutorialUrl!).catch(() => {})
                }
                className="flex-row items-center gap-3 py-1"
              >
                <View className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center">
                  <PlayCircle size={20} strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-textDark">
                    {t.recipes.detail.tutorialLink}
                  </Text>
                  <Text className="text-xs text-textLight" numberOfLines={1}>
                    {recipe.tutorialUrl}
                  </Text>
                </View>
                <ExternalLink
                  size={15}
                  color={colors.textLight}
                  strokeWidth={1.5}
                />
              </Pressable>
            </Card>
          ) : null}
        </View>
        {/* end content card */}
      </Animated.ScrollView>

      {/* ── "Cook This!" fixed bottom CTA ── */}
      <View className="absolute bottom-0 left-0 right-0 pb-6 px-5 pt-3 bg-white/95">
        <Pressable
          onPress={vm.handleCookThis}
          className="rounded-2xl overflow-hidden"
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 flex-row items-center justify-center gap-2"
          >
            <ChefHat size={18} strokeWidth={1.5} />
            <Text className="text-white font-bold text-base">
              {t.recipes.detail.cookNow}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      <OverlayHeader
        onBack={vm.handleBack}
        onEdit={() => navigation.showBottomSheet(CreateRecipeSheet, { recipe })}
        onDelete={vm.handleDelete}
        scrollY={scrollY}
        title={recipe.title}
      />
    </View>
  );
}
