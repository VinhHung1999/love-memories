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
import { Text, type TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIntentOpenGate } from '@/hooks/useIntentOpenGate';
import { apiClient } from '@/lib/apiClient';
import { useAppColors } from '@/theme/ThemeProvider';

import { Button } from './Button';

// T357+T358 (Sprint 61) — Merged "edit couple identity" bottom sheet. Opens
// from the "Tên gọi của mình" row in Profile > Settings. Replaces T342's
// single-field CoupleNameSheet: now edits BOTH couple name AND slogan in
// one sheet so the two closely-related fields aren't split across rows.
//
// Endpoints (two separate writes — name lives on Couple, slogan is an
// AppSetting):
//   PUT /api/couple                     { name }
//   PUT /api/settings/app-slogan        { value }
//
// Why `app-slogan` (kebab-case)? Mirrors T355's `relationship-start-date`
// AppSetting key convention so settings keys share one grammar across the
// repo. Slogan deliberately does NOT get a dedicated Couple column — it's
// ornamental copy that only lives in the sheet; adding a schema column would
// mean a migration + backend + mobile + web sync for a purely-decorative
// field. AppSetting keeps it reversible.
//
// Save orchestration — `Promise.allSettled` + keep-alive UX. We build a
// promises array for ONLY the dirty+valid fields, run them in parallel,
// and map each result independently:
//   - Fulfilled → call the matching `onSaved*` callback so the VM commits
//     that field immediately (row + hero stay in sync even if the other
//     field fails below).
//   - Rejected → collect the error key for inline rendering under that
//     specific field's label.
// This is deliberately NOT `Promise.all` — a partial failure (e.g. slogan
// PUT 500s while name PUT 200s) must NOT revert the successful write. The
// sheet stays open with the error localized to the failed field; the user
// retries that field alone. If BOTH fail, a shared banner above the buttons
// reads `errors.saveFailed`.
//
// Gorhom BottomSheetTextInput style-prop carve-out: gorhom's keyboard-aware
// wrapper doesn't accept className, and the project's documented carve-out
// (see .claude/rules/mobile-rework.md) allows the inline style object. Both
// text inputs here share the SAME style object literal verbatim (matches
// CoupleNameSheet lines 174-184) so the two fields visually align — any
// divergence would read as "one field is special" which it isn't.

export type EditCoupleIdentitySheetHandle = {
  open: (currentName: string | null, currentSlogan: string | null) => void;
  close: () => void;
};

type FieldError = 'nameRequired' | 'sloganTooLong' | 'saveFailed';

type Props = {
  // Called with the trimmed committed name once the /api/couple PUT
  // resolves. Parent VM patches couple.name so the hero + settings row
  // detail re-render without waiting for a full refetch.
  onSavedName: (name: string) => void;
  // Called with the trimmed committed slogan once the /api/settings/app-slogan
  // PUT resolves. Parent VM patches its slogan state. Empty string is a
  // valid committed value — it means "clear the slogan".
  onSavedSlogan: (slogan: string) => void;
};

const NAME_MAX = 40;
const SLOGAN_MAX = 80;

export const EditCoupleIdentitySheet = forwardRef<
  EditCoupleIdentitySheetHandle,
  Props
>(({ onSavedName, onSavedSlogan }, ref) => {
  const bsRef = useRef<BottomSheetModal>(null);
  const { markOpen, markDismissed, onChangeGate } = useIntentOpenGate(bsRef);
  // BottomSheetTextInput is typed against react-native-gesture-handler's
  // TextInput re-export — structurally equivalent to RN's at runtime (both
  // expose .focus()) but the two type names don't unify. We only call
  // .focus() on this ref so narrow the stored type to that shape.
  const sloganInputRef = useRef<Pick<TextInput, 'focus'> | null>(null);
  const { t } = useTranslation();
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState<string>('');
  const [slogan, setSlogan] = useState<string>('');
  const [initialName, setInitialName] = useState<string>('');
  const [initialSlogan, setInitialSlogan] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [sloganError, setSloganError] = useState<FieldError | null>(null);
  const [bothFailed, setBothFailed] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      open: (currentName, currentSlogan) => {
        const nameSeed = currentName ?? '';
        const sloganSeed = currentSlogan ?? '';
        setName(nameSeed);
        setSlogan(sloganSeed);
        setInitialName(nameSeed);
        setInitialSlogan(sloganSeed);
        setNameError(null);
        setSloganError(null);
        setBothFailed(false);
        setSubmitting(false);
        // T367 recon — log every present() call path so we can tell an
        // auto-reopen (onChange 0 without a preceding "open→present") from a
        // legit user tap.
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

  // Gorhom style-prop exception — background + grab handle only take style objects.
  const backgroundStyle = { backgroundColor: c.bgElev };
  const handleIndicatorStyle = { backgroundColor: c.lineOnSurface };

  const trimmedName = name.trim();
  const trimmedSlogan = slogan.trim();
  const nameDirty = trimmedName !== initialName.trim();
  const sloganDirty = trimmedSlogan !== initialSlogan.trim();
  const anyDirty = nameDirty || sloganDirty;
  const canSave = anyDirty && !submitting;

  const onSave = useCallback(async () => {
    // Nothing to save → just dismiss. Saves a round-trip + a needless
    // validation error on an opened-but-untouched sheet.
    if (!anyDirty) {
      bsRef.current?.dismiss();
      return;
    }

    // Pre-flight validation. Inline errors only — we stay open so the
    // user can correct without re-opening.
    let hasValidationError = false;
    if (nameDirty && trimmedName.length < 1) {
      setNameError('nameRequired');
      hasValidationError = true;
    } else {
      setNameError(null);
    }
    if (sloganDirty && trimmedSlogan.length > SLOGAN_MAX) {
      setSloganError('sloganTooLong');
      hasValidationError = true;
    } else {
      setSloganError(null);
    }
    if (hasValidationError) return;
    setBothFailed(false);

    // Build the promise array only for dirty+valid fields so we never PUT
    // a field the user didn't touch.
    type Op = 'name' | 'slogan';
    const promises: Promise<unknown>[] = [];
    const ops: Op[] = [];
    if (nameDirty) {
      promises.push(apiClient.put('/api/couple', { name: trimmedName }));
      ops.push('name');
    }
    if (sloganDirty) {
      promises.push(
        apiClient.put('/api/settings/app-slogan', { value: trimmedSlogan }),
      );
      ops.push('slogan');
    }

    setSubmitting(true);
    try {
      // Promise.allSettled — NOT Promise.all. A partial failure must leave
      // the successful field committed (keep-alive UX).
      const results = await Promise.allSettled(promises);

      let nameOk: boolean | null = null;
      let sloganOk: boolean | null = null;

      results.forEach((result, idx) => {
        const op = ops[idx];
        const fulfilled = result.status === 'fulfilled';
        if (op === 'name') nameOk = fulfilled;
        if (op === 'slogan') sloganOk = fulfilled;
      });

      // Commit successful fields up to the VM BEFORE handling errors so
      // the row detail reflects the successful write even if we stay open
      // for the failed one.
      if (nameOk) onSavedName(trimmedName);
      if (sloganOk) onSavedSlogan(trimmedSlogan);

      const nameFailed = nameOk === false;
      const sloganFailed = sloganOk === false;

      if (nameFailed && sloganFailed) {
        // Both attempted and both failed → shared banner, stay open.
        setBothFailed(true);
        return;
      }
      if (nameFailed) {
        setNameError('saveFailed');
        return;
      }
      if (sloganFailed) {
        setSloganError('saveFailed');
        return;
      }

      // Everything committed → close AFTER 200ms so the parent state
      // update propagates into the settings row BEFORE the sheet animates
      // out (same idiom as CoupleNameSheet / T342).
      setTimeout(() => bsRef.current?.dismiss(), 200);
    } finally {
      setSubmitting(false);
    }
  }, [
    anyDirty,
    nameDirty,
    sloganDirty,
    trimmedName,
    trimmedSlogan,
    onSavedName,
    onSavedSlogan,
  ]);

  // Shared style object for both BottomSheetTextInputs — gorhom carve-out.
  // Match CoupleNameSheet's object verbatim so the fields read as a set.
  const inputStyle = {
    backgroundColor: c.surface,
    color: c.ink,
    borderColor: c.lineOnSurface,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'BeVietnamPro-Medium',
    fontSize: 15,
  };

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
            {t('profile.editIdentity.title')}
          </Text>
          <Text className="mt-1.5 font-body text-ink-soft text-[14px] leading-[20px]">
            {t('profile.editIdentity.subtitle')}
          </Text>

          {/* Field A — Name. returnKeyType=next jumps focus to Field B; the
              slogan TextInput ref is exposed via a standard RN ref even
              though the wrapper is gorhom's (BottomSheetTextInput forwards
              the underlying TextInput ref). */}
          <View className="mt-5">
            <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[1.2px] mb-1.5 pl-1">
              {t('profile.editIdentity.fields.name.label')}
            </Text>
            <BottomSheetTextInput
              value={name}
              onChangeText={(next) => {
                setName(next);
                if (nameError === 'nameRequired' && next.trim()) {
                  setNameError(null);
                }
                if (nameError === 'saveFailed') setNameError(null);
                if (bothFailed) setBothFailed(false);
              }}
              placeholder={t('profile.editIdentity.fields.name.placeholder')}
              placeholderTextColor={c.inkMute}
              editable={!submitting}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={NAME_MAX}
              returnKeyType="next"
              onSubmitEditing={() => sloganInputRef.current?.focus()}
              style={inputStyle}
            />
            {nameError ? (
              <Text className="mt-1.5 font-body text-primary-deep text-[13px] pl-1">
                {t(`profile.editIdentity.errors.${nameError}`)}
              </Text>
            ) : null}
          </View>

          {/* Field B — Slogan. maxLength hard-stops the keyboard at 80 so
              `sloganTooLong` is effectively a guardrail only — we keep the
              validation check anyway in case paste bypasses maxLength on
              some platforms. Counter sits below-right so it reads as
              metadata rather than a live error. */}
          <View className="mt-4">
            <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[1.2px] mb-1.5 pl-1">
              {t('profile.editIdentity.fields.slogan.label')}
            </Text>
            <BottomSheetTextInput
              ref={(instance) => {
                // Gorhom's TextInput ref type differs from core RN's — we
                // normalize to the narrow `Pick<TextInput, 'focus'>` shape
                // we declared above. Null when unmounted.
                sloganInputRef.current = (instance ?? null) as
                  | Pick<TextInput, 'focus'>
                  | null;
              }}
              value={slogan}
              onChangeText={(next) => {
                setSlogan(next);
                if (sloganError === 'sloganTooLong' && next.trim().length <= SLOGAN_MAX) {
                  setSloganError(null);
                }
                if (sloganError === 'saveFailed') setSloganError(null);
                if (bothFailed) setBothFailed(false);
              }}
              placeholder={t('profile.editIdentity.fields.slogan.placeholder')}
              placeholderTextColor={c.inkMute}
              editable={!submitting}
              autoCapitalize="sentences"
              autoCorrect
              maxLength={SLOGAN_MAX}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (canSave) void onSave();
              }}
              style={inputStyle}
            />
            <View className="flex-row justify-between mt-1 pl-1 pr-1">
              {sloganError ? (
                <Text className="font-body text-primary-deep text-[13px] flex-1">
                  {t(`profile.editIdentity.errors.${sloganError}`)}
                </Text>
              ) : (
                <View className="flex-1" />
              )}
              <Text className="font-body text-ink-mute text-[11px] ml-2">
                {t('profile.editIdentity.counter', {
                  count: slogan.length,
                  max: SLOGAN_MAX,
                })}
              </Text>
            </View>
          </View>

          {bothFailed ? (
            <Text className="mt-3 font-body text-primary-deep text-[13px] text-center">
              {t('profile.editIdentity.errors.saveFailed')}
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
                  ? t('profile.editIdentity.saving')
                  : t('profile.editIdentity.save')
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
});

EditCoupleIdentitySheet.displayName = 'EditCoupleIdentitySheet';
