import React, { useState, useEffect } from 'react';
import {
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Heading, Body, Caption } from '../../components/Typography';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  ChevronDown,
  ChevronUp,
  Heart,
  HelpCircle,
  MessageCircle,
  Send,
  Smile,
  Star,
  Telescope,
  WifiOff,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppColors } from '../../navigation/theme';
import { useTranslation } from 'react-i18next';
import { useDailyQuestionsViewModel } from './useDailyQuestionsViewModel';
import ListHeader from '../../components/ListHeader';
import GlassTabBar from '../../components/GlassTabBar';
import LinearGradient from 'react-native-linear-gradient';
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
  const { t } = useTranslation();
  const meta = getCategoryMeta(category);
  const label = t(`dailyQuestions.categories.${category}`) || category;
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1 self-start"
      style={{ backgroundColor: meta.bg }}>
      <meta.icon size={11} color={meta.color} strokeWidth={1.5} />
      <Caption className="font-semibold" style={{ color: meta.color }}>
        {label}
      </Caption>
    </View>
  );
}

// ── ChatInputBar ──────────────────────────────────────────────────────────────

function ChatInputBar({
  answerText,
  setAnswerText,
  submitAnswer,
  isSubmitting,
  submitError,
}: {
  answerText: string;
  setAnswerText: (text: string) => void;
  submitAnswer: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const colors = useAppColors();
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const sendScale = useSharedValue(1);
  const canSubmit = answerText.trim().length > 0 && !isSubmitting;

  const sendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleSend = () => {
    if (!canSubmit) return;
    sendScale.value = withSequence(
      withTiming(0.88, { duration: 100 }),
      withSpring(1.0, { damping: 15, stiffness: 300 }),
    );
    submitAnswer();
  };

  return (
    <View
      style={{
        backgroundColor: colors.bgCard,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      {submitError ? (
        <Caption
          className="text-center mb-2"
          style={{ color: colors.errorColor }}
        >
          {submitError}
        </Caption>
      ) : null}
      <View className="flex-row items-end gap-2">
        <TextInput
          className="flex-1 text-textDark dark:text-darkTextDark"
          style={{
            backgroundColor: colors.baseBg,
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderWidth: 1.5,
            borderColor: isFocused
              ? colors.inputBorderFocus
              : 'rgba(232,120,138,0.18)',
            fontSize: 15,
            maxHeight: 96,
            lineHeight: 22,
          }}
          multiline
          placeholder={t('dailyQuestions.answerPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={answerText}
          onChangeText={setAnswerText}
          maxLength={500}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <Animated.View style={sendStyle}>
          <Pressable onPress={handleSend} disabled={!canSubmit}>
            <LinearGradient
              colors={
                canSubmit
                  ? [colors.primary, colors.primaryLight]
                  : ['rgba(232,120,138,0.30)', 'rgba(242,165,176,0.30)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={18} strokeWidth={2} color="#fff" />
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

// ── MyAnswerBubble ────────────────────────────────────────────────────────────

function MyAnswerBubble({ text }: { text: string }) {
  const colors = useAppColors();
  return (
    <Animated.View
      entering={FadeInDown.delay(0).duration(320)}
      className="self-end"
      style={{ maxWidth: '78%' }}
    >
      <View
        style={{
          backgroundColor: colors.primary,
          borderRadius: 18,
          borderBottomRightRadius: 4,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <Body size="md" style={{ color: '#FFFFFF', lineHeight: 22 }}>{text}</Body>
      </View>
    </Animated.View>
  );
}

// ── PartnerAnswerBubble ───────────────────────────────────────────────────────

function PartnerAnswerBubble({
  text,
  partnerName,
}: {
  text: string;
  partnerName: string | null;
}) {
  const colors = useAppColors();
  return (
    <Animated.View
      entering={FadeInDown.delay(120).duration(350)}
      className="self-start"
      style={{ maxWidth: '78%' }}
    >
      {partnerName ? (
        <Caption className="mb-1 font-medium" style={{ color: colors.textMid }}>
          {partnerName}
        </Caption>
      ) : null}
      <View
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          borderWidth: 1,
          borderColor: 'rgba(92,78,96,0.10)',
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <Body
          size="md"
          className="text-textDark dark:text-darkTextDark"
          style={{ lineHeight: 22 }}
        >
          {text}
        </Body>
      </View>
    </Animated.View>
  );
}

// ── TypingDotsBubble ──────────────────────────────────────────────────────────

function TypingDotsBubble({ partnerName }: { partnerName: string | null }) {
  const colors = useAppColors();
  const { t } = useTranslation();

  const dot1Y = useSharedValue(0);
  const dot2Y = useSharedValue(0);
  const dot3Y = useSharedValue(0);

  // Capture outside worklets (project memory rule)
  const dotColor = colors.textLight;

  useEffect(() => {
    const bounce = (sv: typeof dot1Y, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-5, { duration: 200, easing: Easing.inOut(Easing.sin) }),
            withTiming(0,  { duration: 200, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false,
        ),
      );
    };
    bounce(dot1Y, 0);
    bounce(dot2Y, 150);
    bounce(dot3Y, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1Y.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2Y.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3Y.value }] }));

  return (
    <Animated.View
      entering={FadeIn.delay(200).duration(400)}
      className="self-start gap-1.5"
    >
      <View
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          borderWidth: 1,
          borderColor: 'rgba(92,78,96,0.10)',
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
        }}
      >
        {[s1, s2, s3].map((s, i) => (
          <Animated.View
            key={i}
            style={[
              s,
              {
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: dotColor,
              },
            ]}
          />
        ))}
      </View>
      <Caption className="italic" style={{ color: colors.textLight }}>
        {t('dailyQuestions.waitingForPartner').replace(
          '{name}',
          partnerName ?? '♥',
        )}
      </Caption>
    </Animated.View>
  );
}

// ── FloatingStreakBadge ───────────────────────────────────────────────────────

function FloatingStreakBadge({
  streak,
  isAboutToBreak,
  bottomOffset,
}: {
  streak: number;
  isAboutToBreak: boolean;
  bottomOffset: number;
}) {
  const colors = useAppColors();

  const scale   = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glow    = useSharedValue(1);

  useEffect(() => {
    scale.value   = withDelay(300, withSpring(1.0, { damping: 14, stiffness: 200 }));
    opacity.value = withDelay(300, withTiming(1, { duration: 200 }));
    glow.value    = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1.10, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0,  { duration: 900, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glow.value }],
  }));

  const badgeColor  = isAboutToBreak ? '#D97706' : colors.primary;
  const gradStart   = isAboutToBreak ? '#FFF3CD' : '#FFE4EA';
  const gradEnd     = isAboutToBreak ? '#FEE08B' : '#FFD0DA';
  const glowBg      = isAboutToBreak
    ? 'rgba(245,158,11,0.18)'
    : 'rgba(232,120,138,0.18)';
  const shadowColor = isAboutToBreak ? '#F59E0B' : colors.primary;

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          position: 'absolute',
          right: 16,
          bottom: bottomOffset,
          zIndex: 99,
        },
      ]}
    >
      {/* Soft glow ring */}
      <Animated.View
        style={[
          glowStyle,
          {
            position: 'absolute',
            top: -5,
            left: -5,
            right: -5,
            bottom: -5,
            borderRadius: 26,
            backgroundColor: glowBg,
          },
        ]}
      />
      {/* Shadow wrapper */}
      <View
        style={{
          borderRadius: 20,
          shadowColor,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.28,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <LinearGradient
          colors={[gradStart, gradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20 }}
        >
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Body size="sm">🔥</Body>
            <Caption className="font-bold" style={{ color: badgeColor }}>
              {streak}{' '}
              <Caption style={{ color: badgeColor }}>days</Caption>
            </Caption>
          </View>
        </LinearGradient>
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
  const { t } = useTranslation();

  if (!todayData) return null;

  const { question, myAnswer, partnerAnswer, partnerName } = todayData;
  const meta = getCategoryMeta(question.category);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-4 pb-8 gap-5"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* ── Question card ── */}
        <Animated.View entering={FadeInDown.delay(50).duration(500)}>
          <View
            className="rounded-3xl overflow-hidden px-5 pt-5 pb-6"
            style={{ backgroundColor: colors.primary }}>
            <View className="flex-row items-center gap-2 mb-4">
              <View
                className="w-7 h-7 rounded-xl items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
                <meta.icon size={14} color="#fff" strokeWidth={1.5} />
              </View>
              <Caption className="font-bold text-white/70 tracking-widest uppercase">
                {t('dailyQuestions.questionLabel')}
              </Caption>
            </View>
            <Heading size="lg" className="text-white leading-snug">
              {question.text}
            </Heading>
            {question.textVi ? (
              <Body size="md" className="text-white/65 mt-2 italic leading-relaxed">
                {question.textVi}
              </Body>
            ) : null}
          </View>
        </Animated.View>

        {/* ── Answer chat bubbles (after answered) ── */}
        {hasAnswered ? (
          <Animated.View entering={FadeIn.duration(300)} className="gap-3">
            <Caption className="text-textLight dark:text-darkTextLight font-semibold uppercase tracking-wider px-1">
              {partnerAnswer
                ? t('dailyQuestions.bothAnswered')
                : t('dailyQuestions.answered')}
            </Caption>
            <MyAnswerBubble text={myAnswer!} />
            {partnerAnswer ? (
              <PartnerAnswerBubble
                text={partnerAnswer}
                partnerName={partnerName}
              />
            ) : (
              <TypingDotsBubble partnerName={partnerName} />
            )}
            {!partnerAnswer ? (
              <Caption className="text-textLight dark:text-darkTextLight text-center italic">
                {t('dailyQuestions.waitingHint')}
              </Caption>
            ) : null}
          </Animated.View>
        ) : null}
      </Animated.ScrollView>

      {/* ── Chat input bar — fixed below scroll, shown only when not answered ── */}
      {!hasAnswered ? (
        <ChatInputBar
          answerText={answerText}
          setAnswerText={setAnswerText}
          submitAnswer={submitAnswer}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

// ── HistoryItem ───────────────────────────────────────────────────────────────

function HistoryItemCard({ item }: { item: DailyQuestionHistoryItem }) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const [expanded, setExpanded] = useState(false);

  const date = item.myAnsweredAt
    ? new Date(item.myAnsweredAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <Pressable
      onPress={() => setExpanded(e => !e)}
      className="bg-white dark:bg-darkBgCard rounded-2xl overflow-hidden"
      style={{ borderWidth: 1, borderColor: 'rgba(226,220,232,0.6)' }}>

      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-2">
            <CategoryBadge category={item.question.category} />
            <Body size="md" className="font-semibold text-textDark dark:text-darkTextDark leading-snug">
              {item.question.text}
            </Body>
          </View>
          <View className="items-end gap-1.5">
            {date ? (
              <Caption className="text-textLight dark:text-darkTextLight font-medium">{date}</Caption>
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
              <Caption className="font-semibold text-primary">My answer</Caption>
            </View>
          ) : null}
          {item.partnerAnswer ? (
            <View className="rounded-full px-2.5 py-0.5 bg-accent/10">
              <Caption className="font-semibold text-accent">
                {item.partnerName ?? 'Partner'}&apos;s answer
              </Caption>
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
              <Caption className="font-bold text-primary uppercase tracking-wider mb-1.5">
                {t('dailyQuestions.myAnswer')}
              </Caption>
              <Body size="md" className="text-textMid dark:text-darkTextMid leading-relaxed">{item.myAnswer}</Body>
            </View>
          ) : null}
          {item.partnerAnswer ? (
            <View>
              <Caption className="font-bold text-accent uppercase tracking-wider mb-1.5">
                {t('dailyQuestions.partnerAnswer').replace('{name}', item.partnerName ?? '♥')}
              </Caption>
              <Body size="md" className="text-textMid dark:text-darkTextMid leading-relaxed">{item.partnerAnswer}</Body>
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
  const { t } = useTranslation();

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
        <Heading size="sm" className="text-textDark dark:text-darkTextDark text-center">
          {t('dailyQuestions.noHistory')}
        </Heading>
        <Body size="md" className="text-textLight dark:text-darkTextLight text-center leading-relaxed">
          {t('dailyQuestions.noHistorySubtitle')}
        </Body>
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
  const { t } = useTranslation();
  const colors = useAppColors();
  const vm = useDailyQuestionsViewModel();
  const navigation = useNavigation<any>();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const tabs = [
    { key: 'today' as const, label: t('dailyQuestions.todayTab') },
    { key: 'history' as const, label: t('dailyQuestions.historyTab') },
  ];

  // Streak badge visibility + break detection
  const lastDate = vm.lastAnsweredAt
    ? new Date(vm.lastAnsweredAt).toISOString().slice(0, 10)
    : null;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const isAboutToBreak = lastDate === yesterday && vm.currentStreak > 0;
  const showStreakBadge = vm.currentStreak > 0 || isAboutToBreak;

  // Float badge higher when chat input bar is visible
  const inputBarVisible = vm.activeTab === 'today' && !vm.hasAnswered;
  const badgeBottom = inputBarVisible ? 86 : 28;

  return (
    <View className="flex-1 bg-background">
      <ListHeader
        title={t('dailyQuestions.cardTitle')}
        subtitle="DAILY Q&A"
        onBack={() => navigation.goBack()}
        filterBar={
          <GlassTabBar
            tabs={tabs}
            activeTab={vm.activeTab}
            onTabPress={vm.setActiveTab}
          />
        }
      />

      {/* ── Content ── */}
      <View className="flex-1" style={{ paddingTop: 12 }}>
        {vm.activeTab === 'today' ? (
          vm.todayLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : vm.todayError ? (
            <View className="flex-1 items-center justify-center gap-3 px-8">
              <WifiOff size={28} color={colors.textLight} strokeWidth={1.5} />
              <Body size="sm" className="text-textLight dark:text-darkTextLight text-center">
                {t('dailyQuestions.errors.fetchFailed')}
              </Body>
              <Pressable
                onPress={() => vm.refetchToday()}
                className="px-6 py-2.5 rounded-full bg-primary/10"
              >
                <Body size="sm" className="font-semibold text-primary">Try again</Body>
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

      {/* ── Floating Streak Badge ── */}
      {showStreakBadge ? (
        <FloatingStreakBadge
          streak={vm.currentStreak}
          isAboutToBreak={isAboutToBreak}
          bottomOffset={badgeBottom}
        />
      ) : null}
    </View>
  );
}
