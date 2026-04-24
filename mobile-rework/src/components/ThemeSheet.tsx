import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useIntentOpenGate } from '@/hooks/useIntentOpenGate';
import { useAppColors, useThemeControls } from '@/theme/ThemeProvider';
import type { ModePref } from '@/stores/themeStore';

// T356 (Sprint 61) — Theme picker sheet. Replaces the ComingSoonSheet stub on
// the Profile "Giao diện" row. Three options: Light / Dark / System.
//
// This sheet is a thin view layer over the existing theme infra:
//   - themeStore (src/stores/themeStore.ts) already persists mode under
//     @memoura/theme/v1 alongside palette/type/density — do NOT split keys.
//   - ThemeProvider already subscribes reactively, so setMode() propagates
//     to every `useAppColors()` consumer without a reload.
//
// UX: tapping a row calls setMode(key) immediately so the checkmark animates
// into its new slot; a 200ms setTimeout then dismisses the sheet so the user
// sees the confirmation before the sheet slides away. Same "close-after-
// action" idiom used in AnniversarySheet.

type OptionKey = Extract<ModePref, 'light' | 'dark' | 'system'>;

const OPTIONS: readonly { key: OptionKey; emoji: string }[] = [
  { key: 'light', emoji: '☀️' },
  { key: 'dark', emoji: '🌙' },
  { key: 'system', emoji: '📱' },
];

export type ThemeSheetHandle = {
  open: () => void;
  close: () => void;
};

export const ThemeSheet = forwardRef<ThemeSheetHandle>((_props, ref) => {
  const bsRef = useRef<BottomSheetModal>(null);
  const { markOpen, markDismissed, onChangeGate } = useIntentOpenGate(bsRef);
  const { t } = useTranslation();
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const { mode, setMode } = useThemeControls();

  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        markOpen();
        bsRef.current?.present();
      },
      close: () => {
        bsRef.current?.dismiss();
      },
    }),
    [markOpen],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.45}
      />
    ),
    [],
  );

  // Gorhom style-prop exception — background + grab handle only take style.
  const backgroundStyle = { backgroundColor: c.bgElev };
  const handleIndicatorStyle = { backgroundColor: c.lineOnSurface };

  const onSelect = useCallback(
    (key: OptionKey) => {
      setMode(key);
      // Let the checkmark animate into place before the sheet slides away so
      // the user sees the selection confirm, not just the sheet disappearing.
      setTimeout(() => bsRef.current?.dismiss(), 200);
    },
    [setMode],
  );

  return (
    <BottomSheetModal
      ref={bsRef}
      stackBehavior="push"
      enableDismissOnClose={false}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      onChange={onChangeGate}
      onDismiss={markDismissed}
    >
      <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="px-6 pt-2">
          <Text className="font-displayMedium text-ink text-[22px] leading-[28px]">
            {t('profile.theme.title')}
          </Text>
          <Text className="mt-1.5 font-body text-ink-soft text-[14px] leading-[20px]">
            {t('profile.theme.subtitle')}
          </Text>

          <View className="mt-4">
            {OPTIONS.map((opt, idx) => {
              const active = mode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => onSelect(opt.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`h-14 px-4 rounded-2xl flex-row items-center justify-between border ${
                    active ? 'bg-primary/10 border-primary/30' : 'border-line'
                  } ${idx > 0 ? 'mt-2' : ''}`}
                >
                  <View className="flex-row items-center">
                    <Text className="mr-3 text-[18px]">{opt.emoji}</Text>
                    <Text className="font-body text-ink text-[16px]">
                      {t(`profile.theme.option.${opt.key}` as const)}
                    </Text>
                  </View>
                  {active ? (
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M5 12l5 5L20 7"
                        stroke={c.primary}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

ThemeSheet.displayName = 'ThemeSheet';
