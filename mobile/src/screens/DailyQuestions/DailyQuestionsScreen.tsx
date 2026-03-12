import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { ChevronDown, ChevronUp, Clock, Heart, HelpCircle, MessageCircle, Send, Smile, Star, Telescope, User, Users, WifiOff } from 'lucide-react-native';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useDailyQuestionsViewModel } from './useDailyQuestionsViewModel';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import GlassTabBar from '../../components/GlassTabBar';
import type { DailyQuestionHistoryItem } from '../../types';

// ── Category meta ──────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; color: string; bg: string }> = {
  general:  { icon: MessageCircle, color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  deep:     { icon: Star,          color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  fun:      { icon: Smile,         color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  intimacy: { icon: Heart,         color: '#E8788A', bg: 'rgba(232,120,138,0.12)' },
  future:   { icon: Telescope,     color: '#7EC8B5', bg: 'rgba(126,200,181,0.12)' },
};

function getCategoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? CATEGORY_META.general!;
}

// ── CategoryBadge ─────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const meta = getCategoryMeta(category);
  const label = t.dailyQuestions.categories[category as keyof typeof t.dailyQuestions.categories]
    ?? category;
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1 self-start"
      style={{ backgroundColor: meta.bg }}>
      <meta.icon size={11} color={meta.color} strokeWidth={1.5} />
      <Text className="text-[11px] font-semibold" style={{ color: meta.color }}>
        {label}
      </Text>
    </View>
  );
}

// ── AnswerCard ────────────────────────────────────────────────────────────────

function AnswerCard({
  label,
  answer,
  isPartner,
  delay = 0,
}: {
  label: string;
  answer: string;
  isPartner?: boolean;
  delay?: number;
}) {
  const colors = useAppColors();
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} className="flex-1">
      <View
        className="rounded-2xl bg-white px-4 py-4 flex-1"
        style={{
          borderLeftWidth: 3,
          borderLeftColor: isPartner ? colors.accent : colors.primary,
        }}>
        <View className="flex-row items-center gap-1.5 mb-2">
          {isPartner
            ? <Users size={13} color={colors.accent} strokeWidth={1.5} />
            : <User size={13} color={colors.primary} strokeWidth={1.5} />}
          <Text
            className="text-[11px] font-bold tracking-wide uppercase"
            style={{ color: isPartner ? colors.accent : colors.primary }}>
            {label}
          </Text>
        </View>
        <Text className="text-sm text-textDark leading-relaxed">{answer}</Text>
      </View>
    </Animated.View>
  );
}

// ── WaitingCard ───────────────────────────────────────────────────────────────

function WaitingCard({ partnerName }: { partnerName: string | null }) {
  const colors = useAppColors();
  const name = partnerName ?? 'your partner';
  return (
    <Animated.View entering={FadeIn.delay(200).duration(500)} className="flex-1">
      <View
        className="rounded-2xl px-4 py-4 flex-1 items-center justify-center"
        style={{
          backgroundColor: 'rgba(126,200,181,0.06)',
          borderWidth: 1,
          borderColor: 'rgba(126,200,181,0.15)',
          borderStyle: 'dashed',
        }}>
        <Clock size={20} color={colors.textLight} strokeWidth={1.5} />
        <Text className="text-xs text-textLight text-center mt-2 leading-relaxed">
          {t.dailyQuestions.waitingForPartner.replace('{name}', name)}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── TodayView ─────────────────────────────────────────────────────────────────

function TodayView({
  todayData,
  hasAnswered,
  answerText,
  setAnswerText,
  submitAnswer,
  isSubmitting,
  submitError,
  onScroll,
}: ReturnType<typeof import('./useDailyQuestionsViewModel').useDailyQuestionsViewModel> & {
  onScroll: ReturnType<typeof useAnimatedScrollHandler>;
}) {
  const colors = useAppColors();
  const inputRef = useRef<TextInput>(null);

  if (!todayData) return null;

  const { question, myAnswer, partnerAnswer, partnerName } = todayData;
  const meta = getCategoryMeta(question.category);
  const canSubmit = answerText.trim().length > 0 && !isSubmitting;

  return (
    <Animated.ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="px-4 pb-12 gap-5"
      onScroll={onScroll}
      scrollEventThrottle={16}>

      {/* ── Question card ── */}
      <Animated.View entering={FadeInDown.delay(50).duration(500)}>
        <View
          className="rounded-3xl overflow-hidden shadow-sm px-5 pt-5 pb-6"
          style={{ backgroundColor: colors.primary }}>
          {/* Category */}
          <View className="flex-row items-center gap-2 mb-4">
            <View
              className="w-7 h-7 rounded-xl items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
              <meta.icon size={14} color="#fff" strokeWidth={1.5} />
            </View>
            <Text className="text-[11px] font-bold text-white/70 tracking-widest uppercase">
              {t.dailyQuestions.questionLabel}
            </Text>
          </View>

          {/* Question text */}
          <Text className="text-xl font-bold text-white leading-snug">
            {question.text}
          </Text>

          {/* Vietnamese translation */}
          {question.textVi ? (
            <Text className="text-[13px] text-white/65 mt-2 italic leading-relaxed">
              {question.textVi}
            </Text>
          ) : null}
        </View>
      </Animated.View>

      {/* ── Answer input or answers revealed ── */}
      {!hasAnswered ? (
        <Animated.View entering={FadeInDown.delay(120).duration(450)} className="gap-3">
          <TextInput
            ref={inputRef}
            className="bg-white rounded-2xl px-4 py-3.5 text-sm text-textDark"
            style={{
              borderWidth: 1,
              borderColor: 'rgba(232,120,138,0.20)',
              minHeight: 100,
              textAlignVertical: 'top',
              fontSize: 14,
            }}
            multiline
            placeholder={t.dailyQuestions.answerPlaceholder}
            placeholderTextColor={colors.textLight}
            value={answerText}
            onChangeText={setAnswerText}
            maxLength={500}
          />

          {/* Character count */}
          <Text className="text-[10px] text-textLight text-right">
            {answerText.length}/500
          </Text>

          {/* Error */}
          {submitError ? (
            <Text className="text-[12px] text-error text-center">{submitError}</Text>
          ) : null}

          {/* Submit */}
          <Pressable
            onPress={submitAnswer}
            disabled={!canSubmit}
            className="rounded-2xl py-4 items-center justify-center flex-row gap-2"
            style={{
              backgroundColor: canSubmit ? colors.primary : 'rgba(232,120,138,0.30)',
            }}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={16} strokeWidth={1.5} />
            )}
            <Text className="text-white font-bold text-[15px]">
              {isSubmitting ? t.dailyQuestions.submitting : t.dailyQuestions.submitAnswer}
            </Text>
          </Pressable>
        </Animated.View>
      ) : (
        /* ── Both answers revealed ── */
        <Animated.View entering={FadeIn.duration(400)} className="gap-3">
          <Text className="text-xs text-textLight font-semibold uppercase tracking-wider px-1">
            {partnerAnswer ? t.dailyQuestions.bothAnswered : t.dailyQuestions.answered}
          </Text>
          <View className="flex-row gap-3">
            <AnswerCard
              label={t.dailyQuestions.myAnswer}
              answer={myAnswer!}
              delay={0}
            />
            {partnerAnswer ? (
              <AnswerCard
                label={t.dailyQuestions.partnerAnswer.replace('{name}', partnerName ?? '♥')}
                answer={partnerAnswer}
                isPartner
                delay={120}
              />
            ) : (
              <WaitingCard partnerName={partnerName} />
            )}
          </View>

          {/* Hint if waiting */}
          {!partnerAnswer ? (
            <Text className="text-[11px] text-textLight text-center italic">
              {t.dailyQuestions.waitingHint}
            </Text>
          ) : null}
        </Animated.View>
      )}
    </Animated.ScrollView>
  );
}

// ── HistoryItem ───────────────────────────────────────────────────────────────

function HistoryItemCard({ item }: { item: DailyQuestionHistoryItem }) {
  const colors = useAppColors();
  const [expanded, setExpanded] = React.useState(false);

  const date = item.myAnsweredAt
    ? new Date(item.myAnsweredAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <Pressable
      onPress={() => setExpanded(e => !e)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm"
      style={{ borderWidth: 1, borderColor: 'rgba(226,220,232,0.6)' }}>

      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-2">
            <CategoryBadge category={item.question.category} />
            <Text className="text-[14px] font-semibold text-textDark leading-snug">
              {item.question.text}
            </Text>
          </View>
          <View className="items-end gap-1.5">
            {date ? (
              <Text className="text-[10px] text-textLight font-medium">{date}</Text>
            ) : null}
            {expanded
              ? <ChevronUp size={16} color={colors.textLight} strokeWidth={1.5} />
              : <ChevronDown size={16} color={colors.textLight} strokeWidth={1.5} />}
          </View>
        </View>

        {/* Status pill */}
        <View className="flex-row gap-1.5 mt-2.5">
          {item.myAnswer ? (
            <View className="rounded-full px-2.5 py-0.5 bg-primary/10">
              <Text className="text-[10px] font-semibold text-primary">My answer</Text>
            </View>
          ) : null}
          {item.partnerAnswer ? (
            <View className="rounded-full px-2.5 py-0.5 bg-accent/10">
              <Text className="text-[10px] font-semibold text-accent">
                {item.partnerName ?? 'Partner'}&apos;s answer
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Expanded answers */}
      {expanded ? (
        <Animated.View
          entering={FadeInDown.duration(250)}
          className="px-4 pb-4 gap-3">
          <View className="h-px bg-border" />
          {item.myAnswer ? (
            <View>
              <Text className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">
                {t.dailyQuestions.myAnswer}
              </Text>
              <Text className="text-[13px] text-textMid leading-relaxed">{item.myAnswer}</Text>
            </View>
          ) : null}
          {item.partnerAnswer ? (
            <View>
              <Text className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1.5">
                {t.dailyQuestions.partnerAnswer.replace('{name}', item.partnerName ?? '♥')}
              </Text>
              <Text className="text-[13px] text-textMid leading-relaxed">{item.partnerAnswer}</Text>
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

// ── HistoryView ───────────────────────────────────────────────────────────────

function HistoryView({
  historyItems,
  historyLoading,
  historyPage,
  loadNextPage,
  onScroll,
}: Pick<
  ReturnType<typeof import('./useDailyQuestionsViewModel').useDailyQuestionsViewModel>,
  'historyItems' | 'historyLoading' | 'historyPage' | 'loadNextPage'
> & { onScroll: ReturnType<typeof useAnimatedScrollHandler> }) {
  const colors = useAppColors();

  if (historyLoading && historyPage === 1) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!historyLoading && historyItems.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-8">
        <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
          <HelpCircle size={28} color={colors.primary} strokeWidth={1.5} />
        </View>
        <Text className="text-base font-semibold text-textDark text-center">
          {t.dailyQuestions.noHistory}
        </Text>
        <Text className="text-sm text-textLight text-center leading-relaxed">
          {t.dailyQuestions.noHistorySubtitle}
        </Text>
      </View>
    );
  }

  return (
    <Animated.FlatList
      data={historyItems}
      keyExtractor={item => item.question.id}
      renderItem={({ item }) => <HistoryItemCard item={item} />}
      contentContainerClassName="px-4 pb-12 gap-3"
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onEndReached={loadNextPage}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        historyLoading && historyPage > 1 ? (
          <ActivityIndicator className="mt-4" color={colors.primary} />
        ) : null
      }
    />
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function DailyQuestionsScreen() {
  const colors = useAppColors();
  const navigation = useNavigation();
  const vm = useDailyQuestionsViewModel();
  const canGoBack = navigation.canGoBack();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const tabs = [
    { key: 'today' as const, label: t.dailyQuestions.todayTab },
    { key: 'history' as const, label: t.dailyQuestions.historyTab },
  ];

  return (
    <View className="flex-1 bg-background">
      <CollapsibleHeader
        title={t.dailyQuestions.cardTitle}
        subtitle="DAILY Q&A"
        expandedHeight={140}
        collapsedHeight={96}
        scrollY={scrollY}
        dark
        onBack={canGoBack ? vm.goBack : undefined}
        renderFooter={() => (
          <GlassTabBar
            tabs={tabs}
            activeTab={vm.activeTab}
            onTabPress={vm.setActiveTab}
          />
        )}
      />

      {/* ── Content ── */}
      <View style={{paddingTop: 60, flex: 1}}>
        {vm.activeTab === 'today' ? (
          vm.todayLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : vm.todayError ? (
            <View className="flex-1 items-center justify-center gap-3 px-8">
              <WifiOff size={28} color={colors.textLight} strokeWidth={1.5} />
              <Text className="text-sm text-textLight text-center">
                {t.dailyQuestions.errors.fetchFailed}
              </Text>
              <Pressable onPress={() => vm.refetchToday()} className="px-6 py-2.5 rounded-full bg-primary/10">
                <Text className="text-sm font-semibold text-primary">Try again</Text>
              </Pressable>
            </View>
          ) : (
            <TodayView {...vm} onScroll={scrollHandler} />
          )
        ) : (
          <HistoryView
            historyItems={vm.historyItems}
            historyLoading={vm.historyLoading}
            historyPage={vm.historyPage}
            loadNextPage={vm.loadNextPage}
            onScroll={scrollHandler}
          />
        )}
      </View>
    </View>
  );
}
