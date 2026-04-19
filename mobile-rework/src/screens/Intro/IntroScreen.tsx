import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { INTRO_SLIDE_KINDS, IntroSlideKind, useIntroViewModel } from './useIntroViewModel';

// Gotchas (T294):
// 1. Vietnamese-bearing display text needs leading ≥ ~1.25em (≥ ~1.3em on
//    uppercase) so dấu mũ/sắc/huyền don't get clipped at the line-box top.
//    Default Tailwind `leading-none` and font-size-equal `leading-[Npx]`
//    silently chop diacritics — always specify explicit headroom.
// 2. ONLY the `moments` slide uses the dark hero gradient (heroA→heroB→heroC,
//    warm→deep across both palettes/modes) — there text must be hardcoded
//    `text-white*`. The `letters` + `daily` slides use soft pastel gradients
//    (accentSoft / primarySoft / secondarySoft) where white text disappears;
//    those keep themed `text-primary-deep` / `text-ink` / `text-ink-soft`.
//    Old "all slides white" guidance bricked legibility on letters+daily —
//    fix is per-slide via `isDark = kind === 'moments'` at the map iteration.
// 3. Cards sitting on a coloured gradient must NOT carry `border border-line`.
//    The themed line token (post-T293) is a soft hairline pre-composed against
//    bg, so on a hero-gradient backdrop it reads as a dark hairline. Drop the
//    border and rely on the soft shadow tokens (`shadow-elevated` for full
//    cards, `shadow-card` for the lightweight answered-by mock) — matches
//    prototype intent. T296 swapped the old `shadow-lg` (tight high-opacity
//    iOS native shadow) for the soft custom tokens defined in tailwind.config.

type SlideCopy = {
  accent: string;
  title: string;
  body: string;
};

export function IntroScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const { idx, finish, slideCount, onMomentumEnd } = useIntroViewModel();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (target: number) => {
    if (screenWidth <= 0) return;
    scrollRef.current?.scrollTo({ x: target * screenWidth, animated: true });
  };
  // T290 (bug #11): Skip used to scroll to the last slide; Boss wants it to
  // jump straight into signup so the user isn't forced to read every slide.
  const onSkip = () => finish();
  const onNext = () => {
    if (idx < slideCount - 1) goTo(idx + 1);
    else finish();
  };

  const slideGradients: Record<IntroSlideKind, readonly [string, string, string]> = {
    moments: [c.heroA, c.heroB, c.heroC],
    letters: [c.accentSoft, c.primarySoft, c.secondarySoft],
    daily: [c.secondarySoft, c.accentSoft, c.primarySoft],
  };

  const slideCopy: Record<IntroSlideKind, SlideCopy> = {
    moments: {
      accent: t('onboarding.intro.slides.moments.accent'),
      title: t('onboarding.intro.slides.moments.title'),
      body: t('onboarding.intro.slides.moments.body'),
    },
    letters: {
      accent: t('onboarding.intro.slides.letters.accent'),
      title: t('onboarding.intro.slides.letters.title'),
      body: t('onboarding.intro.slides.letters.body'),
    },
    daily: {
      accent: t('onboarding.intro.slides.daily.accent'),
      title: t('onboarding.intro.slides.daily.title'),
      body: t('onboarding.intro.slides.daily.body'),
    },
  };

  const isLast = idx >= slideCount - 1;
  const ctaLabel = isLast ? t('onboarding.intro.finish') : t('onboarding.intro.next');

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => onMomentumEnd(e, screenWidth)}
        scrollEventThrottle={16}
      >
        {INTRO_SLIDE_KINDS.map((kind) => {
          // T294 follow-up (bug #2 revision): only `moments` is dark; pastel
          // slides need themed text. See header gotcha #2.
          const isDark = kind === 'moments';
          const accentCls = isDark ? 'text-white/85' : 'text-primary-deep';
          const titleCls = isDark ? 'text-white' : 'text-ink';
          const bodyCls = isDark ? 'text-white/90' : 'text-ink-soft';
          return (
            <View key={kind} className="w-screen h-full">
              <LinearGradient
                colors={slideGradients[kind]}
                locations={[0, 0.55, 1]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                className="absolute inset-0"
              />

              <SafeAreaView edges={['top', 'bottom']} className="flex-1">
                <View className="flex-row justify-end px-5 pt-4">
                  <Pressable
                    onPress={onSkip}
                    accessibilityRole="button"
                    className="bg-white/40 rounded-full px-3.5 py-2 active:opacity-70"
                  >
                    <Text className="font-bodySemibold text-ink text-xs">
                      {t('common.skip')}
                    </Text>
                  </Pressable>
                </View>

                <View className="h-[320px] mt-5">
                  <SlideVisual kind={kind} />
                </View>

                <View className="flex-1" />

                <View className="px-7 pb-[96px]">
                  {/* T294 (bug #1): leading-[1.5em] keeps uppercase VN
                      diacritics inside the line box. Color resolved per
                      slide above (dark gradient → white, pastel → themed). */}
                  <Text
                    className={`font-displayItalic uppercase ${accentCls} text-[11px] leading-[1.5em] tracking-[2px]`}
                  >
                    {slideCopy[kind].accent}
                  </Text>
                  <Text
                    className={`mt-2.5 font-displayMediumItalic ${titleCls} text-[40px] leading-[48px]`}
                  >
                    {slideCopy[kind].title}
                  </Text>
                  <Text
                    className={`mt-3.5 font-body ${bodyCls} text-[14.5px] leading-[22px] max-w-[310px]`}
                  >
                    {slideCopy[kind].body}
                  </Text>
                </View>
              </SafeAreaView>
            </View>
          );
        })}
      </ScrollView>

      <SafeAreaView
        edges={['bottom']}
        pointerEvents="box-none"
        className="absolute left-0 right-0 bottom-0"
      >
        <View
          pointerEvents="box-none"
          className="px-7 pb-2 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-1.5">
            {INTRO_SLIDE_KINDS.map((_, i) => (
              <PageDot key={i} active={i === idx} />
            ))}
          </View>
          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            className="flex-row items-center bg-ink rounded-full px-5 py-3.5 shadow-hero active:opacity-90"
          >
            <Text className="font-bodyBold text-bg text-sm">{ctaLabel}</Text>
            <Text className="font-bodyBold text-bg text-sm ml-2">→</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function PageDot({ active }: { active: boolean }) {
  const width = useSharedValue(active ? 22 : 6);

  useEffect(() => {
    width.value = withTiming(active ? 22 : 6, { duration: 280 });
  }, [active, width]);

  const animStyle = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <Animated.View
      className={`h-1.5 rounded-[3px] ${active ? 'bg-ink' : 'bg-ink/20'}`}
      style={animStyle}
    />
  );
}

function SlideVisual({ kind }: { kind: IntroSlideKind }) {
  if (kind === 'moments') return <MomentsVisual />;
  if (kind === 'letters') return <LettersVisual />;
  return <DailyVisual />;
}

function MomentsVisual() {
  const { t } = useTranslation();
  const c = useAppColors();

  // Ports `IntroVisual('moments')` from onboarding.jsx:230. Polaroid card 160×200,
  // pre-resolved center offsets: container row centers at left-1/2; each card
  // half-width = 80, then add the prototype's per-card x and y.
  const cards: readonly {
    posClass: string;
    grad: readonly [string, string];
  }[] = [
    { posClass: '-ml-[140px] mt-0 -rotate-[12deg]', grad: [c.primarySoft, c.secondarySoft] },
    { posClass: '-ml-[80px] mt-[20px] -rotate-[2deg]', grad: [c.accentSoft, c.primarySoft] },
    { posClass: '-ml-[20px] mt-[5px] rotate-[10deg]', grad: [c.secondarySoft, c.accentSoft] },
  ];

  return (
    <View className="relative w-full h-full">
      {cards.map((card, i) => (
        <View
          key={i}
          className={`absolute left-1/2 top-[30px] w-[160px] h-[200px] bg-white rounded-md shadow-elevated ${card.posClass}`}
        >
          <View className="absolute top-[8px] left-[8px] right-[8px] bottom-[28px] rounded-[2px] overflow-hidden">
            <LinearGradient
              colors={card.grad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="absolute inset-0"
            />
          </View>
        </View>
      ))}
      {/* T291 (bug #3): "forever & always" wrapped on iPhone SE (375 px) when
          container was 120 px wide. Bumped to 220 px and centered (-ml-[110px])
          so the script stays on one line; numberOfLines={1} guarantees no
          wrap on smaller locales/fonts. */}
      <View className="absolute left-1/2 -ml-[110px] top-[245px] w-[220px] items-center -rotate-[5deg]">
        <Text
          numberOfLines={1}
          className="font-displayItalic text-primary-deep text-[22px]"
        >
          {t('onboarding.intro.slides.moments.sticker')}
        </Text>
      </View>
    </View>
  );
}

function LettersVisual() {
  const { t } = useTranslation();

  // Ports `IntroVisual('letters')` from onboarding.jsx:262. Three stacked letter
  // cards 230×240 with increasing opacity; the top card holds the sample message.
  const cards: readonly {
    posClass: string;
    opacityClass: string;
  }[] = [
    { posClass: 'mt-[40px] -rotate-[4deg] z-10', opacityClass: 'opacity-70' },
    { posClass: 'mt-[20px] rotate-[2deg] z-20', opacityClass: 'opacity-90' },
    { posClass: 'mt-0 -rotate-[1deg] z-30', opacityClass: 'opacity-100' },
  ];

  const lineWidths = ['w-[85%]', 'w-[95%]', 'w-[70%]', 'w-[90%]', 'w-[60%]'] as const;

  return (
    <View className="relative w-full h-full">
      {cards.map((card, i) => (
        <View
          key={i}
          // T294 (bug #3): no border on white-card-on-gradient — see header
          // gotcha #3. shadow-elevated (T296) alone carries the elevation cue.
          className={`absolute left-1/2 -ml-[115px] top-[40px] w-[230px] h-[240px] bg-white rounded-2xl shadow-elevated p-5 ${card.posClass} ${card.opacityClass}`}
        >
          {i === 2 ? (
            <>
              <Text className="font-displayItalic text-primary-deep text-[20px] mb-3.5">
                {t('onboarding.intro.slides.letters.letterSalutation')}
              </Text>
              {lineWidths.map((w, j) => (
                <View
                  key={j}
                  className={`h-1.5 rounded-[3px] bg-line mb-2.5 ${w}`}
                />
              ))}
              <Text className="mt-2.5 text-right font-displayItalic text-ink-soft text-lg">
                {t('onboarding.intro.slides.letters.letterSignoff')}
              </Text>
            </>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function DailyVisual() {
  const { t } = useTranslation();
  const c = useAppColors();

  return (
    <View className="relative w-full h-full">
      {/* T294 (bug #3): no border on the question card — gotcha #3 in header.
          shadow-elevated (T296) carries elevation. */}
      <View className="absolute left-1/2 -ml-[135px] top-[24px] w-[270px] rounded-[22px] shadow-elevated overflow-hidden -rotate-[2deg]">
        <LinearGradient
          colors={[c.accentSoft, c.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <View className="px-5 pt-5 pb-5">
          <Text className="font-displayItalic text-accent text-lg">
            {t('onboarding.intro.slides.daily.today')}
          </Text>
          {/* T294 (bug #1): leading bumped 26→30 (1.36×) so VN dấu in
              "Giấc mơ đẹp nhất của em?" doesn't clip. */}
          <Text className="mt-2.5 font-displayMediumItalic text-ink text-[22px] leading-[30px]">
            “{t('onboarding.intro.slides.daily.question')}”
          </Text>
          <View className="mt-4 flex-row items-center gap-2">
            {/* T294 (bug #3): mock input border dropped — same gotcha #3.
                The white pill on the soft accent gradient reads cleanly
                without a hairline. */}
            <View className="flex-1 px-3 py-2.5 rounded-xl bg-white">
              <Text className="font-body text-ink-mute text-[11px]">
                {t('onboarding.intro.slides.daily.placeholder')}
              </Text>
            </View>
            <View className="w-[38px] h-[38px] rounded-full overflow-hidden items-center justify-center">
              <LinearGradient
                colors={[c.primary, c.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
              />
              <Text className="text-white text-base">→</Text>
            </View>
          </View>
        </View>
      </View>
      {/* T294 (bug #5): "answered by partner" mock — purely visual teaser to
          show the daily Q is a two-way ritual. No real data. Sits below the
          question card; -ml-[120px] = w-[240px]/2 so it's centered. */}
      <View className="absolute left-1/2 -ml-[120px] top-[200px] w-[240px] flex-row items-center gap-3 rounded-[18px] bg-white/95 shadow-card px-3.5 py-3">
        <View className="w-8 h-8 rounded-full overflow-hidden items-center justify-center">
          <LinearGradient
            colors={[c.accent, c.accentSoft]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0"
          />
          <Text className="font-displayBold text-white text-[13px]">M</Text>
        </View>
        <View className="flex-1 gap-1.5">
          <Text className="font-body text-ink-mute text-[11px] leading-[14px]">
            {t('onboarding.intro.slides.daily.answeredBy')}
          </Text>
          <View className="h-1.5 rounded-[3px] bg-line w-[85%]" />
          <View className="h-1.5 rounded-[3px] bg-line w-[60%]" />
        </View>
      </View>
    </View>
  );
}
