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
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/theme/ThemeProvider';

import { Button } from './Button';

// T348 (Sprint 61) — Delete Account confirmation sheet. Opened from the
// destructive "Xóa tài khoản" row in Profile > Settings AFTER the user
// clears the initial Alert.alert() gate in ProfileScreen. This sheet is the
// second step of the 2-step flow: a text-challenge ("gõ XÓA") + a final
// destructive confirm button that triggers DELETE /api/auth/account.
//
// Contract:
//   - onConfirm resolves on 200 (parent handles authStore.clear + nav reset).
//   - onConfirm throws on non-200 / network failure. Sheet catches and renders
//     inline error text; does NOT close or clear auth so the user can retry.
//   - Backdrop + pan-down dismiss are DISABLED while submitting so a
//     misfired tap mid-request can't orphan the delete.
//   - BottomSheetTextInput (not RN TextInput) for keyboard-aware layout
//     inside the gorhom sheet. Style-prop exception documented in T341/T342.
//
// App Store 5.1.1(v) — the second text challenge is a deliberate UX friction
// so a misclick + reviewer script can't nuke an account. The required word
// is localized ("XÓA" / "DELETE") and matched case-sensitive after trim.

export type DeleteAccountSheetHandle = {
  open: () => void;
  close: () => void;
};

type FormError = { kind: 'network' };

type Props = {
  // Called when the user has typed the challenge word correctly and tapped
  // the destructive confirm. Must resolve on 200 (parent does clearAuth +
  // nav reset) or throw on failure (sheet stays open, shows inline error).
  onConfirm: () => Promise<void>;
};

export const DeleteAccountSheet = forwardRef<DeleteAccountSheetHandle, Props>(
  ({ onConfirm }, ref) => {
    const bsRef = useRef<BottomSheetModal>(null);
    const { t } = useTranslation();
    const c = useAppColors();
    const insets = useSafeAreaInsets();

    const [challenge, setChallenge] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<FormError | null>(null);

    // The required word (e.g. "XÓA" / "DELETE") comes from the locale so
    // Vietnamese users don't get an English-only prompt. Match is trimmed
    // + case-sensitive — allowing "xoa" would let autocorrect bypass the
    // friction, which is exactly what this gate exists to prevent.
    const requiredWord = t('profile.deleteAccount.challenge');
    const canConfirm = challenge.trim() === requiredWord && !submitting;

    useImperativeHandle(
      ref,
      () => ({
        open: () => {
          setChallenge('');
          setFormError(null);
          setSubmitting(false);
          bsRef.current?.present();
        },
        close: () => {
          bsRef.current?.dismiss();
        },
      }),
      [],
    );

    // Backdrop dismiss must be disabled while the DELETE is in flight —
    // otherwise a stray tap between request + response orphans state
    // (sheet closed, auth still valid, user confused).
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior={submitting ? 'none' : 'close'}
          opacity={0.45}
        />
      ),
      [submitting],
    );

    // Gorhom style-prop exception — background + grab handle can't take
    // className. Matched to CoupleNameSheet so palette/mode switches
    // propagate without divergence.
    const backgroundStyle = { backgroundColor: c.bgElev };
    const handleIndicatorStyle = { backgroundColor: c.lineOnSurface };

    const onConfirmPress = useCallback(async () => {
      if (!canConfirm) return;
      setSubmitting(true);
      setFormError(null);
      try {
        await onConfirm();
        // Parent clears auth + resets nav. Gate close() via parent (runs
        // AFTER clearAuth) so the auth-gate's navigation race is avoided.
        bsRef.current?.dismiss();
      } catch {
        setFormError({ kind: 'network' });
        setSubmitting(false);
      }
    }, [canConfirm, onConfirm]);

    return (
      <BottomSheetModal
        ref={bsRef}
        enableDynamicSizing
        enablePanDownToClose={!submitting}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        backgroundStyle={backgroundStyle}
        handleIndicatorStyle={handleIndicatorStyle}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="px-6 pt-2">
            <Text className="font-displayMedium text-primary-deep text-[22px] leading-[28px]">
              {t('profile.deleteAccount.title')}
            </Text>
            <Text className="mt-1.5 font-body text-ink-soft text-[14px] leading-[20px]">
              {t('profile.deleteAccount.subtitle')}
            </Text>

            <View className="mt-5">
              <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[1.2px] mb-1.5 pl-1">
                {t('profile.deleteAccount.inputLabel', { word: requiredWord })}
              </Text>
              <BottomSheetTextInput
                value={challenge}
                onChangeText={setChallenge}
                placeholder={t('profile.deleteAccount.placeholder', { word: requiredWord })}
                placeholderTextColor={c.inkMute}
                editable={!submitting}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (canConfirm) void onConfirmPress();
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
                  letterSpacing: 1.5,
                }}
              />
            </View>

            {formError ? (
              <Text className="mt-2 font-body text-primary-deep text-[13px] text-center">
                {t(`profile.deleteAccount.errors.${formError.kind}`)}
              </Text>
            ) : null}

            <View className="mt-6 flex-row gap-2">
              <Button
                label={t('profile.deleteAccount.cancel')}
                onPress={() => bsRef.current?.dismiss()}
                variant="secondary"
                size="lg"
                disabled={submitting}
                className="flex-1"
              />
              {/* Destructive confirm — no Button variant for this colour so
                  we override `bg-primary` + `active:bg-primary-deep` via
                  className. primary-deep is the rose-red used for the Sign
                  Out row label elsewhere in Profile. */}
              <Pressable
                onPress={canConfirm ? onConfirmPress : undefined}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canConfirm, busy: submitting }}
                className="flex-1 h-14 rounded-full items-center justify-center active:opacity-90"
                style={{ backgroundColor: canConfirm ? c.primaryDeep : c.surfaceAlt }}
              >
                <Text
                  className="font-bodySemibold text-base"
                  style={{ color: canConfirm ? '#ffffff' : c.inkMute }}
                >
                  {submitting
                    ? t('profile.deleteAccount.confirming')
                    : t('profile.deleteAccount.confirmCta')}
                </Text>
              </Pressable>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

DeleteAccountSheet.displayName = 'DeleteAccountSheet';
