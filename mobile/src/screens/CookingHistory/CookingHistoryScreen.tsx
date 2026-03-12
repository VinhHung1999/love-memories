import React from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, BookOpen, ChefHat, ChevronRight, Star, Timer } from 'lucide-react-native';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { CookingSession } from '../../types';
import { useCookingHistoryViewModel } from './useCookingHistoryViewModel';
import Skeleton from '../../components/Skeleton';

// ── Duration helper ────────────────────────────────────────────────────────────

function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Session Card ──────────────────────────────────────────────────────────────

function SessionCard({
  session,
  onPress,
  delay,
}: {
  session: CookingSession;
  onPress: () => void;
  delay: number;
}) {
  const colors = useAppColors();
  const coverPhoto = session.photos[0] ?? session.recipes[0]?.recipe.photos[0];
  const date = new Date(session.completedAt ?? session.createdAt);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Animated.View entering={FadeInDown.delay(delay)}>
      <Pressable
        onPress={onPress}
        className="bg-white rounded-3xl overflow-hidden shadow-sm mb-3 flex-row">

        {/* Thumbnail */}
        <View className="w-[90px] h-[90px] bg-gray-100 flex-shrink-0">
          {coverPhoto ? (
            <Image
              source={{ uri: coverPhoto.url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <ChefHat size={28} color={colors.textLight} strokeWidth={1.5} />
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 px-3 py-3">
          <Text className="text-sm font-semibold text-textDark" numberOfLines={1}>
            {session.recipes.map(r => r.recipe.title).join(', ')}
          </Text>
          <Text className="text-xs text-textLight mt-0.5">{dateStr}</Text>

          <View className="flex-row items-center gap-3 mt-2">
            {/* Duration */}
            <View className="flex-row items-center gap-1">
              <Timer size={12} color={colors.textLight} strokeWidth={1.5} />
              <Text className="text-[11px] text-textMid">{formatDuration(session.totalTimeMs)}</Text>
            </View>

            {/* Recipes count */}
            <View className="flex-row items-center gap-1">
              <BookOpen size={12} color={colors.textLight} strokeWidth={1.5} />
              <Text className="text-[11px] text-textMid">
                {session.recipes.length} {t.whatToEat.history.recipes}
              </Text>
            </View>

            {/* Rating */}
            {session.rating ? (
              <View className="flex-row items-center gap-0.5">
                <Star size={12} color={colors.starRating} strokeWidth={1.5} />
                <Text className="text-[11px] text-textMid">{session.rating}/5</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="pr-3 items-center justify-center">
          <ChevronRight size={16} color={colors.textLight} strokeWidth={1.5} />
        </View>

      </Pressable>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function CookingHistoryScreen() {
  const colors = useAppColors();
  const vm = useCookingHistoryViewModel();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>

      {/* ── Header ── */}
      <View className="px-5 pt-4 pb-3 bg-white border-b border-border/30">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={vm.handleBack}
            className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center">
            <ArrowLeft size={18} color={colors.textDark} strokeWidth={1.5} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-bold text-textDark">{t.whatToEat.historyTitle}</Text>
            <Text className="text-xs text-textLight">
              {vm.sessions.length} sessions
            </Text>
          </View>
        </View>
      </View>

      {/* ── Content ── */}
      {vm.isLoading ? (
        <View className="flex-1 px-4 pt-4 gap-3">
          {[1, 2, 3].map(i => (
            <View key={i} className="flex-row bg-white rounded-3xl overflow-hidden h-[90px]">
              <Skeleton className="w-[90px] h-full" />
              <View className="flex-1 px-3 py-3 gap-2">
                <Skeleton className="w-3/4 h-3.5 rounded-md" />
                <Skeleton className="w-1/3 h-2.5 rounded-md" />
                <Skeleton className="w-1/2 h-2.5 rounded-md" />
              </View>
            </View>
          ))}
        </View>
      ) : vm.sessions.length === 0 ? (
        <View className="flex-1 items-center justify-center pb-20">
          <ChefHat size={48} color={colors.textLight} strokeWidth={1.5} />
          <Text className="text-textMid font-semibold text-base mt-4">{t.whatToEat.noHistory}</Text>
          <Text className="text-textLight text-sm mt-1 text-center px-8">{t.whatToEat.noHistorySubtitle}</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.handleRefresh}
              tintColor={colors.primary}
            />
          }>
          <View key={`sessions-${vm.sessions.length}`} className="pb-8">
            {vm.sessions.map((session, idx) => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() => vm.handleSessionPress(session.id)}
                delay={idx * 60}
              />
            ))}
          </View>
        </ScrollView>
      )}

    </SafeAreaView>
  );
}
