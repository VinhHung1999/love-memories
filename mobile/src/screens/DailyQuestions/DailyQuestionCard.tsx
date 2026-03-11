/**
 * Dashboard card for Daily Questions.
 * Shows today's question preview + answered status.
 * Tap to open DailyQuestionsTab full-screen.
 */
import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { dailyQuestionsApi } from '../../lib/api';
import t from '../../locales/en';
import type { DailyQuestionToday } from '../../types';
import { GradientCard } from '../../components/GradientCard';

const CATEGORY_ICON: Record<string, string> = {
  general:  'chat-outline',
  deep:     'star-four-points',
  fun:      'emoticon-happy-outline',
  intimacy: 'heart-outline',
  future:   'telescope',
};

export default function DailyQuestionCard() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const { data, isLoading } = useQuery<DailyQuestionToday>({
    queryKey: ['daily-question-today'],
    queryFn: dailyQuestionsApi.today,
    enabled: !!user,
    staleTime: 60_000,
  });

  if (isLoading || !data) return null;

  const { question, myAnswer, partnerAnswer } = data;
  const icon = CATEGORY_ICON[question.category] ?? 'chat-outline';
  const hasAnswered = !!myAnswer;
  const bothAnswered = hasAnswered && !!partnerAnswer;

  // Hide if both answered
  if (bothAnswered) return null;

  return (
    <Animated.View entering={FadeInDown.delay(160).duration(500)}>
      <GradientCard
        colors={['#FF6B6B', '#FF8E8E', '#FFB4B4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-4 py-2.5"
        pressableClassName="shadow-lg shadow-primary/30"
        onPress={() => navigation.navigate('DailyQuestionsTab')}>

        {/* Compact header */}
        <View className="flex-row items-center gap-1.5 mb-2">
          <Icon name={icon} size={12} color="#fff" />
          <Text className="text-[9px] font-bold text-white/70 tracking-[1.2px] uppercase">
            {t.dailyQuestions.cardTitle}
          </Text>
          <View className="flex-1" />
          {bothAnswered ? (
            <View className="flex-row items-center gap-0.5 bg-white/20 rounded-full px-2 py-0.5">
              <Icon name="check-all" size={9} color="#fff" />
              <Text className="text-[8px] font-bold text-white">{t.dailyQuestions.bothAnswered}</Text>
            </View>
          ) : hasAnswered ? (
            <View className="flex-row items-center gap-0.5 bg-white/20 rounded-full px-2 py-0.5">
              <Icon name="check" size={9} color="#fff" />
              <Text className="text-[8px] font-bold text-white">{t.dailyQuestions.answered}</Text>
            </View>
          ) : null}
        </View>

        {/* Question preview (compact) */}
        <Text className="text-[14px] font-bold text-white leading-tight" numberOfLines={2}>
          {question.text}
        </Text>
      </GradientCard>
    </Animated.View>
  );
}
