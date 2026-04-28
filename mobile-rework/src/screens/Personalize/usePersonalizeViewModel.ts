import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ApiError, apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// Sprint 68 T465 — Personalize is now USER-LEVEL ONLY (Boss Q1).
// Drops partner-name + anniversary-date inputs from Sprint 60 T286 — those
// fields move into the new CoupleForm screen (T466), submitted only when
// the user actually creates a couple. Personalize runs for every signed-in
// user (creator AND joiner) before the PairChoice fork, so it can't assume
// a coupleId exists yet.
//
// Submit contract:
//   PUT /api/profile { name, color }   (T471 — name + color in one call)
//   → setUser refreshes the local copy with the persisted values
//   → router.push('/(auth)/pair-create')
//
// T470 (Sprint 68): push (not reset) into PairChoice. PUT /api/profile is
// idempotent so re-submit is safe — the user can edge-swipe back to
// Personalize to edit their name / color and re-submit before committing
// the couple. The actual commit point is CoupleForm (T466 → BE T462).

export type ColorKey = 'primary' | 'accent' | 'secondary' | 'primaryDeep';

export const COLOR_KEYS: readonly ColorKey[] = [
  'primary',
  'accent',
  'secondary',
  'primaryDeep',
] as const;

function isColorKey(value: string | null | undefined): value is ColorKey {
  return value !== null && value !== undefined && (COLOR_KEYS as readonly string[]).includes(value);
}

type ProfileUpdateResponse = {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  color: string | null;
};

// T314 carry-over: /api/profile/avatar returns the updated user row. Only the
// CDN url is consumed downstream.
type AvatarUploadResponse = {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
};

type FormError = { kind: 'nameRequired' | 'avatarFailed' | 'network' };

export function usePersonalizeViewModel() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [nick, setNick] = useState<string>(user?.name ?? '');
  const [color, setColor] = useState<ColorKey>(
    isColorKey(user?.color ?? null) ? (user!.color as ColorKey) : 'primary',
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<FormError | null>(null);
  // Avatar carries over from T314 — optimistic local URI + background upload.
  const [avatarLocalUri, setAvatarLocalUri] = useState<string | null>(
    user?.avatarUrl ?? null,
  );
  const [avatarUploading, setAvatarUploading] = useState(false);

  const canSubmit = nick.trim().length > 0 && !submitting;

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setFormError(null);
    const trimmedName = nick.trim();
    if (!trimmedName) {
      setFormError({ kind: 'nameRequired' });
      return;
    }

    setSubmitting(true);
    try {
      const updated = await apiClient.put<ProfileUpdateResponse>('/api/profile', {
        name: trimmedName,
        color,
      });

      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        setUser({
          ...currentUser,
          name: updated.name,
          color: updated.color,
        });
      }

      // T470 (Sprint 68): push into PairChoice instead of reset. PUT
      // /api/profile is idempotent — letting the user back-swipe and tweak
      // name / color before committing the couple is safer than locking
      // them out. Reset only kicks in at the actual commit points
      // (CoupleForm submit → pair-wait, pair-join redeem → onboarding-done,
      // OnboardingDone tap → (tabs)).
      router.push('/(auth)/pair-create');
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError({ kind: 'network' });
      } else {
        setFormError({ kind: 'network' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, nick, color, setUser, router]);

  // T314 carry-over — avatar picker stays user-level. Optimistic preview +
  // background upload; submit doesn't gate on it.
  const onPickAvatar = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted && perm.status !== 'granted') {
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      const uri = asset.uri;
      setAvatarLocalUri(uri);
      setFormError((prev) => (prev?.kind === 'avatarFailed' ? null : prev));
      setAvatarUploading(true);

      const fallbackName = `avatar-${Date.now()}.jpg`;
      const name = asset.fileName ?? fallbackName;
      const type = asset.mimeType ?? 'image/jpeg';

      try {
        const updated = await apiClient.upload<AvatarUploadResponse>(
          '/api/profile/avatar',
          'avatar',
          { uri, name, type },
        );
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          setUser({ ...currentUser, avatarUrl: updated.avatar });
        }
        if (updated.avatar) setAvatarLocalUri(updated.avatar);
      } catch {
        setFormError({ kind: 'avatarFailed' });
      } finally {
        setAvatarUploading(false);
      }
    } catch {
      // ImagePicker launch failed — no-op.
    }
  }, [setUser]);

  return {
    nick,
    setNick,
    color,
    setColor,
    colorKeys: COLOR_KEYS,
    submitting,
    canSubmit,
    formError,
    avatarLocalUri,
    avatarUploading,
    onPickAvatar,
    onSubmit,
  };
}
