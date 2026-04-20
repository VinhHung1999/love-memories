import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { useWelcomeViewModel } from './useWelcomeViewModel';

// T297 (bug #1): real CC0 Unsplash photos replace the gradient + silhouette
// placeholders. Bundled as local require()s so the polaroids render instantly
// (no network flash on the very first screen). Credits in
// assets/images/onboarding/CREDITS.md.
const POLAROID_PHOTOS = [
  require('../../../assets/images/onboarding/welcome-1.jpg'),
  require('../../../assets/images/onboarding/welcome-2.jpg'),
  require('../../../assets/images/onboarding/welcome-3.jpg'),
] as const;

// T294 (bug #1): Vietnamese-bearing display text needs leading ≥ ~1.25× font-size
// (≥ ~1.3× for uppercase) so dấu mũ/sắc/huyền don't get clipped at the top of the
// line box. See IntroScreen header for the same gotcha.
const TERMS_URL = 'https://memoura.app/terms';
const PRIVACY_URL = 'https://memoura.app/privacy';

// Polaroid stack ports `WelcomeScreen` from
// docs/design/prototype/memoura-v2/onboarding.jsx:5. Original positions
// `translate(calc(-50% + Xpx), Ypx) rotate(Rdeg)` are pre-resolved against the
// 260×320 stack frame: polaroid is 186 wide → centered offset = (260−186)/2 = 37,
// then add the prototype's per-card x.
const POLAROID_POSITIONS = [
  'top-[10px] left-[-3px] -rotate-[8deg] z-10',
  'top-[40px] left-[67px] rotate-[5deg] z-20',
  'top-[60px] left-[32px] -rotate-[2deg] z-30',
] as const;

export function WelcomeScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const { onStart, onLogin } = useWelcomeViewModel();

  const polaroidLabels = [
    t('onboarding.welcome.polaroidLabels.one'),
    t('onboarding.welcome.polaroidLabels.two'),
    t('onboarding.welcome.polaroidLabels.three'),
  ];

  return (
    <View className="flex-1 bg-bg">
      <LinearGradient
        colors={[c.heroA, c.heroB, c.heroC]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        className="absolute inset-0"
      />

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="items-center mt-[60px] h-[330px]">
          <View className="relative w-[260px] h-full">
            {POLAROID_POSITIONS.map((posClass, i) => (
              <View
                key={i}
                className={`absolute w-[186px] h-[220px] bg-white rounded-lg shadow-elevated ${posClass}`}
              >
                <View className="absolute top-[10px] left-[10px] right-[10px] bottom-[36px] rounded-[2px] overflow-hidden bg-ink-soft/10">
                  <Image
                    source={POLAROID_PHOTOS[i]}
                    resizeMode="cover"
                    className="absolute inset-0 w-full h-full"
                  />
                </View>
                <Text className="absolute bottom-[8px] left-0 right-0 text-center font-displayItalic text-base text-ink-soft">
                  {polaroidLabels[i]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="flex-1" />

        <View className="absolute left-0 right-0 bottom-0 h-[360px]" pointerEvents="none">
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.45)']}
            locations={[0, 0.45, 1]}
            className="absolute inset-0"
          />
        </View>

        <View className="px-7 pt-10 pb-12">
          {/* T294 (bug #1): leading-none on uppercase VN clipped dấu huyền on
              "chào mừng em"; bumped to leading-[1.5em] so the diacritic sits
              fully inside the line box.
              T297 (bug #3): font-displayItalic + uppercase drops VN diacritics
              at glyph level (Fraunces italic uppercase coverage broken). Be
              Vietnam Pro Medium handles uppercase VN correctly. */}
          <Text className="font-bodyMedium uppercase text-white/90 text-xs leading-[1.5em] tracking-[2.4px]">
            {t('onboarding.welcome.accent')}
          </Text>
          {/* T294 (bug #1): leading-[54px] (0.96×) clipped descenders on the
              display 56-pt title; 64px (1.14×) keeps Memoura's italic glyphs
              fully rendered. */}
          <Text className="mt-3 font-displayMediumItalic text-white text-[56px] leading-[64px]">
            {t('onboarding.welcome.title')}
          </Text>
          <Text className="mt-4 font-body text-white/90 text-[15px] leading-snug max-w-[300px]">
            {t('onboarding.welcome.body')}
          </Text>

          <View className="mt-7 gap-2.5">
            <Pressable
              onPress={onStart}
              accessibilityRole="button"
              className="flex-row items-center justify-center bg-white rounded-full py-4 px-5 shadow-hero active:opacity-90"
            >
              {/* T291 (bug #1): button is hardcoded bg-white, so the label
                  must NOT use the themed `text-ink` token — in dark mode `ink`
                  flips to a near-white (#FBEDE8) and the CTA goes invisible.
                  Pin to the light-mode ink hex so it stays legible regardless
                  of theme mode. */}
              <Text className="font-bodyBold text-[#2A1A1E] text-[15px]">
                {t('onboarding.welcome.ctaPrimary')}
              </Text>
              <Text className="font-bodyBold text-[#2A1A1E] text-base ml-2">→</Text>
            </Pressable>
            <Pressable
              onPress={onLogin}
              accessibilityRole="button"
              // T292 (bug #2A): border-white/45 read too thin against the
              // adjacent text-white/90 label — bumped to /70 so the outline
              // matches the text's optical weight on the hero gradient.
              className="flex-row items-center justify-center bg-transparent border border-white/70 rounded-full py-3.5 px-5 active:opacity-80"
            >
              <Text className="font-bodySemibold text-white text-sm">
                {t('onboarding.welcome.ctaSecondary')}
              </Text>
            </Pressable>
          </View>

          <LegalFooter />
        </View>
      </SafeAreaView>
    </View>
  );
}

// T294 (bug #7): legal footer below the secondary CTA. Links open in the
// in-app browser tab so the user stays inside Memoura.
function LegalFooter() {
  const { t } = useTranslation();
  const openTerms = () => {
    void WebBrowser.openBrowserAsync(TERMS_URL);
  };
  const openPrivacy = () => {
    void WebBrowser.openBrowserAsync(PRIVACY_URL);
  };
  return (
    <Text className="mt-5 text-center font-body text-white/70 text-[11px] leading-[16px]">
      {t('onboarding.welcome.legal.prefix')}
      <Text onPress={openTerms} className="text-white/90 underline">
        {t('onboarding.welcome.legal.terms')}
      </Text>
      {t('onboarding.welcome.legal.and')}
      <Text onPress={openPrivacy} className="text-white/90 underline">
        {t('onboarding.welcome.legal.privacy')}
      </Text>
      {t('onboarding.welcome.legal.suffix')}
    </Text>
  );
}

