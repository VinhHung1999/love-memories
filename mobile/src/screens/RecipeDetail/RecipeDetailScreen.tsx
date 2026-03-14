import React, { useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Heading, Body, Caption, Label } from '../../components/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
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
import { Card, CardTitle } from '../../components/Card';
import TagBadge from '../../components/TagBadge';
import CreateRecipeSheet from '../Recipes/components/CreateRecipeSheet';
import DetailScreenLayout from '../../components/DetailScreenLayout';

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
      <Body
        size="md"
        className="flex-1"
        style={{
          color: checked ? colors.textLight : colors.textDark,
          textDecorationLine: checked ? 'line-through' : 'none',
        }}
      >
        {ingredient}
      </Body>
      {price ? (
        <Caption className="text-textLight font-medium">
          {price.toLocaleString()}đ
        </Caption>
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
          <Caption className="font-bold text-primary">{index + 1}</Caption>
        )}
      </View>

      <View className="flex-1">
        <Body
          size="md"
          className="leading-relaxed"
          style={{
            color: done ? colors.textLight : colors.textDark,
            textDecorationLine: done ? 'line-through' : 'none',
          }}
        >
          {content}
        </Body>
        {duration ? (
          <View className="flex-row items-center gap-1 mt-1">
            <Timer size={11} color={colors.textLight} strokeWidth={1.5} />
            <Caption className="text-textLight">
              {duration >= 60
                ? `${Math.floor(duration / 60)}m ${
                    duration % 60 > 0 ? `${duration % 60}s` : ''
                  }`
                : `${duration}s`}
            </Caption>
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

  if (vm.isLoading || !recipe) {
    return <RecipeDetailSkeleton />;
  }

  const coverPhoto = recipe.photos[0];

  return (
    <View className="flex-1 bg-white">
      <DetailScreenLayout
        title={recipe.title}
        coverImageUri={coverPhoto?.url}
        onBack={vm.handleBack}
        onEdit={() => navigation.showBottomSheet(CreateRecipeSheet, { recipe })}
        onDelete={vm.handleDelete}
        icon={ChefHat}

      >
        {/* ── Photo thumbnail strip ── */}
        {recipe.photos.length > 1 ? (
          <View className="bg-white mx-4 mt-5 rounded-3xl px-3 py-3 mb-3">
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
            <Heading size="lg" className="leading-tight flex-1">
              {recipe.title}
            </Heading>
            {recipe.cooked ? (
              <View className="bg-green-100 rounded-xl px-2 py-0.5 flex-row items-center gap-1">
                <CheckCircle
                  size={12}
                  color={colors.success}
                  strokeWidth={1.5}
                />
                <Caption className="font-semibold text-green-700">
                  Cooked
                </Caption>
              </View>
            ) : null}
          </View>

          {recipe.description ? (
            <Body size="md" className="text-textMid italic leading-relaxed mb-3">
              {recipe.description}
            </Body>
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
              <Body size="sm" className="text-textMid flex-1">
                {t.recipes.detail.linkedSpot}:{' '}
                <Label className="font-semibold text-secondary">
                  {recipe.foodSpot.name}
                </Label>
              </Body>
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
              <Body size="md" className="font-semibold text-primary flex-1">
                {t.recipes.detail.photos} ({recipe.photos.length})
              </Body>
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
            <Body size="md" className="text-textMid leading-relaxed pt-1">
              {recipe.notes}
            </Body>
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
                <Body size="md" className="font-semibold text-textDark">
                  {t.recipes.detail.tutorialLink}
                </Body>
                <Body size="sm" className="text-textLight" numberOfLines={1}>
                  {recipe.tutorialUrl}
                </Body>
              </View>
              <ExternalLink
                size={15}
                color={colors.textLight}
                strokeWidth={1.5}
              />
            </Pressable>
          </Card>
        ) : null}

        {/* Bottom spacer — extra height for the fixed "Cook This!" bar */}
        <View className="h-[120px]" />
      </DetailScreenLayout>

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
            <ChefHat size={18} strokeWidth={1.5} color='#fff'/>
            <Label className="font-bold" style={{ color: '#FFFFFF' }}>
              {t.recipes.detail.cookNow}
            </Label>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
