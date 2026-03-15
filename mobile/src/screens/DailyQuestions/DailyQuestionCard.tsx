/**
 * Dashboard card for Daily Questions.
 * Always visible — shows different state based on answer status.
 *
 * States:
 *   1. Loading        → null (invisible, no flash)
 *   2. No data        → ghost card "No question today"
 *   3. Not answered   → question text + "Answer now" CTA
 *   4. I answered     → my snippet + "Waiting for [partner]..."
 *   5. Both answered  → both snippets + "2/2 ✓" indicator
 */
import React from 'react';
import { View, Pressable } from 'react-native';
import { Body, Caption } from '../../components/Typography';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Check, CheckCheck, MessageCircle, Star, Smile, Heart, Telescope } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { useAppColors } from '../../navigation/theme';
import { dailyQuestionsApi } from '../../lib/api';
import t from '../../locales/en';
import type { DailyQuestionToday } from '../../types';

const CATEGORY_ICON: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  general:  MessageCircle,
  deep:     Star,
  fun:      Smile,
  intimacy: Heart,
  future:   Telescope,
};

export default function DailyQuestionCard() {
  const { user } = useAuth();
  const colors = useAppColors();
  const navigation = useNavigation<any>();

  const { data, isLoading } = useQuery<DailyQuestionToday>({
    queryKey: ['daily-question-today'],
    queryFn: dailyQuestionsApi.today,
    enabled: !!user,
    staleTime: 60_000,
  });

  // Still fetching — render nothing to avoid flash
  if (isLoading) return null;

  // No question today — ghost card
  if (!data) {
    return (
      <Animated.View entering={FadeInDown.delay(160).duration(500)}>
        <View
          className="rounded-3xl border border-borderSoft dark:border-darkBorder px-4 py-3"
          style={{ opacity: 0.5 }}>
          <View className="flex-row items-center gap-1.5">
            <MessageCircle size={12} color={colors.textLight} strokeWidth={1.5} />
            <Caption style={{ color: colors.textLight, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 10 }}>
              {t.dailyQuestions.cardTitle}
            </Caption>
          </View>
          <Body size="sm" style={{ color: colors.textLight, marginTop: 4 }}>
            {t.dailyQuestions.noQuestion}
          </Body>
        </View>
      </Animated.View>
    );
  }

  const { question, myAnswer, partnerAnswer, partnerName } = data;
  const CategoryIcon = CATEGORY_ICON[question.category] ?? MessageCircle;
  const hasAnswered = !!myAnswer;
  const bothAnswered = hasAnswered && !!partnerAnswer;

  // Both answered: light card showing both snippets
  if (bothAnswered) {
    return (
      <Animated.View entering={FadeInDown.delay(160).duration(500)}>
        <Pressable
          onPress={() => navigation.navigate('DailyQuestions')}
          className="rounded-3xl overflow-hidden border border-borderSoft dark:border-darkBorder px-4 py-3"
          style={{ backgroundColor: colors.primaryMuted }}>

          {/* Header */}
          <View className="flex-row items-center gap-1.5 mb-2">
            <CategoryIcon size={12} color={colors.primary} strokeWidth={1.5} />
            <Caption style={{ color: colors.primary, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 10 }}>
              {t.dailyQuestions.cardTitle}
            </Caption>
            <View style={{ flex: 1 }} />
            <View className="flex-row items-center gap-0.5 rounded-full px-2 py-0.5" style={{ backgroundColor: colors.primary + '22' }}>
              <CheckCheck size={9} strokeWidth={2} color={colors.primary} />
              <Caption style={{ fontWeight: '700', color: colors.primary, fontSize: 10, marginLeft: 3 }}>2/2 ✓</Caption>
            </View>
          </View>

          {/* Both answer snippets */}
          <View style={{ gap: 8 }}>
            <View>
              <Caption style={{ color: colors.primary, fontWeight: '700', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 1 }}>
                {t.dailyQuestions.myAnswer}
              </Caption>
              <Body size="sm" style={{ color: colors.textDark }} numberOfLines={2}>{myAnswer}</Body>
            </View>
            <View>
              <Caption style={{ color: colors.primary, fontWeight: '700', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 1 }}>
                {t.dailyQuestions.partnerAnswer.replace('{name}', partnerName ?? 'Partner')}
              </Caption>
              <Body size="sm" style={{ color: colors.textDark }} numberOfLines={2}>{partnerAnswer}</Body>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // Not answered or waiting — primary colour card
  return (
    <Animated.View entering={FadeInDown.delay(160).duration(500)}>
      <Pressable
        onPress={() => navigation.navigate('DailyQuestions')}
        className="rounded-3xl overflow-hidden border border-borderSoft dark:border-darkBorder px-4 py-3"
        style={{ backgroundColor: colors.primary }}>

        {/* Header */}
        <View className="flex-row items-center gap-1.5 mb-2">
          <CategoryIcon size={12} color="#fff" strokeWidth={1.5} />
          <Caption style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 10 }}>
            {t.dailyQuestions.cardTitle}
          </Caption>
          <View style={{ flex: 1 }} />
          {hasAnswered && (
            <View className="flex-row items-center gap-0.5 bg-white/20 dark:bg-darkBgCard/20 rounded-full px-2 py-0.5">
              <Check size={9} strokeWidth={1.5} color="#fff" />
              <Caption style={{ fontWeight: '700', color: '#fff', fontSize: 10, marginLeft: 2 }}>{t.dailyQuestions.answered}</Caption>
            </View>
          )}
        </View>

        {/* State: Not answered — show question + CTA */}
        {!hasAnswered && (
          <>
            <Body size="md" style={{ color: '#fff', fontWeight: '700', lineHeight: 22, marginBottom: 10 }} numberOfLines={2}>
              {question.text}
            </Body>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Caption style={{ fontWeight: '700', color: '#fff', fontSize: 12 }}>{t.dailyQuestions.answerNow} →</Caption>
              </View>
            </View>
          </>
        )}

        {/* State: I answered, partner hasn't yet */}
        {hasAnswered && (
          <>
            <Body size="sm" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 18, marginBottom: 6 }} numberOfLines={2}>
              {myAnswer}
            </Body>
            <Caption style={{ color: 'rgba(255,255,255,0.6)' }}>
              {t.dailyQuestions.waitingForPartner.replace('{name}', partnerName ?? 'partner')}
            </Caption>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
