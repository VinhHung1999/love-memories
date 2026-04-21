import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors, useAppMode } from '@/theme/ThemeProvider';

import { Button } from './Button';

// T355 (Sprint 61) — Anniversary date picker. Opens from the "Kỷ niệm & ngày
// quan trọng" row. Single-date scope (relationship start) — no multi-date /
// count display per Lu spec, despite the prototype hinting at "3".
//
// Save path: PUT /api/couple { anniversaryDate } — the backend's Couple.update
// syncs BOTH couple.anniversaryDate (column, what ProfileVM reads back via
// GET /api/couple) AND AppSetting['relationship-start-date'] (what the web
// PWA Dashboard reads). Single call keeps every surface consistent; a naked
// PUT /api/settings/relationship-start-date would leave the column stale.
//
// Timezone guardrail: format YYYY-MM-DD from LOCAL parts
// (getFullYear / getMonth+1 / getDate with pad). `toISOString().slice(0,10)`
// shifts by up to ±1 day for users near midnight; likewise `new Date('YYYY-
// MM-DD')` parses as UTC 00:00 which can land on the previous local day —
// always rebuild from parts with `new Date(y, m - 1, d)` for the picker seed.
//
// Error UX (Lu guardrail): optimistic + revert is in the VM; the sheet just
// awaits `onSaved` and shows an inline error on reject. Sheet does NOT close
// on error — user retries the same state without re-picking.

export type AnniversarySheetHandle = {
  open: (currentIso: string | null) => void;
  close: () => void;
};

type Props = {
  // Parent owns the optimistic update + revert. Resolves on 2xx, rejects on
  // ApiError — the sheet maps a rejection to an inline network error and
  // stays open.
  onSaved: (iso: string) => Promise<void>;
};

// Local-timezone YYYY-MM-DD — see timezone guardrail above.
function toLocalIso(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Seed the picker from a stored YYYY-MM-DD without crossing into UTC parsing.
function parseLocalIso(iso: string | null): Date {
  if (!iso) return new Date();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return new Date();
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

export const AnniversarySheet = forwardRef<AnniversarySheetHandle, Props>(
  ({ onSaved }, ref) => {
    const bsRef = useRef<BottomSheetModal>(null);
    const { t } = useTranslation();
    const c = useAppColors();
    const mode = useAppMode();
    const insets = useSafeAreaInsets();

    const [date, setDate] = useState<Date>(() => new Date());
    const [initialIso, setInitialIso] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [networkError, setNetworkError] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        open: (currentIso) => {
          // Normalize the seed to a local YYYY-MM-DD so the dirty check
          // later compares apples to apples. The BE returns the DateTime
          // column as a full ISO timestamp; we only care about the date
          // half (same reasoning as parseLocalIso's regex).
          const seed = parseLocalIso(currentIso);
          setDate(seed);
          setInitialIso(currentIso ? toLocalIso(seed) : null);
          setNetworkError(false);
          setSubmitting(false);
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

    // Gorhom style-prop exception — background + grab handle only take style.
    const backgroundStyle = { backgroundColor: c.bgElev };
    const handleIndicatorStyle = { backgroundColor: c.lineOnSurface };

    const nextIso = toLocalIso(date);
    const dirty = nextIso !== initialIso;

    const onSave = useCallback(async () => {
      if (!dirty) {
        bsRef.current?.dismiss();
        return;
      }
      setSubmitting(true);
      setNetworkError(false);
      try {
        await onSaved(nextIso);
        bsRef.current?.dismiss();
      } catch {
        setNetworkError(true);
      } finally {
        setSubmitting(false);
      }
    }, [dirty, nextIso, onSaved]);

    return (
      <BottomSheetModal
        ref={bsRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={backgroundStyle}
        handleIndicatorStyle={handleIndicatorStyle}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="px-6 pt-2">
            <Text className="font-displayMedium text-ink text-[22px] leading-[28px]">
              {t('profile.anniversary.title')}
            </Text>
            <Text className="mt-1.5 font-body text-ink-soft text-[14px] leading-[20px]">
              {t('profile.anniversary.subtitle')}
            </Text>

            <View className="mt-4 items-center">
              {/* display='spinner' renders an inline wheel on both iOS and
                  Android, keeping the sheet self-contained (no secondary
                  modal). Max = today; past dates are allowed — couples
                  pairing later want to backfill their actual anniversary. */}
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                locale={Platform.OS === 'ios' ? 'vi-VN' : undefined}
                themeVariant={mode}
                textColor={c.ink}
                onChange={(_event, selected) => {
                  if (selected) setDate(selected);
                }}
              />
            </View>

            {networkError ? (
              <Text className="mt-1 font-body text-primary-deep text-[13px] text-center">
                {t('profile.anniversary.errors.network')}
              </Text>
            ) : null}

            <View className="mt-5 flex-row gap-2">
              <Button
                label={t('common.cancel')}
                onPress={() => bsRef.current?.dismiss()}
                variant="secondary"
                size="lg"
                disabled={submitting}
                className="flex-1"
              />
              <Button
                label={
                  submitting
                    ? t('profile.anniversary.saving')
                    : t('profile.anniversary.save')
                }
                onPress={onSave}
                size="lg"
                disabled={submitting}
                loading={submitting}
                className="flex-1"
              />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

AnniversarySheet.displayName = 'AnniversarySheet';
