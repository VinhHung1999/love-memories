/**
 * Dashboard card for Daily Questions.
 * Shows today's question preview + answered status.
 * Tap to open DailyQuestionsTab full-screen.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { dailyQuestionsApi } from '../../lib/api';
import t from '../../locales/en';
import type { DailyQuestionToday } from '../../types';

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

  return (
    <Animated.View entering={FadeInDown.delay(160).duration(500)}>
      <Pressable
        onPress={() => navigation.navigate('DailyQuestionsTab')}
        className="rounded-3xl overflow-hidden"
        style={{
          shadowColor: '#E8788A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 6,
        }}>
        <LinearGradient
          colors={['#C3517A', '#E8788A', '#F4A261']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-5 pt-4 pb-5">

          {/* Label row */}
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-7 h-7 rounded-xl items-center justify-center bg-white/20">
              <Icon name={icon} size={14} color="#fff" />
            </View>
            <Text className="text-[11px] font-semibold text-white/65 tracking-widest uppercase">
              {t.dailyQuestions.cardTitle}
            </Text>
            <View className="flex-1" />
            {bothAnswered ? (
              <View className="flex-row items-center gap-1 bg-white/20 rounded-full px-2.5 py-0.5">
                <Icon name="check-all" size={11} color="#fff" />
                <Text className="text-[10px] font-bold text-white">{t.dailyQuestions.bothAnswered}</Text>
              </View>
            ) : hasAnswered ? (
              <View className="flex-row items-center gap-1 bg-white/20 rounded-full px-2.5 py-0.5">
                <Icon name="check" size={11} color="#fff" />
                <Text className="text-[10px] font-bold text-white">{t.dailyQuestions.answered}</Text>
              </View>
            ) : null}
          </View>

          {/* Question preview */}
          <Text className="text-[16px] font-bold text-white leading-snug" numberOfLines={2}>
            {question.text}
          </Text>

          {/* CTA */}
          <View className="flex-row items-center gap-1.5 mt-3">
            <Text className="text-[12px] font-semibold text-white/75">
              {hasAnswered ? 'See answers' : 'Answer now'}
            </Text>
            <Icon name="arrow-right" size={14} color="rgba(255,255,255,0.75)" />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
