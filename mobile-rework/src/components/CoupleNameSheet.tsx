import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiClient } from '@/lib/apiClient';
import { useIntentOpenGate } from '@/hooks/useIntentOpenGate';
import { useAppColors } from '@/theme/ThemeProvider';

import { Button } from './Button';

// T342 (Sprint 61) — Edit couple-name bottom sheet. Opens from the "Tên gọi
// của mình" row in Profile > Settings. Scope is a single field
// (couple.name) — anniversary + color live on separate rows / flows. No
// avatar here (couple doesn't own one; each user avatar is T341's concern).
//
// Endpoint (reused — spec called it PATCH /api/couple, real route is PUT):
//   PUT /api/couple  { name }  → returns the full updated couple
//
// Pattern: commit-on-Save only. Unlike T341's avatar (optimistic), there's
// just one field here and the BE returns the full updated row, so we hold
// the draft until Save and let the ProfileViewModel reflect the server
// value via the onSaved callback.

export type CoupleNameSheetHandle = {
  open: (currentName: string | null) => void;
  close: () => void;
};

type FormError = { kind: 'nameRequired' } | { kind: 'network' };

type Props = {
  // Called with the trimmed server-confirmed name after 200. Parent updates
  // the VM so the settings row detail + any downstream consumers re-render.
  onSaved: (name: string) => void;
};

export const CoupleNameSheet = forwardRef<CoupleNameSheetHandle, Props>(
  ({ onSaved }, ref) => {
    const bsRef = useRef<BottomSheetModal>(null);
    const { markOpen, markDismissed, onChangeGate } = useIntentOpenGate(bsRef);
    const { t } = useTranslation();
    const c = useAppColors();
    const insets = useSafeAreaInsets();

    const [name, setName] = useState<string>('');
    const [initialName, setInitialName] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<FormError | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        open: (currentName: string | null) => {
          const seed = currentName ?? '';
          setName(seed);
          setInitialName(seed);
          setFormError(null);
          setSubmitting(false);
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

    // Gorhom style-prop exception — background + grab handle can't take className.
    const backgroundStyle = { backgroundColor: c.bgElev };
    const handleIndicatorStyle = { backgroundColor: c.lineOnSurface };

    const trimmed = name.trim();
    const nameDirty = trimmed !== initialName.trim();
    const canSave = !!trimmed && !submitting;

    const onSave = useCallback(async () => {
      if (!trimmed) {
        setFormError({ kind: 'nameRequired' });
        return;
      }
      // No-op Save — just close. updateCoupleSchema rejects empty strings,
      // so this also guards against a round-trip that would 400.
      if (!nameDirty) {
        bsRef.current?.dismiss();
        return;
      }
      setSubmitting(true);
      setFormError(null);
      try {
        await apiClient.put('/api/couple', { name: trimmed });
        // PO rule (carried over from T341): close AFTER 200 + parent state
        // updated — the settings row detail needs to reflect the new name
        // before the sheet animates out.
        onSaved(trimmed);
        bsRef.current?.dismiss();
      } catch {
        setFormError({ kind: 'network' });
      } finally {
        setSubmitting(false);
      }
    }, [trimmed, nameDirty, onSaved]);

    return (
      <BottomSheetModal
        ref={bsRef}
        stackBehavior="push"
      enableDismissOnClose={false}
        enableDynamicSizing
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        backgroundStyle={backgroundStyle}
        handleIndicatorStyle={handleIndicatorStyle}
        onChange={onChangeGate}
        onDismiss={markDismissed}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="px-6 pt-2">
            <Text className="font-displayMedium text-ink text-[22px] leading-[28px]">
              {t('profile.coupleName.title')}
            </Text>
            <Text className="mt-1.5 font-body text-ink-soft text-[14px] leading-[20px]">
              {t('profile.coupleName.subtitle')}
            </Text>

            <View className="mt-5">
              <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[1.2px] mb-1.5 pl-1">
                {t('profile.coupleName.label')}
              </Text>
              {/* BottomSheetTextInput — gorhom keyboard-aware wrapper (plain
                  RN TextInput doesn't trigger the sheet's keyboard shift).
                  Style-prop exception documented in T341; gorhom API doesn't
                  accept className. Values from useAppColors so palette/mode
                  switches propagate. */}
              <BottomSheetTextInput
                value={name}
                onChangeText={(next) => {
                  setName(next);
                  if (formError?.kind === 'nameRequired' && next.trim()) {
                    setFormError(null);
                  }
                }}
                placeholder={t('profile.coupleName.placeholder')}
                placeholderTextColor={c.inkMute}
                editable={!submitting}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (canSave && nameDirty) void onSave();
                }}
                style={{
                  backgroundColor: c.surface,
                  color: c.ink,
                  borderColor: c.lineOnSurface,
                  borderWidth: 1.5,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontFamily: 'BeVietnamPro-Medium',
                  fontSize: 15,
                }}
              />
            </View>

            {formError ? (
              <Text className="mt-2 font-body text-primary-deep text-[13px] text-center">
                {t(`profile.coupleName.errors.${formError.kind}`)}
              </Text>
            ) : null}

            <View className="mt-6 flex-row gap-2">
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
                    ? t('profile.coupleName.saving')
                    : t('profile.coupleName.save')
                }
                onPress={onSave}
                size="lg"
                disabled={!canSave}
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

CoupleNameSheet.displayName = 'CoupleNameSheet';
