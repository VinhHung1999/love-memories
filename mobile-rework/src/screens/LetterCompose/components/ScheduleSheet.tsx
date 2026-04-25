import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/theme/ThemeProvider';

// T423 (Sprint 65) — schedule sheet for the "Hẹn gửi" attachment. Uses the
// existing @react-native-community/datetimepicker (Personalize already wires
// it). iOS shows the inline spinner; Android pops the native dialog (open
// once per show — so we render a transient mounted picker that we tear down
// after each pick).
//
// Default seed: tomorrow 9 AM device-local (Lu Q3 — Boss + Như both UTC+7
// so it lines up with Asia/Ho_Chi_Minh in practice). Min selectable = now +
// 5 min. Confirm sets `scheduledAt`, Clear nullifies it (DRAFT again).

export type ScheduleSheetHandle = {
  open: (current: Date | null) => void;
  close: () => void;
};

type Props = {
  title: string;
  hint: string;
  confirmLabel: string;
  clearLabel: string;
  cancelLabel: string;
  onConfirm: (date: Date) => void;
  onClear: () => void;
};

const MIN_OFFSET_MS = 5 * 60 * 1000;

function defaultSeed(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

export const ScheduleSheet = forwardRef<ScheduleSheetHandle, Props>(
  function ScheduleSheet(
    { title, hint, confirmLabel, clearLabel, cancelLabel, onConfirm, onClear },
    ref,
  ) {
    const c = useAppColors();
    const insets = useSafeAreaInsets();
    const bsRef = useRef<BottomSheetModal>(null);
    const [picked, setPicked] = useState<Date>(defaultSeed());
    const [androidPickerOpen, setAndroidPickerOpen] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        open: (current) => {
          const seed = current ?? defaultSeed();
          const min = new Date(Date.now() + MIN_OFFSET_MS);
          setPicked(seed.getTime() < min.getTime() ? min : seed);
          if (Platform.OS === 'android') setAndroidPickerOpen(true);
          bsRef.current?.present();
        },
        close: () => bsRef.current?.dismiss(),
      }),
      [],
    );

    const onIosChange = (_e: DateTimePickerEvent, next?: Date) => {
      if (next) setPicked(next);
    };

    const onAndroidChange = (e: DateTimePickerEvent, next?: Date) => {
      setAndroidPickerOpen(false);
      if (e.type === 'set' && next) setPicked(next);
    };

    const onConfirmPress = () => {
      onConfirm(picked);
      bsRef.current?.dismiss();
    };

    const onClearPress = () => {
      onClear();
      bsRef.current?.dismiss();
    };

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

    const minDate = new Date(Date.now() + MIN_OFFSET_MS);

    return (
      <BottomSheetModal
        ref={bsRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: c.bgElev }}
        handleIndicatorStyle={{ backgroundColor: c.lineOnSurface }}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="px-6 pt-2">
            <Text className="font-displayMedium text-ink text-[22px] leading-[26px]">
              {title}
            </Text>
            <Text className="mt-2 font-body text-ink-mute text-[13px] leading-[20px]">
              {hint}
            </Text>

            {Platform.OS === 'ios' ? (
              <View className="mt-3 items-center">
                <DateTimePicker
                  value={picked}
                  mode="datetime"
                  display="spinner"
                  minimumDate={minDate}
                  onChange={onIosChange}
                />
              </View>
            ) : (
              <View className="mt-3">
                <Pressable
                  onPress={() => setAndroidPickerOpen(true)}
                  className="rounded-2xl px-4 py-3 bg-surface border border-line-on-surface active:opacity-80"
                >
                  <Text className="font-bodySemibold text-ink text-[14px]">
                    {picked.toLocaleString()}
                  </Text>
                </Pressable>
                {androidPickerOpen ? (
                  <DateTimePicker
                    value={picked}
                    mode="datetime"
                    display="default"
                    minimumDate={minDate}
                    onChange={onAndroidChange}
                  />
                ) : null}
              </View>
            )}

            <View className="mt-4 flex-row gap-2">
              <Pressable
                onPress={() => bsRef.current?.dismiss()}
                className="flex-1 h-[44px] rounded-2xl items-center justify-center bg-surface border border-line-on-surface active:opacity-80"
              >
                <Text className="font-bodyBold text-ink text-[13px]">
                  {cancelLabel}
                </Text>
              </Pressable>
              <Pressable
                onPress={onClearPress}
                className="flex-1 h-[44px] rounded-2xl items-center justify-center bg-surface-alt active:opacity-80"
              >
                <Text className="font-bodyBold text-ink text-[13px]">
                  {clearLabel}
                </Text>
              </Pressable>
              <Pressable
                onPress={onConfirmPress}
                className="flex-1 h-[44px] rounded-2xl items-center justify-center bg-primary active:bg-primary-deep"
              >
                <Text className="font-bodyBold text-white text-[13px]">
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
