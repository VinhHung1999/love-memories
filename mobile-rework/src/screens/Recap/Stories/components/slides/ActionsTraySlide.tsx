// Sprint 67 T461 — ActionsTray slide (final). 3 CTAs in clear visual
// hierarchy:
//   • Save — primary, gradient bg (heroA→heroB), Video icon. Stub for
//     v1 (handler shows Alert "Coming soon"); the real 30-second video
//     export ships in a future sprint.
//   • Share — secondary, border + soft tint, Mail icon. Copies
//     `{appBaseUrl}/recap/<coupleId>/<period>` to clipboard via the
//     handler wired in the container.
//   • Detail — tertiary, text-link with chevron. router.replace into
//     the editorial scroll at /detail so the back stack stays clean.
//
// Header kicker + signoff line frame the slide as a deliberate
// "saying goodbye" beat at the end of the deck.

import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Mail, Video } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import type { Slide } from '../../types';

type ActionsTraySlide = Extract<Slide, { kind: 'actionsTray' }>;

type Props = { slide: ActionsTraySlide };

export function ActionsTraySlide({ slide }: Props) {
  const c = useAppColors();
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-bg">
      <View className="flex-1 justify-center px-7" style={{ gap: 20 }}>
        <View>
          <Text className="font-script text-[26px] text-primary">
            {t('recap.stories.actions.kicker')}
          </Text>
          <Text className="mt-2 font-displayMedium text-[28px] leading-[34px] text-ink">
            {t('recap.stories.actions.headline')}
          </Text>
          <Text className="mt-2 font-body text-[14px] leading-[20px] text-ink-soft">
            {t('recap.stories.actions.body')}
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            onPress={slide.onSave}
            className="overflow-hidden rounded-2xl active:opacity-90"
          >
            <LinearGradient
              colors={[c.heroA, c.heroB]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="flex-row items-center gap-3 px-5 py-4">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <Video size={16} color="#FFFFFF" strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                  <Text className="font-bodyBold text-[14px] text-white">
                    {slide.saveLabel}
                  </Text>
                  <Text className="mt-0.5 font-body text-[11px] text-white/85">
                    {t('recap.stories.actions.saveSub')}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={slide.onShare}
            className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-4 active:opacity-70"
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-secondary-soft">
              <Mail size={16} color={c.secondary} strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="font-bodyBold text-[14px] text-ink">
                {slide.shareLabel}
              </Text>
              <Text className="mt-0.5 font-body text-[11px] text-ink-mute">
                {t('recap.stories.actions.shareSub')}
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={slide.onDetail}
            className="flex-row items-center gap-2 self-start rounded-full px-4 py-2.5 active:opacity-70"
          >
            <Text className="font-bodyBold text-[13px] text-primary">
              {slide.detailLabel}
            </Text>
            <ChevronRight size={14} color={c.primary} strokeWidth={2.4} />
          </Pressable>
        </View>

        <Text className="font-script text-[18px] text-ink-mute">
          {t('recap.stories.actions.signoff')}
        </Text>
      </View>
    </View>
  );
}
