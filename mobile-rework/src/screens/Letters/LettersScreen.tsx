import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import { SafeScreen, TabBarSpacer } from "@/components";
import { useAppColors } from "@/theme/ThemeProvider";

import { EmptyState, LetterHeroCard, LetterRow } from "./components";
import { formatScheduleDate, relativeAgo } from "./relativeAgo";
import { useLettersViewModel, type LettersTab } from "./useLettersViewModel";

// T421 (Sprint 65) — Letters Inbox screen. Replaces the Sprint 59 stub at
// app/(tabs)/letters.tsx (which only rendered a centred title). Layout
// mirrors prototype `letters.jsx` L52-137: eyebrow + title + Write CTA in
// the header row, 3 chip tabs with count badges, then a per-tab feed.
//
// Tap behaviour (Lu approved Q4 + spec acceptance):
//   • Inbox / Sent letter   → router.push('/letter-read?id=…')
//   • Draft letter          → router.push('/letter-compose?id=…')
//   • Write trailing CTA    → router.push('/letter-compose')
//
// D45 (Build 76 hot-fix): the 'scheduled' tab + ScheduledCard banner were
// dropped after D40 removed the schedule attachment. Tab order trimmed to
// inbox / sent / drafts.

// D45 (Build 76 hot-fix): 'scheduled' tab removed (D40 dropped the
// schedule attachment so no UI flow creates SCHEDULED letters anymore).
const TAB_ORDER: LettersTab[] = ["inbox", "sent", "drafts"];

export function LettersScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const vm = useLettersViewModel();
  const locale = i18n.language;

  const goCompose = useCallback(() => {
    router.push("/letter-compose");
  }, [router]);

  const openLetter = useCallback(
    (id: string) => {
      router.push({ pathname: "/letter-read", params: { id } });
    },
    [router],
  );

  const editDraft = useCallback(
    (id: string) => {
      router.push({ pathname: "/letter-compose", params: { id } });
    },
    [router],
  );

  const tabsCount = vm.counts;
  const activeTab = vm.activeTab;
  const partnerName = vm.partnerName ?? t("letters.partnerFallback");
  const currentName = vm.currentUserName ?? t("letters.currentUserFallback");

  // D64-redo4 (Sprint 65 Build 91 hot-fix): the brute `key={activeTab}`
  // remount caused a one-frame flash where the unmounted ScrollView's
  // pixels overlapped the TabsBar chip bottoms — Boss saw this as
  // "lẹm filter, ScrollView lẽm vào". Switch back to a soft scroll
  // reset: keep the same ScrollView mounted across tab swaps, set
  // activeTab, then on the next animation frame call
  // `scrollTo({y: 0, animated: false})`. The rAF defers the call until
  // after the new feed's first layout pass so the offset reset lands
  // on the correct contentSize. Inbox is fine because it's the initial
  // mount with offset already 0; Sent / Drafts get the explicit reset.
  const scrollRef = useRef<ScrollView>(null);
  const onSelectTab = useCallback(
    (next: LettersTab) => {
      vm.setActiveTab(next);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    },
    [vm],
  );

  const tabsConfig = useMemo(
    () =>
      TAB_ORDER.map((key) => ({
        key,
        label: t(`letters.tabs.${key}`),
        count: tabsCount[key],
      })),
    [t, tabsCount],
  );

  const isLoading = vm.loading;
  const isError = vm.error && !vm.loading;
  const visibleLetters = vm.visibleLetters;

  if (isLoading) {
    return (
      <SafeScreen edges={["top"]}>
        <Header
          eyebrow={t("letters.eyebrow")}
          title={t("letters.title")}
          ctaLabel={t("letters.write")}
          onCta={goCompose}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.primary} />
        </View>
      </SafeScreen>
    );
  }

  if (isError) {
    return (
      <SafeScreen edges={["top"]}>
        <Header
          eyebrow={t("letters.eyebrow")}
          title={t("letters.title")}
          ctaLabel={t("letters.write")}
          onCta={goCompose}
        />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-bodyMedium text-ink text-[15px] text-center">
            {t("letters.error.message")}
          </Text>
          <Pressable
            onPress={() => void vm.reload()}
            accessibilityRole="button"
            className="mt-5 px-5 h-10 rounded-full bg-primary items-center justify-center active:bg-primary-deep"
          >
            <Text className="font-bodySemibold text-white text-[14px]">
              {t("letters.error.retry")}
            </Text>
          </Pressable>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={["top"]}>
      <Header
        eyebrow={t("letters.eyebrow")}
        title={t("letters.title")}
        ctaLabel={t("letters.write")}
        onCta={goCompose}
      />
      <TabsBar tabs={tabsConfig} active={activeTab} onSelect={onSelectTab} />
      <ScrollView
        // D64-redo4 (Sprint 65 Build 91 hot-fix): drop `key={activeTab}`
        // (Build 88 brute remount). Boss confirmed the "lụm filter"
        // wasn't shadow bleed (D64-redo3 wrong) and wasn't scroll offset
        // alone — it was the ScrollView's unmount/remount flash painting
        // over the TabsBar before layout settled. Keep one mounted
        // ScrollView; reset scroll via rAF after the tab-state flips
        // (see `onSelectTab` above).
        ref={scrollRef}
        // contentInsetAdjustmentBehavior='never' pins the iOS automatic
        // inset adjustment — without it the ScrollView's first paint
        // can briefly inherit a parent's safe-area inset and visibly
        // shift downward, making the TabsBar above feel like it gets
        // "eaten" by the content.
        contentInsetAdjustmentBehavior="never"
        // D64 (Sprint 65 Build 86 hot-fix): pt-4 → pt-6. The Sent tab's
        // first letter often lands on a lighter palette (butter / sunset /
        // mint), so the LetterHeroCard's 160px gradient header reads tight
        // against the TabsBar above. Two extra mm of breathing room keeps
        // the row from feeling "lẻm vào".
        contentContainerClassName="px-5 pt-2 pb-2"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={vm.refreshing}
            onRefresh={vm.onRefresh}
            tintColor={c.primary}
          />
        }
      >
        <Feed
          tab={activeTab}
          letters={visibleLetters}
          locale={locale}
          partnerName={partnerName}
          currentUserName={currentName}
          partnerAvatarUrl={vm.partnerAvatar}
          currentUserId={vm.currentUserId}
          unreadPillLabel={t("letters.unreadPill")}
          ctaLabel={t("letters.tapToOpen")}
          greetingPrefix={t("letters.heroGreeting")}
          draftChipLabel={t("letters.draftChip")}
          emptyTitle={t(`letters.empty.${activeTab}.title`, {
            partner: partnerName,
          })}
          emptySubtitle={t(`letters.empty.${activeTab}.subtitle`, {
            partner: partnerName,
          })}
          emptyCta={
            activeTab === "inbox"
              ? null
              : { label: t("letters.empty.cta"), onPress: goCompose }
          }
          onOpen={openLetter}
          onEditDraft={editDraft}
        />
        <TabBarSpacer />
      </ScrollView>
    </SafeScreen>
  );
}

type HeaderProps = {
  eyebrow: string;
  title: string;
  ctaLabel: string;
  onCta: () => void;
};

function Header({ eyebrow, title, ctaLabel, onCta }: HeaderProps) {
  return (
    <View className="flex-row items-end justify-between px-5 pt-2 pb-3">
      <View className="flex-1 min-w-0">
        <Text className="font-script text-ink-mute text-[20px] leading-[20px]">
          {eyebrow}
        </Text>
        <Text className="font-displayMedium text-ink text-[32px] leading-[36px] mt-1">
          {title}
        </Text>
      </View>
      <Pressable
        onPress={onCta}
        accessibilityRole="button"
        className="ml-3 flex-row items-center h-10 px-3.5 rounded-full bg-primary shadow-pill active:bg-primary-deep"
      >
        <Plus size={14} strokeWidth={2.6} color="#ffffff" />
        <Text className="font-bodySemibold text-white text-[13px] ml-1">
          {ctaLabel}
        </Text>
      </Pressable>
    </View>
  );
}

type TabConfig = { key: LettersTab; label: string; count: number };

type TabsBarProps = {
  tabs: TabConfig[];
  active: LettersTab;
  onSelect: (tab: LettersTab) => void;
};

function TabsBar({ tabs, active, onSelect }: TabsBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-5 gap-1.5"
      className="grow-0 mt-3"
      style={{ paddingBottom: 12 }}
    >
      {tabs.map((tab) => (
        <TabChip
          key={tab.key}
          label={tab.label}
          count={tab.count}
          active={tab.key === active}
          onPress={() => onSelect(tab.key)}
        />
      ))}
    </ScrollView>
  );
}

type TabChipProps = {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
};

function TabChip({ label, count, active, onPress }: TabChipProps) {
  const c = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="flex-row items-center gap-1.5 h-9 px-3.5 rounded-full active:opacity-90"
      style={{
        backgroundColor: active ? c.ink : c.surface,
        borderWidth: active ? 0 : 1,
        borderColor: c.lineOnSurface,
      }}
    >
      <Text
        className="font-bodySemibold text-[12px]"
        style={{ color: active ? c.bg : c.inkSoft }}
      >
        {label}
      </Text>
      {count > 0 ? (
        <View
          className="min-w-[16px] h-4 px-1 rounded-full items-center justify-center"
          style={{ backgroundColor: active ? c.primary : c.primarySoft }}
        >
          <Text
            className="font-bodyBold text-[10px] leading-[12px]"
            style={{ color: active ? "#ffffff" : c.primary }}
          >
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

type FeedProps = {
  tab: LettersTab;
  letters: ReturnType<typeof useLettersViewModel>["visibleLetters"];
  locale: string;
  partnerName: string;
  currentUserName: string;
  partnerAvatarUrl: string | null;
  currentUserId: string | null;
  unreadPillLabel: string;
  ctaLabel: string;
  greetingPrefix: string;
  draftChipLabel: string;
  emptyTitle: string;
  emptySubtitle: string;
  emptyCta: { label: string; onPress: () => void } | null;
  onOpen: (id: string) => void;
  onEditDraft: (id: string) => void;
};

function Feed({
  tab,
  letters,
  locale,
  partnerName,
  currentUserName,
  partnerAvatarUrl,
  currentUserId,
  unreadPillLabel,
  ctaLabel,
  greetingPrefix,
  draftChipLabel,
  emptyTitle,
  emptySubtitle,
  emptyCta,
  onOpen,
  onEditDraft,
}: FeedProps) {
  if (letters.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        subtitle={emptySubtitle}
        ctaLabel={emptyCta?.label}
        onCta={emptyCta?.onPress}
      />
    );
  }

  // Drafts tab — never a hero, all rows compact with 'Nháp' chip prefix.
  if (tab === "drafts") {
    return (
      <View>
        {letters.map((letter) => (
          <LetterRow
            key={letter.id}
            letter={letter}
            trailingLabel={relativeAgo(letter.updatedAt, locale)}
            draftMode
            draftChipLabel={draftChipLabel}
            // Drafts are letters the user is sending TO partner.
            greetingPrefix={greetingPrefix}
            recipientDisplayName={partnerName}
            onPress={() => onEditDraft(letter.id)}
          />
        ))}
      </View>
    );
  }

  // Inbox / Sent — first row is the hero envelope card; rest are compact.
  const [hero, ...rest] = letters;
  if (!hero) return null;

  // Q3 (Lu approved): Inbox hero greets the recipient (currentUser);
  // Sent hero greets the partner (recipient of the letter the user sent).
  const heroRecipientName = tab === "inbox" ? currentUserName : partnerName;

  // Q5 (Lu approved): mini-avatar = sender's avatar/initial.
  // Inbox hero sender is the partner (sender on the letter row).
  // Sent hero sender is the current user (currentUserId === hero.sender.id).
  const isHeroSelf = currentUserId !== null && hero.sender.id === currentUserId;
  const heroSenderName = hero.sender.name ?? heroRecipientName;
  const heroSenderAvatar =
    hero.sender.avatar ?? (isHeroSelf ? null : partnerAvatarUrl);
  const heroAgo = relativeAgo(hero.deliveredAt ?? hero.createdAt, locale);

  // Defensive trailing-label resolver: D45 dropped the Scheduled tab, but a
  // legacy SCHEDULED row could still surface via /sent (BE never deletes
  // them). Fall back to the schedule date when present so the row reads as
  // "delivers in the future" instead of "x ngày trước".
  const trailingFor = (letter: typeof hero) => {
    if (letter.status === "SCHEDULED" && letter.scheduledAt) {
      return formatScheduleDate(letter.scheduledAt, locale);
    }
    return relativeAgo(letter.deliveredAt ?? letter.createdAt, locale);
  };

  return (
    <View>
      <LetterHeroCard
        letter={hero}
        recipientDisplayName={heroRecipientName}
        senderDisplayName={heroSenderName}
        senderAvatarUrl={heroSenderAvatar}
        agoLabel={
          hero.status === "SCHEDULED" && hero.scheduledAt
            ? formatScheduleDate(hero.scheduledAt, locale)
            : heroAgo
        }
        unreadPillLabel={unreadPillLabel}
        ctaLabel={ctaLabel}
        greetingPrefix={greetingPrefix}
        onPress={() => onOpen(hero.id)}
      />
      {rest.map((letter) => (
        <LetterRow
          key={letter.id}
          letter={letter}
          trailingLabel={trailingFor(letter)}
          // D68 — non-hero rows reuse the same greeting fallback rule
          // as the hero card (Inbox → currentUser, Sent → partner).
          greetingPrefix={greetingPrefix}
          recipientDisplayName={heroRecipientName}
          onPress={() => onOpen(letter.id)}
        />
      ))}
    </View>
  );
}
