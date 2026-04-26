import { useRouter } from 'expo-router';
import { Lock, Sparkle } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';

import { HeaderChip, LinearGradient, SafeScreen, ScreenHeader } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { AnswerInput } from './components/AnswerInput';
import { PulseDot } from './components/PulseDot';
import { useDailyQuestionsViewModel } from './useDailyQuestionsViewModel';
import type {
  DailyQuestionHistoryItem,
  DailyQuestionToday,
} from '@/api/dailyQuestions';

// Sprint 66 T427 — DailyQuestionsScreen. Renders ONE of two layouts based
// on `myAnswer` presence:
//
//   • Unanswered — bám 1:1 prototype recap.jsx:891+ (DailyQUnansweredScreen).
//     Hero card + partner-thinking pill + AnswerInput + locked partner reveal
//     + Today's vibe chips + Yesterday hint.
//
//   • Answered — bám 1:1 prototype more-screens.jsx:97-205 (DailyQScreen).
//     Hero card (different gradient) + Your answer + Partner answer (or
//     skeleton) + history rows.
//
// Optimistic submit flips the layout immediately; the BE sync happens in
// the background and pulls partner-answer + new streak when it lands.

export function DailyQuestionsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const vm = useDailyQuestionsViewModel();

  const isAnswered = !!vm.today?.myAnswer;
  const partnerName = vm.partnerName ?? '';
  const myInitial = useMemo(() => firstChar(vm.myName), [vm.myName]);
  const partnerInitial = useMemo(() => firstChar(partnerName), [partnerName]);

  const onSubmit = useCallback(
    async (text: string) => {
      const res = await vm.submit(text);
      if (!res.ok && res.message) {
        Alert.alert('', t(`dailyQuestions.${res.message}`));
      }
    },
    [vm, t],
  );

  const streakLabel = vm.streak && vm.streak.currentStreak > 0
    ? `🔥 ${t('dailyQuestions.streak', { n: vm.streak.currentStreak })}`
    : `🔥 ${t('dailyQuestions.streakZero')}`;

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        // T432-F1 (Boss Build 103): default ScrollView behaviour eats the
        // first tap on the AnswerInput textarea — keyboard dismisses + the
        // input blurs before focus locks. `'handled'` lets nested touchables
        // (Send button, future tap-to-revisit history rows) receive taps,
        // while still dismissing the keyboard on empty-space taps.
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={vm.refreshing}
            onRefresh={vm.refresh}
            tintColor={c.primary}
          />
        }
      >
        <ScreenHeader
          showBack
          onBack={() => router.back()}
          title={t('dailyQuestions.title')}
          subtitle={t('dailyQuestions.subtitle')}
          right={<HeaderChip label={streakLabel} variant="accent" />}
        />

        {vm.loading && !vm.today ? (
          <LoadingState />
        ) : vm.error && !vm.today ? (
          <ErrorState message={t('dailyQuestions.errorLoad')} />
        ) : !vm.today ? (
          <EmptyState
            title={t('dailyQuestions.emptyTitle')}
            body={t('dailyQuestions.emptyBody')}
          />
        ) : (
          <>
            {isAnswered ? (
              <AnsweredView
                today={vm.today}
                history={vm.history}
                partnerInitial={partnerInitial}
                myInitial={myInitial}
                myName={vm.myName}
                partnerName={partnerName}
                lang={i18n.language}
                t={t}
              />
            ) : (
              <UnansweredView
                today={vm.today}
                history={vm.history}
                myName={vm.myName}
                partnerInitial={partnerInitial}
                partnerName={partnerName}
                onSubmit={onSubmit}
                submitting={vm.submitting}
                t={t}
                lang={i18n.language}
              />
            )}
          </>
        )}

        <View className="h-[150px]" />
      </ScrollView>
    </SafeScreen>
  );
}

// ─── Unanswered layout ───────────────────────────────────────────────────

type UnansweredProps = {
  today: DailyQuestionToday;
  history: DailyQuestionHistoryItem[];
  myName: string;
  partnerInitial: string;
  partnerName: string;
  onSubmit: (text: string) => void;
  submitting: boolean;
  t: ReturnType<typeof useTranslation>['t'];
  lang: string;
};

function UnansweredView({
  today,
  history,
  myName,
  partnerInitial,
  partnerName,
  onSubmit,
  submitting,
  t,
  lang,
}: UnansweredProps) {
  const questionText = today.question.textVi ?? today.question.text;
  const dateLabel = formatTodayBadge(new Date(), lang, t);
  const nameDisplay = partnerName || t('dailyQuestions.partnerLockedNotYet');
  const yesterday = history[0] ?? null;

  return (
    <>
      {/* (1) Hero question card */}
      <HeroQuestionCard
        question={questionText}
        kicker={dateLabel}
        questionCounter={t('dailyQuestions.questionCounter', { n: 89 })}
        attribution={
          partnerName
            ? t('dailyQuestions.memouraAsks', { a: myName, b: partnerName })
            : t('dailyQuestions.memouraAsksSolo', { a: myName })
        }
        partnerInitial={partnerInitial}
      />

      {/* T432-F4 (Boss Build 103): partner thinking card removed —
          duplicates the "Chưa trả lời" state already shown by the locked
          partner reveal below. */}

      {/* (2) Input card — naked (T433 RESCUE) */}
      <AnswerInput
        placeholder={
          partnerName
            ? t('dailyQuestions.inputPlaceholder', { partner: partnerName })
            : t('dailyQuestions.inputPlaceholderSolo')
        }
        sendLabel={t('dailyQuestions.send')}
        submitting={submitting}
        onSubmit={onSubmit}
      />

      {/* (3) Locked partner reveal */}
      {partnerName ? (
        <LockedPartnerCard
          partnerName={nameDisplay}
          partnerInitial={partnerInitial}
          notYetLabel={t('dailyQuestions.partnerLockedNotYet')}
          lockedPill={t('dailyQuestions.partnerLockedPill')}
          hint={t('dailyQuestions.partnerLockedHint', { partner: partnerName })}
        />
      ) : null}

      {/* T437 RM (Boss 2026-04-26): Vibes UI removed. BE schema kept
          idle in case Boss revisits. */}

      {/* (4) Yesterday hint */}
      {yesterday ? (
        <YesterdayHint item={yesterday} title={t('dailyQuestions.yesterdayTitle')} note={t('dailyQuestions.yesterdayBoth')} lang={lang} />
      ) : null}
    </>
  );
}

// ─── Answered layout ─────────────────────────────────────────────────────

type AnsweredProps = {
  today: DailyQuestionToday;
  history: DailyQuestionHistoryItem[];
  partnerInitial: string;
  myInitial: string;
  myName: string;
  partnerName: string;
  lang: string;
  t: ReturnType<typeof useTranslation>['t'];
};

function AnsweredView({
  today,
  history,
  partnerInitial,
  myInitial,
  myName,
  partnerName,
  lang,
  t,
}: AnsweredProps) {
  const c = useAppColors();
  const questionText = today.question.textVi ?? today.question.text;
  const partnerHasAnswered = !!today.partnerAnswer;
  const dateLabel = formatTodayBadge(new Date(), lang, t);

  return (
    <>
      {/* (1) Question card — different gradient from unanswered */}
      <View
        className="mx-5 mt-5 rounded-[24px] overflow-hidden"
        style={{ borderWidth: 1, borderColor: c.lineOnSurface }}
      >
        <LinearGradient
          colors={[c.accentSoft, c.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <View className="px-5 pt-5 pb-5 relative">
          <Text
            className="font-displayItalic text-[11px] uppercase"
            style={{ color: c.accent, letterSpacing: 1.6 }}
          >
            {dateLabel}
          </Text>
          <Text className="font-displayItalic text-[24px] leading-[30px] mt-3" style={{ color: c.ink }}>
            {`"${questionText}"`}
          </Text>
        </View>
      </View>

      {/* (2) Your answer */}
      <View className="mx-5 mt-5">
        <Text
          className="font-bodyBold text-[11px] uppercase mb-2"
          style={{ color: c.inkMute, letterSpacing: 1.4 }}
        >
          {t('dailyQuestions.yourAnswer')}
        </Text>
        <View
          className="px-4 py-3.5 rounded-[18px]"
          style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.lineOnSurface }}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-[26px] h-[26px] rounded-full overflow-hidden items-center justify-center">
              <LinearGradient
                colors={[c.heroA, c.heroB]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
              />
              <Text className="font-bodyBold text-white text-[11px] relative">{myInitial}</Text>
            </View>
            <Text className="font-bodySemibold text-[12px]" style={{ color: c.ink }}>
              {myName}
            </Text>
          </View>
          <Text className="font-body text-[14px] leading-[21px]" style={{ color: c.ink }}>
            {today.myAnswer}
          </Text>
        </View>
      </View>

      {/* (3) Partner answer */}
      <View className="mx-5 mt-4">
        <Text
          className="font-bodyBold text-[11px] uppercase mb-2"
          style={{ color: c.inkMute, letterSpacing: 1.4 }}
        >
          {t('dailyQuestions.partnerLabel', { partner: partnerName || t('dailyQuestions.partnerLockedNotYet') })}
        </Text>
        <View
          className="px-4 py-3.5 rounded-[18px] overflow-hidden"
          style={{ borderWidth: 1, borderColor: c.lineOnSurface }}
        >
          <LinearGradient
            colors={[c.primarySoft, c.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0"
          />
          <View className="relative">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-[26px] h-[26px] rounded-full overflow-hidden items-center justify-center">
                <LinearGradient
                  colors={[c.secondary, c.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="absolute inset-0"
                />
                <Text className="font-bodyBold text-white text-[11px] relative">{partnerInitial || 'M'}</Text>
              </View>
              <Text className="font-bodySemibold text-[12px]" style={{ color: c.ink }}>
                {partnerName || t('dailyQuestions.partnerLockedNotYet')}
              </Text>
            </View>
            {partnerHasAnswered ? (
              <Text className="font-body text-[14px] leading-[21px]" style={{ color: c.ink }}>
                {today.partnerAnswer}
              </Text>
            ) : (
              <Text className="font-displayItalic text-[14px] leading-[21px]" style={{ color: c.inkMute }}>
                {t('dailyQuestions.partnerSkeleton', { partner: partnerName || t('dailyQuestions.partnerLockedNotYet') })}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* T437 RM (Boss 2026-04-26): Vibes UI removed. */}

      {/* (4) Earlier history rows */}
      {history.length > 0 ? (
        <View className="mx-5 mt-6">
          <Text
            className="font-bodyBold text-[11px] uppercase mb-2.5"
            style={{ color: c.inkMute, letterSpacing: 1.4 }}
          >
            {t('dailyQuestions.history')}
          </Text>
          {history.map((item) => (
            <HistoryRow key={item.question.id} item={item} lang={lang} />
          ))}
        </View>
      ) : null}
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function HeroQuestionCard({
  question,
  kicker,
  questionCounter,
  attribution,
  partnerInitial,
}: {
  question: string;
  kicker: string;
  questionCounter: string;
  attribution: string;
  partnerInitial: string;
}) {
  const c = useAppColors();
  return (
    <View
      className="mx-5 mt-5 rounded-[26px] overflow-hidden"
      style={{ borderWidth: 1, borderColor: c.lineOnSurface }}
    >
      <LinearGradient
        colors={[c.accentSoft, c.surface]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      {/* Giant decorative quote glyph — abs positioned, low opacity. */}
      <Text
        className="font-display absolute"
        style={{
          top: -40,
          right: 16,
          fontSize: 180,
          lineHeight: 180,
          color: c.accent,
          opacity: 0.18,
        }}
      >
        “
      </Text>

      <View className="px-5 pt-6 pb-6 relative">
        {/* Date badge row */}
        <View className="flex-row items-center gap-2.5">
          <View
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: c.accent }}
          >
            <PulseDot color="#ffffff" />
            <Text
              className="font-bodyBold text-white text-[11px]"
              style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}
            >
              {kicker}
            </Text>
          </View>
          <View
            className="px-2.5 py-1 rounded-full"
            style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.lineOnSurface }}
          >
            <Text
              className="font-bodyBold text-[10px] uppercase"
              style={{ color: c.inkMute, letterSpacing: 0.9 }}
            >
              {questionCounter}
            </Text>
          </View>
        </View>

        {/* Question text */}
        <Text
          className="font-displayItalic text-[26px] leading-[33px] mt-4"
          style={{ color: c.ink }}
        >
          {question}
        </Text>

        {/* Attribution row */}
        <View
          className="flex-row items-center gap-2 mt-4 pt-3.5"
          style={{ borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: c.lineOnSurface }}
        >
          <View
            className="w-[22px] h-[22px] rounded-full items-center justify-center"
            style={{ backgroundColor: c.accent }}
          >
            <Text className="font-bodyBold text-white text-[10px]">{partnerInitial || 'M'}</Text>
          </View>
          <Text className="font-displayItalic text-[12px]" style={{ color: c.inkSoft }}>
            {attribution}
          </Text>
        </View>
      </View>
    </View>
  );
}

function LockedPartnerCard({
  partnerName,
  partnerInitial,
  notYetLabel,
  lockedPill,
  hint,
}: {
  partnerName: string;
  partnerInitial: string;
  notYetLabel: string;
  lockedPill: string;
  hint: string;
}) {
  const c = useAppColors();
  // 4 placeholder bars varying width + low opacity to mimic the prototype's
  // CSS `filter: blur(6px) opacity(0.6)`. RN doesn't support text blur on
  // arbitrary children; the visual intent is "you can see something is
  // there but not what it says".
  const barWidths = ['92%', '78%', '85%', '48%'] as const;
  return (
    <View
      className="mx-5 mt-3.5 rounded-[20px] px-4 pt-4 pb-3.5"
      style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.lineOnSurface }}
    >
      <View className="flex-row items-center gap-2.5 mb-3">
        <View className="w-7 h-7 rounded-full overflow-hidden items-center justify-center">
          <LinearGradient
            colors={[c.secondary, c.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0"
          />
          <Text className="font-bodyBold text-white text-[12px] relative">{partnerInitial || 'M'}</Text>
        </View>
        <View className="flex-1 min-w-0">
          <Text className="font-bodyBold text-[12px]" style={{ color: c.ink }}>
            {partnerName}
          </Text>
          <Text className="font-body text-[10px] mt-0.5" style={{ color: c.inkMute }}>
            {notYetLabel}
          </Text>
        </View>
        <View
          className="flex-row items-center gap-1 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: c.surfaceAlt }}
        >
          <Lock size={11} strokeWidth={1.8} color={c.inkMute} />
          <Text className="font-bodyBold text-[10px]" style={{ color: c.inkMute }}>
            {lockedPill}
          </Text>
        </View>
      </View>

      {/* Blurred-style placeholder bars */}
      <View>
        {barWidths.map((w, i) => (
          <View
            key={i}
            className="h-[10px] rounded-[5px]"
            style={{
              backgroundColor: c.surfaceAlt,
              width: w,
              marginBottom: i < barWidths.length - 1 ? 6 : 0,
              opacity: 0.6,
            }}
          />
        ))}
      </View>

      {/* Accent hint pill */}
      <View
        className="flex-row items-center gap-2 mt-3 px-3 py-2.5 rounded-xl"
        style={{ backgroundColor: c.accentSoft }}
      >
        <Sparkle size={14} strokeWidth={1.8} color={c.accent} fill={c.accent} />
        <Text
          className="flex-1 font-bodySemibold text-[12px]"
          style={{ color: c.accent }}
        >
          {hint}
        </Text>
      </View>
    </View>
  );
}

function YesterdayHint({
  item,
  title,
  note,
  lang,
}: {
  item: DailyQuestionHistoryItem;
  title: string;
  note: string;
  lang: string;
}) {
  const c = useAppColors();
  const text = item.question.textVi ?? item.question.text;
  const date = item.myAnsweredAt ? new Date(item.myAnsweredAt) : null;
  const day = date ? String(date.getDate()) : '';
  const monthLabel = date
    ? lang === 'vi'
      ? `T${date.getMonth() + 1}`
      : date.toLocaleDateString('en', { month: 'short' })
    : '';

  return (
    <View className="mx-5 mt-6">
      <Text
        className="font-bodyBold text-[11px] uppercase mb-2.5"
        style={{ color: c.inkMute, letterSpacing: 1.4 }}
      >
        {title}
      </Text>
      <View
        className="flex-row items-center gap-3 px-4 py-3.5 rounded-[16px]"
        style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.lineOnSurface }}
      >
        <View className="w-7 items-center">
          <Text className="font-bodyBold text-[10px]" style={{ color: c.inkMute }}>{day}</Text>
          <Text className="font-bodySemibold text-[9px] mt-0.5" style={{ color: c.inkMute }}>{monthLabel}</Text>
        </View>
        <View className="flex-1 min-w-0">
          <Text
            className="font-displayItalic text-[14px] leading-[18px]"
            numberOfLines={1}
            style={{ color: c.ink }}
          >
            {`"${text}"`}
          </Text>
          <Text className="font-body text-[11px] mt-1" style={{ color: c.inkMute }}>
            {note}
          </Text>
        </View>
        <AvatarPair />
      </View>
    </View>
  );
}

function HistoryRow({ item, lang }: { item: DailyQuestionHistoryItem; lang: string }) {
  const c = useAppColors();
  const text = item.question.textVi ?? item.question.text;
  const date = item.myAnsweredAt ? new Date(item.myAnsweredAt) : null;
  const dateLabel = date
    ? lang === 'vi'
      ? `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`
      : date.toLocaleDateString('en', { month: 'short', day: '2-digit' })
    : '';

  return (
    <View
      className="flex-row items-center gap-2.5 px-3.5 py-3 rounded-[14px] mb-2"
      style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.lineOnSurface }}
    >
      <Text
        className="flex-1 font-body text-[13px]"
        style={{ color: c.inkSoft }}
        numberOfLines={1}
      >
        {`"${text}"`}
      </Text>
      <Text className="font-body text-[11px]" style={{ color: c.inkMute }}>
        {dateLabel}
      </Text>
      <AvatarPair size={16} overlap={-6} />
    </View>
  );
}

function AvatarPair({ size = 18, overlap = -6 }: { size?: number; overlap?: number }) {
  const c = useAppColors();
  return (
    <View className="flex-row">
      <View
        className="rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: c.primary,
          borderWidth: 2,
          borderColor: c.surface,
        }}
      />
      <View
        className="rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: c.secondary,
          borderWidth: 2,
          borderColor: c.surface,
          marginLeft: overlap,
        }}
      />
    </View>
  );
}

function LoadingState() {
  const c = useAppColors();
  return (
    <View className="mx-5 mt-10 items-center">
      <View
        className="w-[64px] h-[64px] rounded-full items-center justify-center"
        style={{ backgroundColor: c.accentSoft }}
      >
        <Text className="font-displayItalic text-[26px]" style={{ color: c.accent }}>?</Text>
      </View>
    </View>
  );
}

function ErrorState({ message }: { message: string }) {
  const c = useAppColors();
  return (
    <View className="mx-5 mt-10">
      <Text className="font-body text-[14px] text-center" style={{ color: c.inkSoft }}>
        {message}
      </Text>
    </View>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  const c = useAppColors();
  return (
    <View className="mx-5 mt-10">
      <Text
        className="font-displayBold text-[20px] text-center"
        style={{ color: c.ink }}
      >
        {title}
      </Text>
      <Text
        className="font-body text-[13px] text-center mt-2"
        style={{ color: c.inkSoft }}
      >
        {body}
      </Text>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function firstChar(s: string | null | undefined): string {
  const t = s?.trim();
  if (!t) return '·';
  return t[0]!.toUpperCase();
}

function formatTodayBadge(
  date: Date,
  lang: string,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  // Format DD.MM in both langs (matches prototype "HÔM NAY · 26.03").
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return t('dailyQuestions.todayBadge', { date: `${dd}.${mm}` });
}

