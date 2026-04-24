import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t367Log } from '@/devtools/t367Log';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useAppColors } from '@/theme/ThemeProvider';

import { Button } from './Button';
import { LinearGradient } from './Gradient';

// T341 (Sprint 61) — Edit Profile bottom sheet. Opens from either the hero
// self-avatar or the dedicated "Chỉnh sửa hồ sơ" row in ProfileScreen. Scope
// = the user's own row only (name + avatar); couple-level fields (coupleName,
// anniversary, color) are T342's concern.
//
// Endpoints (reused — no new BE work in this sprint):
//   PUT  /api/profile           { name }           → updates current user's name
//   POST /api/profile/avatar    multipart `avatar` → updates current user's avatar
//
// Spec calls this "PATCH /api/users/me" but the real routes predate that naming
// (Sprint 60). PO logged a REST-cleanup follow-up to the backlog; for this
// sprint we match the existing contract the Personalize flow already uses.
//
// Pattern — mirrors Personalize (T314): avatar is upload-on-pick (optimistic),
// name is commit-on-Save. That way users who only swap the photo don't need
// to tap Save, and accidental-close preserves the photo they chose. Name goes
// through a single PUT when they tap "Lưu"; sheet closes on 200.

export type EditProfileSheetHandle = {
  open: () => void;
  close: () => void;
};

type FormError =
  | { kind: 'nameRequired' }
  | { kind: 'avatarFailed' }
  | { kind: 'network' };

type AvatarUploadResponse = {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
};

export const EditProfileSheet = forwardRef<EditProfileSheetHandle>((_props, ref) => {
  const bsRef = useRef<BottomSheetModal>(null);
  const { t } = useTranslation();
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Local draft — seeded from the live user on open() so the sheet always
  // reflects the current value even if the user was updated since last mount.
  const [name, setName] = useState<string>(user?.name ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<FormError | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        // Re-read live user on every open — another action (avatar upload in
        // a different session, couple-name edit) may have changed it since
        // the sheet last mounted.
        const current = useAuthStore.getState().user;
        setName(current?.name ?? '');
        setAvatarUri(current?.avatarUrl ?? null);
        setFormError(null);
        setSubmitting(false);
        setAvatarUploading(false);
        t367Log('EditProfile', 'open-present');
        bsRef.current?.present();
      },
      close: () => {
        t367Log('EditProfile', 'close-dismiss');
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

  // Gorhom style-prop exception — background + grab handle can't take className.
  const backgroundStyle = { backgroundColor: c.bgElev };
  const handleIndicatorStyle = { backgroundColor: c.lineOnSurface };

  const onPickAvatar = useCallback(async () => {
    if (avatarUploading || submitting) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted && perm.status !== 'granted') return;

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (res.canceled || !res.assets?.[0]) return;

      const asset = res.assets[0];
      const uri = asset.uri;
      // Optimistic: show the new photo immediately while the CDN upload races.
      setAvatarUri(uri);
      setFormError((prev) => (prev?.kind === 'avatarFailed' ? null : prev));
      setAvatarUploading(true);

      // expo-image-picker sometimes omits fileName on iOS — synthesize one.
      const fallbackName = `avatar-${Date.now()}.jpg`;
      const fileName = asset.fileName ?? fallbackName;
      const mimeType = asset.mimeType ?? 'image/jpeg';

      try {
        const updated = await apiClient.upload<AvatarUploadResponse>(
          '/api/profile/avatar',
          'avatar',
          { uri, name: fileName, type: mimeType },
        );
        const current = useAuthStore.getState().user;
        if (current) {
          setUser({ ...current, avatarUrl: updated.avatar });
        }
        // Swap the local-file preview for the CDN url so we don't hold a
        // reference that iOS may evict mid-session.
        if (updated.avatar) setAvatarUri(updated.avatar);
      } catch {
        setFormError({ kind: 'avatarFailed' });
      } finally {
        setAvatarUploading(false);
      }
    } catch {
      // ImagePicker launch failed (perms denied at OS level, etc.) — no-op.
    }
  }, [avatarUploading, submitting, setUser]);

  const onSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError({ kind: 'nameRequired' });
      return;
    }
    // No-op if nothing changed and no upload is pending — just close.
    if (trimmed === (user?.name ?? '').trim() && !avatarUploading) {
      bsRef.current?.dismiss();
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (trimmed !== (user?.name ?? '').trim()) {
        await apiClient.put('/api/profile', { name: trimmed });
        const current = useAuthStore.getState().user;
        if (current) setUser({ ...current, name: trimmed });
      }
      // PO rule: close AFTER 200 + store updated so the hero refresh is visible
      // before the sheet animates out.
      bsRef.current?.dismiss();
    } catch {
      setFormError({ kind: 'network' });
    } finally {
      setSubmitting(false);
    }
  }, [name, user, avatarUploading, setUser]);

  // Fallback initial for the empty-state avatar chip.
  const initial =
    (name.trim() || user?.name || t('profile.hero.selfFallback')).charAt(0).toUpperCase() ||
    '·';

  const nameDirty = name.trim() !== (user?.name ?? '').trim();
  const canSave = !!name.trim() && !submitting && !avatarUploading;

  return (
    <BottomSheetModal
      ref={bsRef}
      enableDynamicSizing
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      onChange={(idx) => t367Log('EditProfile', 'onChange', idx)}
      onDismiss={() => t367Log('EditProfile', 'onDismiss')}
    >
      <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="px-6 pt-2">
          <Text className="font-displayMedium text-ink text-[22px] leading-[28px]">
            {t('profile.editProfile.title')}
          </Text>
          <Text className="mt-1.5 font-body text-ink-soft text-[14px] leading-[20px]">
            {t('profile.editProfile.subtitle')}
          </Text>

          <View className="mt-5 items-center">
            <AvatarPicker
              uri={avatarUri}
              initial={initial}
              uploading={avatarUploading}
              disabled={submitting}
              onPress={onPickAvatar}
              heroA={c.heroA}
              heroB={c.heroB}
              ctaLabel={
                avatarUploading
                  ? t('profile.editProfile.avatarUploading')
                  : avatarUri
                    ? t('profile.editProfile.avatarChange')
                    : t('profile.editProfile.avatarAdd')
              }
            />
          </View>

          <View className="mt-6">
            <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[1.2px] mb-1.5 pl-1">
              {t('profile.editProfile.nameLabel')}
            </Text>
            {/* BottomSheetTextInput — gorhom's keyboard-aware wrapper. Plain
                RN TextInput inside a BottomSheetModal doesn't trigger the
                sheet's internal keyboard shift and the input hides under
                the keyboard (memory: mobile bugs/bottomsheet-textinput). */}
            <BottomSheetTextInput
              value={name}
              onChangeText={(next) => {
                setName(next);
                if (formError?.kind === 'nameRequired' && next.trim()) {
                  setFormError(null);
                }
              }}
              placeholder={t('profile.editProfile.namePlaceholder')}
              placeholderTextColor={c.inkMute}
              editable={!submitting}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (canSave && nameDirty) void onSave();
              }}
              // Single unavoidable style exception — BottomSheetTextInput is
              // a gorhom-provided primitive; the library only accepts style=
              // (no className prop wiring). Values come from useAppColors()
              // so palette/mode switches propagate.
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
              {t(`profile.editProfile.errors.${formError.kind}`)}
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
                  ? t('profile.editProfile.saving')
                  : t('profile.editProfile.save')
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

EditProfileSheet.displayName = 'EditProfileSheet';

type AvatarPickerProps = {
  uri: string | null;
  initial: string;
  uploading: boolean;
  disabled?: boolean;
  onPress: () => void;
  ctaLabel: string;
  heroA: string;
  heroB: string;
};

// Shrunken port of Personalize's AvatarPicker (112→88 px). Same 3 states:
// empty → gradient + initial; picked → image; loading → image + spinner
// overlay. Camera badge only shows when there's already a photo (matches
// Personalize affordance — the empty state is obvious enough on its own).
function AvatarPicker({
  uri,
  initial,
  uploading,
  disabled,
  onPress,
  ctaLabel,
  heroA,
  heroB,
}: AvatarPickerProps) {
  return (
    <View className="items-center">
      <View className="w-[88px] h-[88px]">
        <Pressable
          onPress={disabled ? undefined : onPress}
          accessibilityRole="button"
          accessibilityState={{ disabled: !!disabled, busy: uploading }}
          accessibilityLabel={ctaLabel}
          hitSlop={8}
          disabled={disabled}
          className="w-[88px] h-[88px] rounded-full overflow-hidden border-2 border-bg shadow-hero active:opacity-90"
          style={{ opacity: disabled ? 0.6 : 1 }}
        >
          {uri ? (
            <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <>
              <LinearGradient
                colors={[heroA, heroB]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
              />
              <View className="flex-1 items-center justify-center">
                <Text className="font-displayBold text-white text-[32px]">{initial}</Text>
              </View>
            </>
          )}
          {uploading ? (
            <View className="absolute inset-0 items-center justify-center bg-black/35">
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null}
        </Pressable>
        {uri && !uploading ? (
          <View
            pointerEvents="none"
            className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-white items-center justify-center shadow-chip border-2 border-bg"
          >
            <Camera size={13} color="#1A1A1A" strokeWidth={2.2} />
          </View>
        ) : null}
      </View>
      <Text className="mt-2 font-bodyMedium text-ink-soft text-[13px]">{ctaLabel}</Text>
    </View>
  );
}
