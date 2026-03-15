/**
 * Dashboard card for Daily Questions.
 * Shows today's question preview + answered status.
 * Tap to open DailyQuestionsTab full-screen.
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

  if (isLoading || !data) return null;

  const { question, myAnswer, partnerAnswer } = data;
  const CategoryIcon = CATEGORY_ICON[question.category] ?? MessageCircle;
  const hasAnswered = !!myAnswer;
  const bothAnswered = hasAnswered && !!partnerAnswer;

  // Hide if both answered
  if (bothAnswered) return null;

  return (
    <Animated.View entering={FadeInDown.delay(160).duration(500)}>
      <Pressable
        onPress={() => navigation.navigate('DailyQuestions')}
        className="rounded-3xl overflow-hidden border border-borderSoft px-4 py-3"
        style={{ backgroundColor: colors.primary }}>

        {/* Compact header */}
        <View className="flex-row items-center gap-1.5 mb-2">
          <CategoryIcon size={12} color="#fff" strokeWidth={1.5} />
          <Caption className="font-bold text-white/70 tracking-[1.2px] uppercase">
            {t.dailyQuestions.cardTitle}
          </Caption>
          <View className="flex-1" />
          {bothAnswered ? (
            <View className="flex-row items-center gap-0.5 bg-white/20 rounded-full px-2 py-0.5">
              <CheckCheck size={9} strokeWidth={1.5} />
              <Caption className="font-bold text-white">{t.dailyQuestions.bothAnswered}</Caption>
            </View>
          ) : hasAnswered ? (
            <View className="flex-row items-center gap-0.5 bg-white/20 rounded-full px-2 py-0.5">
              <Check size={9} strokeWidth={1.5} color='#fff'/>
              <Caption className="font-bold text-white">{t.dailyQuestions.answered}</Caption>
            </View>
          ) : null}
        </View>

        {/* Question preview (compact) */}
        <Body size="md" className="font-bold text-white leading-tight" numberOfLines={2}>
          {question.text}
        </Body>
      </Pressable>
    </Animated.View>
  );
}
