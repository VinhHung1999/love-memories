import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Linking,
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
import type { CookingSession, CookingSessionItem, CookingSessionStep } from '../../types';
import { useCookingSessionViewModel } from './useCookingSessionViewModel';
import Skeleton from '../../components/Skeleton';

// ── Progress steps bar — 4 steps (selecting auto-advances, never shown) ────────

const PHASES = ['shopping', 'cooking', 'photo', 'completed'] as const;
const PHASE_ICONS = ['cart-outline', 'chef-hat', 'camera-outline', 'check-circle-outline'] as const;

function PhaseBar({ status }: { status: string }) {
  const colors = useAppColors();
  const currentIdx = PHASES.indexOf(status as any);

  return (
    <View className="flex-row items-center px-5 py-3 bg-white border-b border-border/30">
      {PHASES.map((phase, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <React.Fragment key={phase}>
            <View
              className="w-7 h-7 rounded-full items-center justify-center"
              style={{ backgroundColor: done ? '#22c55e' : active ? colors.primary : '#f3f4f6' }}>
              <Icon
                name={done ? 'check' : PHASE_ICONS[idx]}
                size={14}
                color={done || active ? '#fff' : colors.textLight}
              />
            </View>
            {idx < PHASES.length - 1 ? (
              <View className="flex-1 h-0.5 mx-0.5" style={{ backgroundColor: idx < currentIdx ? '#22c55e' : '#e5e7eb' }} />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ── Shopping phase ────────────────────────────────────────────────────────────

function ShoppingPhase({
  session,
  onToggleItem,
  checkedCount,
  allChecked,
  onAdvance,
  isAdvancing,
}: {
  session: CookingSession;
  onToggleItem: (id: string, checked: boolean) => void;
  checkedCount: number;
  allChecked: boolean;
  onAdvance: () => void;
  isAdvancing: boolean;
}) {
  const colors = useAppColors();
  const totalCost = session.items.reduce((sum, item) => sum + (item.price ?? 0), 0);

  return (
    <>
      <View className="px-5 pt-4 pb-2">
        <Text className="text-base font-bold text-textDark">{t.whatToEat.shopping.title}</Text>
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-xs text-textLight">{t.whatToEat.shopping.subtitle}</Text>
          <View className="bg-primary/10 rounded-full px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-primary">
              {checkedCount}/{session.items.length}
            </Text>
          </View>
        </View>
        {totalCost > 0 ? (
          <Text className="text-xs text-textMid mt-1">
            {t.whatToEat.shopping.totalCost}: {totalCost.toLocaleString()}đ
          </Text>
        ) : null}
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl overflow-hidden mb-4">
          {session.items.map((item: CookingSessionItem, idx) => (
            <Pressable
              key={item.id}
              onPress={() => onToggleItem(item.id, !item.checked)}
              className="flex-row items-center gap-3 px-4 py-3"
              style={{ borderBottomWidth: idx < session.items.length - 1 ? 1 : 0, borderBottomColor: 'rgba(226,220,232,0.3)' }}>
              <View
                className="w-5 h-5 rounded-md border-2 items-center justify-center"
                style={{ backgroundColor: item.checked ? '#22c55e' : 'transparent', borderColor: item.checked ? '#22c55e' : colors.border }}>
                {item.checked ? <Icon name="check" size={11} color="#fff" /> : null}
              </View>
              <Text
                className="flex-1 text-sm"
              style={{ color: item.checked ? colors.textLight : colors.textDark, textDecorationLine: item.checked ? 'line-through' : 'none' }}>
                {item.ingredient}
              </Text>
              {item.price ? (
                <Text className="text-xs text-textLight">{item.price.toLocaleString()}đ</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
        <View className="h-[100px]" />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-white/95">
        <Pressable
          onPress={onAdvance}
          disabled={!allChecked || isAdvancing}
          className="rounded-2xl overflow-hidden">
          <LinearGradient
            colors={allChecked ? [colors.primary, colors.secondary] : ['#ccc', '#bbb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-2.5 flex-row items-center justify-center gap-1.5">
            <Icon name="chef-hat" size={14} color="#fff" />
            <Text className="text-white font-bold text-sm">
              {allChecked ? t.whatToEat.shopping.startCooking : t.whatToEat.shopping.subtitle}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </>
  );
}

// ── Step countdown timer ──────────────────────────────────────────────────────

function StepCountdown({ durationSeconds }: { durationSeconds: number }) {
  const colors = useAppColors();
  const [remaining, setRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handlePress = () => {
    if (remaining !== null && remaining > 0) {
      // Running → stop
      stop();
      setRemaining(null);
    } else if (remaining === 0) {
      // Done → restart
      setRemaining(durationSeconds);
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev === null || prev <= 1) { stop(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Idle → start
      setRemaining(durationSeconds);
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev === null || prev <= 1) { stop(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  };

  useEffect(() => () => stop(), [stop]);

  const isRunning = remaining !== null && remaining > 0;
  const isDone = remaining === 0;

  const display = (() => {
    const sec = remaining ?? durationSeconds;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`;
    return `${s}s`;
  })();

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center gap-1 mt-1 px-2 py-1 rounded-lg self-start"
      style={{ backgroundColor: isDone ? 'rgba(34,197,94,0.1)' : isRunning ? colors.primaryMuted : '#f3f4f6' }}>
      <Icon
        name={isDone ? 'check-circle' : isRunning ? 'timer' : 'timer-outline'}
        size={12}
        color={isDone ? colors.success : isRunning ? colors.primary : colors.textLight}
      />
      <Text
        className="text-[11px] font-semibold"
        style={{ color: isDone ? '#16a34a' : isRunning ? colors.primary : colors.textLight }}>
        {isDone ? 'Done!' : display}
      </Text>
    </Pressable>
  );
}

// ── Session elapsed timer ─────────────────────────────────────────────────────

function ElapsedTimer({ startedAt }: { startedAt: string | null }) {
  const colors = useAppColors();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => {
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const display = h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <View className="flex-row items-center gap-1 bg-primary/10 rounded-full px-2.5 py-0.5">
      <Icon name="clock-outline" size={11} color={colors.primary} />
      <Text className="text-[11px] font-bold text-primary">{display}</Text>
    </View>
  );
}

// ── Cooking phase ─────────────────────────────────────────────────────────────

function CookingPhase({
  session,
  onToggleStep,
  checkedCount,
  allChecked,
  onAdvance,
  isAdvancing,
}: {
  session: CookingSession;
  onToggleStep: (id: string, checked: boolean) => void;
  checkedCount: number;
  allChecked: boolean;
  onAdvance: () => void;
  isAdvancing: boolean;
}) {
  const colors = useAppColors();

  return (
    <>
      <View className="px-5 pt-4 pb-2">
        <Text className="text-base font-bold text-textDark">{t.whatToEat.cooking.title}</Text>
        <View className="flex-row items-center gap-2 mt-1">
          <View className="bg-primary/10 rounded-full px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-primary">
              {checkedCount}/{session.steps.length}
            </Text>
          </View>
          <ElapsedTimer startedAt={session.startedAt} />
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {session.recipes.map(sr => {
          const stepsForRecipe = session.steps.filter(s => s.recipeId === sr.recipeId);
          if (stepsForRecipe.length === 0) return null;
          return (
            <View key={sr.id} className="mb-3">
              {/* Recipe section header with optional tutorial link */}
              <View className="flex-row items-center justify-between mb-2 px-1">
                <Text className="text-[11px] font-bold text-textLight uppercase tracking-wider">
                  {sr.recipe.title}
                </Text>
                {sr.recipe.tutorialUrl ? (
                  <Pressable
                    onPress={() => Linking.openURL(sr.recipe.tutorialUrl!).catch(() => {})}
                    className="flex-row items-center gap-1">
                    <Icon name="play-circle-outline" size={13} color={colors.secondary} />
                    <Text className="text-[11px] font-semibold text-secondary">
                      {t.whatToEat.cooking.viewGuide}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <View className="bg-white rounded-2xl overflow-hidden">
                {stepsForRecipe.map((step: CookingSessionStep, idx) => (
                  <Pressable
                    key={step.id}
                    onPress={() => onToggleStep(step.id, !step.checked)}
                    className="flex-row gap-3 px-4 py-3"
                    style={{ borderBottomWidth: idx < stepsForRecipe.length - 1 ? 1 : 0, borderBottomColor: 'rgba(226,220,232,0.3)' }}>
                    <View
                      className="w-6 h-6 rounded-full items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: step.checked ? '#22c55e' : colors.primaryMuted }}>
                      {step.checked ? (
                        <Icon name="check" size={12} color="#fff" />
                      ) : (
                        <Text className="text-[10px] font-bold text-primary">{step.stepIndex + 1}</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-sm leading-relaxed"
                      style={{ color: step.checked ? colors.textLight : colors.textDark, textDecorationLine: step.checked ? 'line-through' : 'none' }}>
                        {step.content}
                      </Text>
                      {step.durationSeconds ? (
                        <StepCountdown durationSeconds={step.durationSeconds} />
                      ) : null}
                      {step.checkedBy ? (
                        <Text className="text-[10px] text-green-600 mt-0.5">✓ {step.checkedBy}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
        <View className="h-[100px]" />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-white/95">
        <Pressable
          onPress={onAdvance}
          disabled={!allChecked || isAdvancing}
          className="rounded-2xl overflow-hidden">
          <LinearGradient
            colors={allChecked ? [colors.primary, colors.secondary] : ['#ccc', '#bbb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-2.5 flex-row items-center justify-center gap-1.5">
            <Icon name="camera-outline" size={14} color="#fff" />
            <Text className="text-white font-bold text-sm">{t.whatToEat.cooking.takePhoto}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </>
  );
}

// ── Photo phase ───────────────────────────────────────────────────────────────

function PhotoPhase({
  session,
  onAddPhoto,
  onAddPhotoFromCamera,
  onAdvance,
}: {
  session: CookingSession;
  onAddPhoto: () => void;
  onAddPhotoFromCamera: () => void;
  onAdvance: () => void;
}) {
  const colors = useAppColors();

  return (
    <>
      <View className="px-5 pt-4 pb-2">
        <Text className="text-base font-bold text-textDark">{t.whatToEat.photo.title}</Text>
        <Text className="text-xs text-textLight mt-0.5">{t.whatToEat.photo.subtitle}</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Photos grid */}
        {session.photos.length > 0 ? (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {session.photos.map(photo => (
              <Image
                key={photo.id}
                source={{ uri: photo.url }}
                className="w-[100px] h-[100px] rounded-2xl"
                resizeMode="cover"
              />
            ))}
          </View>
        ) : null}

        {/* Add photo buttons */}
        <View className="flex-row gap-3 mb-4">
          <Pressable
            onPress={onAddPhotoFromCamera}
            className="flex-1 border-2 border-dashed border-primary/40 rounded-2xl py-5 items-center gap-2">
            <Icon name="camera-outline" size={24} color={colors.primary} />
            <Text className="text-xs font-semibold text-primary">Camera</Text>
          </Pressable>
          <Pressable
            onPress={onAddPhoto}
            className="flex-1 border-2 border-dashed border-border rounded-2xl py-5 items-center gap-2">
            <Icon name="image-plus" size={24} color={colors.textMid} />
            <Text className="text-xs font-semibold text-textMid">Gallery</Text>
          </Pressable>
        </View>

        <View className="h-[100px]" />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-white/95 gap-2">
        <Pressable
          onPress={onAdvance}
          className="rounded-2xl overflow-hidden">
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-2.5 flex-row items-center justify-center gap-1.5">
            <Icon name="star-outline" size={14} color="#fff" />
            <Text className="text-white font-bold text-sm">{t.whatToEat.photo.finish}</Text>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={onAdvance} className="py-2 items-center">
          <Text className="text-xs text-textLight">{t.whatToEat.photo.skip}</Text>
        </Pressable>
      </View>
    </>
  );
}

// ── Rating phase (just finished — no rating yet) ───────────────────────────────

function RatingPhase({
  session,
  rating,
  onSetRating,
  onFinish,
  isRating,
}: {
  session: CookingSession;
  rating: number;
  onSetRating: (r: number) => void;
  onFinish: () => void;
  isRating: boolean;
}) {
  const colors = useAppColors();
  const durationMs = session.totalTimeMs;
  const durationMin = durationMs ? Math.round(durationMs / 60000) : null;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="items-center pt-10 pb-4 px-5">
        <LinearGradient
          colors={[colors.primary + '22', colors.secondary + '22']}
          className="w-20 h-20 rounded-full items-center justify-center mb-4">
          <Icon name="chef-hat" size={38} color={colors.primary} />
        </LinearGradient>
        <Text className="text-2xl font-bold text-textDark">Meal complete!</Text>
        {durationMin ? (
          <Text className="text-sm text-textMid mt-1">Cooked in {durationMin} minutes</Text>
        ) : null}
      </View>

      {/* Food photos */}
      {session.photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-6">
          <View className="flex-row gap-3">
            {session.photos.map(photo => (
              <Image
                key={photo.id}
                source={{ uri: photo.url }}
                className="w-[160px] h-[140px] rounded-2xl"
                resizeMode="cover"
              />
            ))}
          </View>
        </ScrollView>
      ) : null}

      {/* Recipes cooked */}
      <View className="px-5 mb-6">
        <Text className="text-sm font-semibold text-textMid mb-2">Recipes cooked:</Text>
        {session.recipes.map(sr => (
          <View key={sr.id} className="flex-row items-center gap-2 mb-1">
            <Icon name="check-circle" size={14} color={colors.success} />
            <Text className="text-sm text-textDark">{sr.recipe.title}</Text>
          </View>
        ))}
      </View>

      {/* Star rating */}
      <View className="px-5 items-center mb-8">
        <Text className="text-sm font-semibold text-textDark mb-3">{t.whatToEat.rating.title}</Text>
        <Text className="text-xs text-textLight mb-4">{t.whatToEat.rating.subtitle}</Text>
        <View className="flex-row gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Pressable key={i} onPress={() => onSetRating(i)} hitSlop={8}>
              <Icon
                name={i <= rating ? 'star' : 'star-outline'}
                size={36}
                color={colors.starRating}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View className="px-5 pb-8">
        <Pressable
          onPress={onFinish}
          disabled={isRating}
          className="rounded-2xl overflow-hidden">
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-2.5 flex-row items-center justify-center gap-1.5">
            <Icon name="check" size={14} color="#fff" />
            <Text className="text-white font-bold text-sm">{t.whatToEat.rating.confirm}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ── Completed summary view (already rated — read-only) ────────────────────────

function CompletedSummaryView({ session }: { session: CookingSession }) {
  const colors = useAppColors();
  const durationMs = session.totalTimeMs;
  const durationMin = durationMs ? Math.round(durationMs / 60000) : null;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="items-center pt-10 pb-4 px-5">
        <LinearGradient
          colors={[colors.primary + '22', colors.secondary + '22']}
          className="w-20 h-20 rounded-full items-center justify-center mb-4">
          <Icon name="trophy-outline" size={38} color={colors.primary} />
        </LinearGradient>
        <Text className="text-2xl font-bold text-textDark">{t.whatToEat.completed.title}</Text>
        <Text className="text-sm text-textMid mt-1">{t.whatToEat.completed.subtitle}</Text>
      </View>

      {/* Duration */}
      {durationMin ? (
        <View className="mx-5 mb-4 bg-white rounded-2xl px-4 py-3 flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
            <Icon name="clock-outline" size={18} color={colors.primary} />
          </View>
          <View>
            <Text className="text-[11px] text-textLight uppercase tracking-wider">{t.whatToEat.completed.cookedIn}</Text>
            <Text className="text-base font-bold text-textDark">{durationMin} min</Text>
          </View>
        </View>
      ) : null}

      {/* Rating (read-only) */}
      {session.rating ? (
        <View className="mx-5 mb-4 bg-white rounded-2xl px-4 py-3 flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-xl bg-amber-50 items-center justify-center">
            <Icon name="star" size={18} color={colors.starRating} />
          </View>
          <View className="flex-1">
            <Text className="text-[11px] text-textLight uppercase tracking-wider">{t.whatToEat.completed.yourRating}</Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <Icon
                  key={i}
                  name={i <= session.rating! ? 'star' : 'star-outline'}
                  size={18}
                  color={colors.starRating}
                />
              ))}
              <Text className="text-sm font-bold text-textDark ml-1">{session.rating}/5</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Food photos */}
      {session.photos.length > 0 ? (
        <View className="mb-4">
          <Text className="text-[11px] font-bold text-textLight uppercase tracking-wider mb-2 px-5">
            {t.whatToEat.photo.title}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5">
            <View className="flex-row gap-3">
              {session.photos.map(photo => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.url }}
                  className="w-[160px] h-[140px] rounded-2xl"
                  resizeMode="cover"
                />
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      {/* Recipes cooked */}
      <View className="mx-5 mb-8 bg-white rounded-2xl px-4 py-3">
        <Text className="text-[11px] font-bold text-textLight uppercase tracking-wider mb-2">Recipes</Text>
        {session.recipes.map(sr => (
          <View key={sr.id} className="flex-row items-center gap-2 py-1">
            <Icon name="check-circle" size={15} color={colors.success} />
            <Text className="text-sm text-textDark flex-1">{sr.recipe.title}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function CookingSessionScreen() {
  const colors = useAppColors();
  const vm = useCookingSessionViewModel();
  const { session } = vm;

  if (vm.isLoading || !session) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="h-14 bg-white border-b border-border/30 px-4 flex-row items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="w-40 h-4 rounded-md" />
        </View>
        <View className="flex-1 px-4 pt-4 gap-3">
          <Skeleton className="w-full h-14 rounded-2xl" />
          <Skeleton className="w-full h-14 rounded-2xl" />
          <Skeleton className="w-full h-14 rounded-2xl" />
        </View>
      </SafeAreaView>
    );
  }

  const phaseTitles: Record<string, string> = {
    selecting: t.whatToEat.phases.selecting,
    shopping: t.whatToEat.phases.shopping,
    cooking: t.whatToEat.phases.cooking,
    photo: t.whatToEat.phases.photo,
    completed: t.whatToEat.phases.completed,
  };

  // When session is completed AND already rated → read-only summary view
  const isCompletedAndRated = session.status === 'completed' && session.rating != null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>

      {/* ── Header ── */}
      <View className="px-5 pt-3 pb-3 bg-white flex-row items-center gap-3">
        <Pressable
          onPress={vm.handleBack}
          className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center">
          <Icon name="arrow-left" size={18} color={colors.textDark} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-sm font-bold text-textDark" numberOfLines={1}>
            {session.recipes.map(r => r.recipe.title).join(' + ')}
          </Text>
          <Text className="text-xs text-textLight">{phaseTitles[session.status]}</Text>
        </View>
        {/* Abandon button — only show for active sessions */}
        {!isCompletedAndRated ? (
          <Pressable
            onPress={vm.handleAbandon}
            disabled={vm.isAbandoning}
            className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center">
            <Icon name="trash-can-outline" size={18} color={colors.textLight} />
          </Pressable>
        ) : null}
      </View>

      {/* ── Phase progress bar — hidden for completed+rated summary ── */}
      {!isCompletedAndRated ? <PhaseBar status={session.status} /> : null}

      {/* ── Phase content ── */}
      <Animated.View key={session.status} entering={FadeInDown.duration(300)} className="flex-1">
        {isCompletedAndRated ? (
          <CompletedSummaryView session={session} />
        ) : session.status === 'shopping' ? (
          <ShoppingPhase
            session={session}
            onToggleItem={vm.handleToggleItem}
            checkedCount={vm.checkedItemCount}
            allChecked={vm.allItemsChecked}
            onAdvance={() => vm.handleAdvance('cooking')}
            isAdvancing={vm.isAdvancing}
          />
        ) : session.status === 'cooking' ? (
          <CookingPhase
            session={session}
            onToggleStep={vm.handleToggleStep}
            checkedCount={vm.checkedStepCount}
            allChecked={vm.allStepsChecked}
            onAdvance={() => vm.handleAdvance('photo')}
            isAdvancing={vm.isAdvancing}
          />
        ) : session.status === 'photo' ? (
          <PhotoPhase
            session={session}
            onAddPhoto={vm.handleAddPhoto}
            onAddPhotoFromCamera={vm.handleAddPhotoFromCamera}
            onAdvance={() => vm.handleAdvance('completed')}
          />
        ) : session.status === 'completed' ? (
          /* completed but not yet rated */
          <RatingPhase
            session={session}
            rating={vm.rating}
            onSetRating={vm.setRating}
            onFinish={vm.handleFinish}
            isRating={vm.isRating}
          />
        ) : (
          /* selecting — shouldn't arrive here, but handle gracefully */
          <View className="flex-1 items-center justify-center">
            <Text className="text-textMid">Loading session...</Text>
          </View>
        )}
      </Animated.View>

    </SafeAreaView>
  );
}
