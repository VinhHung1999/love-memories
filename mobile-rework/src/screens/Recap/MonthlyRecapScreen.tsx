// Sprint 67 T452 — MonthlyRecapScreen view. Owns ONLY layout + presentation
// of the cover (T452 scope) plus loading / empty / error states. Sections
// 01-09 land in T453 + T454 below the cover.
//
// Spec acceptance:
//  • Renders Cover with real BE data after fetch resolves
//  • Theme tokens via useAppColors() — no hardcoded hex outside the gradient
//    (heroA/B/C come from useAppColors)
//  • i18n strings only — all literal Vietnamese / English text lives in
//    src/locales/{vi,en}.ts under recap.monthly.*
//  • Floating close (top-right) overlays the gradient
//  • Defensive shells: loading shimmer, empty (no activity) note, error w/
//    retry pill

import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { CloseFloatingButton, RecapCover } from './components';
import { useMonthlyRecapViewModel } from './useMonthlyRecapViewModel';

export function MonthlyRecapScreen() {
  const vm = useMonthlyRecapViewModel();

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-24"
        showsVerticalScrollIndicator={false}
      >
        {vm.cover ? <RecapCover cover={vm.cover} /> : null}

        {vm.stage === 'loading' ? (
          <View className="items-center px-6 py-16">
            <ActivityIndicator size="small" />
            <Text className="mt-4 font-body text-[13px] text-ink-soft">
              {vm.loadingLabel}
            </Text>
          </View>
        ) : null}

        {vm.stage === 'empty' ? (
          <View className="mx-4 mt-8 rounded-3xl border border-line bg-surface px-6 py-10">
            <Text className="font-displayMedium text-[22px] leading-[26px] text-ink">
              {vm.emptyTitle}
            </Text>
            <Text className="mt-3 font-body text-[14px] leading-[22px] text-ink-soft">
              {vm.emptyBody}
            </Text>
          </View>
        ) : null}

        {vm.stage === 'error' ? (
          <View className="mx-4 mt-8 rounded-3xl border border-line bg-surface px-6 py-10">
            <Text className="font-displayMedium text-[22px] leading-[26px] text-ink">
              {vm.errorTitle}
            </Text>
            <Text className="mt-3 font-body text-[14px] leading-[22px] text-ink-soft">
              {vm.errorBody}
            </Text>
            <Text
              className="mt-5 self-start rounded-full border border-line bg-bg px-4 py-2 font-bodyBold text-[12px] text-ink active:opacity-70"
              onPress={vm.refresh}
            >
              {vm.retryLabel}
            </Text>
          </View>
        ) : null}

        {/* T453 + T454 sections will mount below this comment in subsequent
            commits. Cover must remain at the top of the scroll regardless. */}
      </ScrollView>

      <CloseFloatingButton
        onPress={vm.onClose}
        accessibilityLabel={vm.closeLabel}
      />
    </View>
  );
}
