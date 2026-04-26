import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';

import { useAppColors } from '@/theme/ThemeProvider';

// D46 (Build 76 hot-fix): wrap the sheet in a FullWindowOverlay on iOS so
// touches reach the buttons. LetterCompose sits inside the (modal) Stack
// group → @gorhom/bottom-sheet's portal mounts above expo-router's
// transparentModal native screen, which intercepts touches before they reach
// the sheet content. CameraActionSheet uses the same workaround.
function iOSContainer(props: { children?: React.ReactNode }) {
  return <FullWindowOverlay>{props.children}</FullWindowOverlay>;
}

// T423 (Sprint 65) — confirm sheet for back-press while compose is dirty.
// "Lưu nháp" keeps the DRAFT alive on the BE; "Bỏ" deletes it. Cancel
// dismisses the sheet (the user stays on the compose screen).

export type DiscardSheetHandle = {
  open: () => void;
  close: () => void;
};

type Props = {
  title: string;
  body: string;
  saveLabel: string;
  discardLabel: string;
  cancelLabel: string;
  onSave: () => void;
  onDiscard: () => void;
};

export const DiscardSheet = forwardRef<DiscardSheetHandle, Props>(
  function DiscardSheet(
    { title, body, saveLabel, discardLabel, cancelLabel, onSave, onDiscard },
    ref,
  ) {
    const c = useAppColors();
    const insets = useSafeAreaInsets();
    const bsRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(
      ref,
      () => ({
        open: () => bsRef.current?.present(),
        close: () => bsRef.current?.dismiss(),
      }),
      [],
    );

    const renderBackdrop = useCallback(
      (p: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...p}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          opacity={0.45}
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={bsRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        containerComponent={Platform.OS === 'ios' ? iOSContainer : undefined}
        backgroundStyle={{ backgroundColor: c.bgElev }}
        handleIndicatorStyle={{ backgroundColor: c.lineOnSurface }}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="px-6 pt-2">
            <Text className="font-displayMedium text-ink text-[22px] leading-[26px]">
              {title}
            </Text>
            <Text className="mt-2 font-body text-ink-soft text-[14px] leading-[20px]">
              {body}
            </Text>
            <View className="mt-5 gap-2">
              <Pressable
                onPress={() => {
                  bsRef.current?.dismiss();
                  onSave();
                }}
                className="h-[44px] rounded-2xl items-center justify-center bg-primary active:bg-primary-deep"
              >
                <Text className="font-bodyBold text-white text-[14px]">
                  {saveLabel}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  bsRef.current?.dismiss();
                  onDiscard();
                }}
                className="h-[44px] rounded-2xl items-center justify-center bg-surface-alt active:opacity-80"
              >
                <Text className="font-bodyBold text-primary text-[14px]">
                  {discardLabel}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => bsRef.current?.dismiss()}
                className="h-[44px] rounded-2xl items-center justify-center active:opacity-80"
              >
                <Text className="font-bodyBold text-ink-mute text-[13px]">
                  {cancelLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
