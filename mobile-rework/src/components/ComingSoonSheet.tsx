import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/theme/ThemeProvider';
import { Button } from './Button';

// T344 (Sprint 61) — shared "coming soon" bottom sheet for the 4 Profile
// settings rows that stub future features (Kỷ niệm / Giao diện / Memoura+ /
// Tour). Caller holds a ref, calls `ref.current?.open()` with an optional
// subtitle. Single instance per screen is fine: we only show one at a time.

export type ComingSoonSheetHandle = {
  open: (subtitle?: string) => void;
  close: () => void;
};

export const ComingSoonSheet = forwardRef<ComingSoonSheetHandle>((_props, ref) => {
  const bsRef = useRef<BottomSheetModal>(null);
  const [subtitle, setSubtitle] = useState<string | undefined>(undefined);
  const { t } = useTranslation();
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  useImperativeHandle(
    ref,
    () => ({
      open: (next) => {
        setSubtitle(next);
        bsRef.current?.present();
      },
      close: () => {
        bsRef.current?.dismiss();
      },
    }),
    [],
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

  // @gorhom/bottom-sheet's background + grab-handle are styled via style-prop
  // APIs that can't accept className. Values come from the theme via
  // useAppColors() so the sheet keeps up with palette / mode switches — this
  // is the documented "library API requires style object" exception carried
  // over from legacy mobile/CLAUDE.md.
  const backgroundStyle = { backgroundColor: c.bgElev };
  const handleIndicatorStyle = { backgroundColor: c.lineOnSurface };

  return (
    <BottomSheetModal
      ref={bsRef}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      onDismiss={() => setSubtitle(undefined)}
    >
      <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="px-6 pt-2">
          <Text className="font-displayMedium text-ink text-[22px] leading-[28px]">
            {t('common.comingSoon.title')}
          </Text>
          <Text className="mt-2 font-body text-ink-soft text-[15px] leading-[22px]">
            {subtitle ?? t('common.comingSoon.defaultBody')}
          </Text>
          <View className="mt-6">
            <Button
              label={t('common.comingSoon.close')}
              onPress={() => bsRef.current?.dismiss()}
              fullWidth
              size="lg"
            />
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

ComingSoonSheet.displayName = 'ComingSoonSheet';
