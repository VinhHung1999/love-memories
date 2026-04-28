import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { useOnboardingDoneViewModel } from './useOnboardingDoneViewModel';

// Sprint 60 ports `OnboardingDoneScreen` from prototype `pairing.jsx` L456-504.
// Sprint 68 D3 (Boss build 131 feedback) — three prototype-fidelity tweaks:
//   - Title font: displayMedium → displayItalic (matches prototype L477
//     fontStyle:displayStyle in serif theme).
//   - Layout: text block was bottom-anchored (justify-end pb-32); prototype
//     positions it absolute at top:28% with left/right 28px so the hero gap
//     above the title reads as breathing room, not whitespace dropout.
//   - Radial wash overlay (prototype L463-464): two elliptical gradients on
//     top of the linear hero. Top-left white/0.35 → transparent at ~60%,
//     bottom-right black/0.35 → transparent at ~60%. Adds depth and
//     directional light without the linear-gradient banding.
//
// T316/T330 carry-over: joiner path hydrates partner name from the VM,
// which re-fetches /api/couple on mount (validate-invite stash is often
// empty because the creator hadn't named themselves at validate time).

export function OnboardingDoneScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const { selfName, partnerName, slogan, entering, onEnter } = useOnboardingDoneViewModel();
  const { width, height } = useWindowDimensions();

  const self = (selfName ?? '').trim() || t('onboarding.done.titleSelfFallback');
  const partner =
    partnerName?.trim() || t('onboarding.done.titlePartnerFallback');
  const names = `${self} & ${partner}`;
  const trimmedSlogan = slogan?.trim() ?? '';
  const body = trimmedSlogan
    ? t('onboarding.done.bodyWithSlogan', { slogan: trimmedSlogan })
    : t('onboarding.done.body');

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[c.heroA, c.heroB, c.heroC]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        className="absolute inset-0"
      />

      {/* D3 radial wash. react-native-svg v15 supports RadialGradient with
          fractional cx/cy/r values. Two Rects with separate gradient fills
          stack to give the prototype's "warm light from above + cool shadow
          below" composition. Width / height drive from window dims so the
          ellipses scale to device. pointerEvents off so the CTA still
          captures taps through the SVG. */}
      <Svg
        pointerEvents="none"
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Defs>
          <RadialGradient id="topleftWash" cx="0.20" cy="0.18" rx="0.60" ry="0.60" fx="0.20" fy="0.18">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="bottomrightWash" cx="0.85" cy="0.90" rx="0.60" ry="0.60" fx="0.85" fy="0.90">
            <Stop offset="0%" stopColor="#000000" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#topleftWash)" />
        <Rect x="0" y="0" width={width} height={height} fill="url(#bottomrightWash)" />
      </Svg>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        {/* D3 — text block absolute-positioned to the top-28% line per
            prototype L466-468. SafeAreaView still owns the CTA at the
            bottom; `pointerEvents=box-none` would let taps fall through,
            but there are no interactive children in this block. */}
        <View
          pointerEvents="none"
          className="absolute left-7 right-7"
          style={{ top: '28%' }}
        >
          <Text className="font-displayItalic text-white/90 text-[13px] uppercase tracking-[2.4px] mb-4">
            {t('onboarding.done.eyebrow')}
          </Text>
          <Text
            className="font-displayItalic text-white text-[48px] leading-[52px]"
            style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 30 }}
          >
            {t('onboarding.done.title', { names })}
          </Text>
          <Text className="mt-5 font-body text-white/90 text-[15px] leading-[23px] max-w-[320px]">
            {body}
          </Text>
        </View>

        <View className="flex-1" />

        <View className="px-7 pb-10">
          <Pressable
            onPress={entering ? undefined : onEnter}
            accessibilityRole="button"
            accessibilityState={{ busy: entering }}
            className="w-full flex-row items-center justify-center rounded-full bg-white py-4 px-5 shadow-hero active:opacity-90"
          >
            {entering ? (
              <ActivityIndicator color={c.ink} />
            ) : (
              <>
                {/* T329 carry-over: button is hardcoded bg-white, so the
                    label must NOT use the themed `text-ink` token — in
                    dark mode `ink` flips to a near-white and the CTA
                    goes invisible. Pin to the light-mode ink hex. */}
                <Text className="font-bodyBold text-[#2A1A1E] text-[15px]">
                  {t('onboarding.done.cta')}
                </Text>
                <Text className="font-bodyBold text-[#2A1A1E] text-[15px] ml-2">→</Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
