/**
 * DailyQAStreakCard
 * Merged section: Daily Question card + Streak indicator in one component.
 * Self-fetches today's question data. Receives streak from Dashboard vm as props.
 */
import React from 'react';
import { View, Pressable } from 'react-native';
import { Body, Caption } from '../../../components/Typography';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Check,
  CheckCheck,
  Flame,
  Heart,
  MessageCircle,
  Smile,
  Star,
  Telescope,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../lib/auth';
import { useAppColors } from '../../../navigation/theme';
import { dailyQuestionsApi } from '../../../lib/api';
import { useTranslation } from 'react-i18next';
import type { DailyQuestionToday } from '../../../types';

const CATEGORY_ICON: Record<
  string,
  React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
> = {
  general:  MessageCircle,
  deep:     Star,
  fun:      Smile,
  intimacy: Heart,
  future:   Telescope,
};

interface DailyQAStreakCardProps {
  currentStreak: number;
  answeredToday: boolean;
  completedToday: boolean;
}

export default function DailyQAStreakCard({
  currentStreak,
  answeredToday,
  completedToday,
}: DailyQAStreakCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const colors = useAppColors();
  const navigation = useNavigation<any>();

  const { data, isLoading } = useQuery<DailyQuestionToday>({
    queryKey: ['daily-question-today'],
    queryFn: dailyQuestionsApi.today,
    enabled: !!user,
    staleTime: 60_000,
  });

  if (isLoading) return null;

  // ── Streak pill ───────────────────────────────────────────────────────────

  const showStreak = currentStreak > 0;
  // 3-state pill: both done (teal) → I answered/waiting (amber) → neither (rose)
  const streakPillBg = completedToday
    ? 'rgba(126,200,181,0.15)'
    : answeredToday
    ? 'rgba(245,158,11,0.15)'
    : 'rgba(232,120,138,0.12)';
  const streakPillColor = completedToday
    ? colors.accent
    : answeredToday
    ? '#F59E0B'
    : colors.primary;

  function StreakPill() {
    if (!showStreak) return null;
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: streakPillBg,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 20,
          gap: 3,
        }}
      >
        <Flame size={11} color={streakPillColor} strokeWidth={1.5} />
        <Caption style={{ color: streakPillColor, fontWeight: '700', fontSize: 11 }}>
          {currentStreak}
        </Caption>
      </View>
    );
  }

  // ── No question today ─────────────────────────────────────────────────────

  if (!data) {
    return (
      <Animated.View entering={FadeInDown.delay(160).duration(500)}>
        <View
          className="rounded-3xl border border-borderSoft dark:border-darkBorder px-4 py-3"
          style={{ opacity: 0.5 }}>
          <View className="flex-row items-center gap-1.5">
            <MessageCircle size={12} color={colors.textLight} strokeWidth={1.5} />
            <Caption style={{ color: colors.textLight, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 10 }}>
              {t('dailyQuestions.cardTitle')}
            </Caption>
            <View style={{ flex: 1 }} />
            <StreakPill />
          </View>
          <Body size="sm" style={{ color: colors.textLight, marginTop: 4 }}>
            {t('dailyQuestions.noQuestion')}
          </Body>
        </View>
      </Animated.View>
    );
  }

  const { question, myAnswer, partnerAnswer, partnerName } = data;
  const CategoryIcon = CATEGORY_ICON[question.category] ?? MessageCircle;
  const hasAnswered = !!myAnswer;
  const bothAnswered = hasAnswered && !!partnerAnswer;

  // ── Both answered ─────────────────────────────────────────────────────────

  if (bothAnswered) {
    return (
      <Animated.View entering={FadeInDown.delay(160).duration(500)}>
        <Pressable
          onPress={() => navigation.navigate('DailyQuestions')}
          className="rounded-3xl overflow-hidden border border-borderSoft dark:border-darkBorder px-4 py-3"
          style={{ backgroundColor: colors.primaryMuted }}>

          <View className="flex-row items-center gap-1.5 mb-2">
            <CategoryIcon size={12} color={colors.primary} strokeWidth={1.5} />
            <Caption style={{ color: colors.primary, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 10 }}>
              {t('dailyQuestions.cardTitle')}
            </Caption>
            <View style={{ flex: 1 }} />
            <View className="flex-row items-center gap-1.5">
              <View className="flex-row items-center gap-0.5 rounded-full px-2 py-0.5" style={{ backgroundColor: colors.primary + '22' }}>
                <CheckCheck size={9} strokeWidth={2} color={colors.primary} />
                <Caption style={{ fontWeight: '700', color: colors.primary, fontSize: 10, marginLeft: 3 }}>2/2 ✓</Caption>
              </View>
              <StreakPill />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <View>
              <Caption style={{ color: colors.primary, fontWeight: '700', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 1 }}>
                {t('dailyQuestions.myAnswer')}
              </Caption>
              <Body size="sm" style={{ color: colors.textDark }} numberOfLines={2}>{myAnswer}</Body>
            </View>
            <View>
              <Caption style={{ color: colors.primary, fontWeight: '700', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 1 }}>
                {t('dailyQuestions.partnerAnswer').replace('{name}', partnerName ?? 'Partner')}
              </Caption>
              <Body size="sm" style={{ color: colors.textDark }} numberOfLines={2}>{partnerAnswer}</Body>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── Not answered / waiting ────────────────────────────────────────────────

  return (
    <Animated.View entering={FadeInDown.delay(160).duration(500)}>
      <Pressable
        onPress={() => navigation.navigate('DailyQuestions')}
        className="rounded-3xl overflow-hidden border border-borderSoft dark:border-darkBorder px-4 py-3"
        style={{ backgroundColor: colors.primary }}>

        <View className="flex-row items-center gap-1.5 mb-2">
          <CategoryIcon size={12} color="#fff" strokeWidth={1.5} />
          <Caption style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 10 }}>
            {t('dailyQuestions.cardTitle')}
          </Caption>
          <View style={{ flex: 1 }} />
          <View className="flex-row items-center gap-1.5">
            {hasAnswered && (
              <View className="flex-row items-center gap-0.5 bg-white/20 rounded-full px-2 py-0.5">
                <Check size={9} strokeWidth={1.5} color="#fff" />
                <Caption style={{ fontWeight: '700', color: '#fff', fontSize: 10, marginLeft: 2 }}>
                  {t('dailyQuestions.answered')}
                </Caption>
              </View>
            )}
            {/* Streak pill on primary bg: always white-tinted */}
            {showStreak ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 20,
                  gap: 3,
                }}
              >
                <Flame size={11} color="#fff" strokeWidth={1.5} />
                <Caption style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>
                  {currentStreak}
                </Caption>
              </View>
            ) : null}
          </View>
        </View>

        {!hasAnswered && (
          <>
            <Body size="md" style={{ color: '#fff', fontWeight: '700', lineHeight: 22, marginBottom: 10 }} numberOfLines={2}>
              {question.text}
            </Body>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Caption style={{ fontWeight: '700', color: '#fff', fontSize: 12 }}>
                  {t('dailyQuestions.answerNow')} →
                </Caption>
              </View>
            </View>
          </>
        )}

        {hasAnswered && (
          <>
            <Body size="sm" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 18, marginBottom: 6 }} numberOfLines={2}>
              {myAnswer}
            </Body>
            <Caption style={{ color: 'rgba(255,255,255,0.6)' }}>
              {t('dailyQuestions.waitingForPartner').replace('{name}', partnerName ?? 'partner')}
            </Caption>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
