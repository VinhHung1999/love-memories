// Sprint 67 T452 — MonthlyRecapScreen view. T453 added sections 01-04
// below the cover (by-numbers + heatmap + top moments + mood placeholder).
// Sections 05-09 + bottom actions land in T454.
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

import {
  BigStatCard,
  CloseFloatingButton,
  ClosingNoteCard,
  FirstsList,
  HeatmapGrid,
  LetterHighlightCard,
  MoodPlaceholder,
  PlacesList,
  RecapActions,
  RecapCover,
  RecapSection,
  StreakCallout,
  TopMomentCard,
  TopQuestionCard,
} from './components';
import { useMonthlyRecapViewModel } from './useMonthlyRecapViewModel';

export function MonthlyRecapScreen() {
  const vm = useMonthlyRecapViewModel();

  // Sections render on `ready` only. `empty` keeps the cover but suppresses
  // the body sections (no data to show); `error` shows the retry shell.
  const showSections = vm.stage === 'ready';

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

        {showSections && vm.byNumbers ? (
          <RecapSection kicker={vm.byNumbers.kicker} title={vm.byNumbers.title}>
            <View className="mt-3.5" style={{ gap: 10 }}>
              <BigStatCard
                value={vm.byNumbers.stats[0].value}
                label={vm.byNumbers.stats[0].label}
                bgClassName={vm.byNumbers.stats[0].bgClassName}
                colorClassName={vm.byNumbers.stats[0].colorClassName}
                circleClassName={vm.byNumbers.stats[0].circleClassName}
                size="big"
              />
              <View className="flex-row" style={{ gap: 10 }}>
                <View className="flex-1">
                  <BigStatCard
                    value={vm.byNumbers.stats[1].value}
                    label={vm.byNumbers.stats[1].label}
                    bgClassName={vm.byNumbers.stats[1].bgClassName}
                    colorClassName={vm.byNumbers.stats[1].colorClassName}
                    circleClassName={vm.byNumbers.stats[1].circleClassName}
                  />
                </View>
                <View className="flex-1">
                  <BigStatCard
                    value={vm.byNumbers.stats[2].value}
                    label={vm.byNumbers.stats[2].label}
                    bgClassName={vm.byNumbers.stats[2].bgClassName}
                    colorClassName={vm.byNumbers.stats[2].colorClassName}
                    circleClassName={vm.byNumbers.stats[2].circleClassName}
                  />
                </View>
                <View className="flex-1">
                  <BigStatCard
                    value={vm.byNumbers.stats[3].value}
                    label={vm.byNumbers.stats[3].label}
                    bgClassName={vm.byNumbers.stats[3].bgClassName}
                    colorClassName={vm.byNumbers.stats[3].colorClassName}
                    circleClassName={vm.byNumbers.stats[3].circleClassName}
                  />
                </View>
              </View>
            </View>
            {vm.byNumbers.streak ? (
              <StreakCallout
                streakCount={vm.byNumbers.streak.count}
                streakLabel={vm.byNumbers.streak.streakLabel}
                questionsLabel={vm.byNumbers.streak.questionsLabel}
              />
            ) : null}
          </RecapSection>
        ) : null}

        {showSections && vm.heatmap ? (
          <RecapSection kicker={vm.heatmap.kicker} title={vm.heatmap.title}>
            <HeatmapGrid
              heatmap={vm.heatmap.data}
              hint={vm.heatmap.hint}
              legendLess={vm.heatmap.legendLess}
              legendMore={vm.heatmap.legendMore}
              busiestPrefix={vm.heatmap.busiestPrefix}
              momentsLabel={vm.heatmap.momentsLabel}
            />
          </RecapSection>
        ) : null}

        {showSections && vm.topMoments && vm.topMoments.big ? (
          <RecapSection kicker={vm.topMoments.kicker} title={vm.topMoments.title}>
            <View className="mt-3.5" style={{ gap: 10 }}>
              <TopMomentCard
                id={vm.topMoments.big.id}
                rank={vm.topMoments.big.rank}
                palette={vm.topMoments.big.palette}
                title={vm.topMoments.big.title}
                sub={vm.topMoments.big.sub}
                size="big"
              />
              {vm.topMoments.small.length > 0 ? (
                <View className="flex-row" style={{ gap: 10 }}>
                  {vm.topMoments.small.map((m) => (
                    <View key={m.id} className="flex-1">
                      <TopMomentCard
                        id={m.id}
                        rank={m.rank}
                        palette={m.palette}
                        title={m.title}
                        sub={m.sub}
                      />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </RecapSection>
        ) : null}

        {showSections ? (
          <RecapSection kicker={vm.mood.kicker} title={vm.mood.title}>
            <MoodPlaceholder body={vm.mood.body} />
          </RecapSection>
        ) : null}

        {showSections && vm.places ? (
          <RecapSection kicker={vm.places.kicker} title={vm.places.title}>
            <PlacesList
              places={vm.places.places}
              caption={vm.places.caption}
              emptyTitle={vm.places.emptyTitle}
              emptyBody={vm.places.emptyBody}
              countLabel={vm.places.countLabel}
            />
          </RecapSection>
        ) : null}

        {showSections && vm.topQuestion ? (
          <RecapSection kicker={vm.topQuestion.kicker} title={vm.topQuestion.title}>
            {vm.topQuestion.card ? (
              <TopQuestionCard
                text={vm.topQuestion.card.text}
                meta={vm.topQuestion.card.meta}
                initialA={vm.topQuestion.card.initialA}
                initialB={vm.topQuestion.card.initialB}
              />
            ) : (
              <View className="mt-3.5 rounded-[20px] border border-dashed border-line bg-surface px-5 py-6">
                <Text className="font-body text-[13px] leading-[20px] text-ink-soft">
                  {vm.topQuestion.emptyBody}
                </Text>
              </View>
            )}
          </RecapSection>
        ) : null}

        {showSections && vm.letterHighlight ? (
          <RecapSection
            kicker={vm.letterHighlight.kicker}
            title={vm.letterHighlight.title}
          >
            {vm.letterHighlight.card ? (
              <LetterHighlightCard
                id={vm.letterHighlight.card.id}
                kicker={vm.letterHighlight.card.kicker}
                title={vm.letterHighlight.card.title}
                excerpt={vm.letterHighlight.card.excerpt}
                ctaLabel={vm.letterHighlight.card.ctaLabel}
              />
            ) : (
              <View className="mt-3.5 rounded-[20px] border border-dashed border-line bg-surface px-5 py-6">
                <Text className="font-body text-[13px] leading-[20px] text-ink-soft">
                  {vm.letterHighlight.emptyBody}
                </Text>
              </View>
            )}
          </RecapSection>
        ) : null}

        {showSections && vm.firsts ? (
          <RecapSection kicker={vm.firsts.kicker} title={vm.firsts.title}>
            <FirstsList
              items={vm.firsts.items}
              emptyBody={vm.firsts.emptyBody}
              tagLabel={vm.firsts.tagLabel}
            />
          </RecapSection>
        ) : null}

        {/* Closing note + actions render only when there's data; the closing
            card uses its own outer padding (no RecapSection wrapper) so the
            full-bleed gradient reads as a final "spread" of the magazine. */}
        {showSections && vm.closing ? (
          <ClosingNoteCard
            kicker={vm.closing.kicker}
            title={vm.closing.title}
            body={vm.closing.body}
            signature={vm.closing.signature}
            initialA={vm.closing.initialA}
            initialB={vm.closing.initialB}
          />
        ) : null}

        {showSections && vm.actions ? (
          <RecapActions
            shareLabel={vm.actions.shareLabel}
            shareSubLabel={vm.actions.shareSubLabel}
            saveBookLabel={vm.actions.saveBookLabel}
            onShare={vm.actions.onShare}
            onSaveBook={vm.actions.onSaveBook}
          />
        ) : null}
      </ScrollView>

      <CloseFloatingButton
        onPress={vm.onClose}
        accessibilityLabel={vm.closeLabel}
      />
    </View>
  );
}
