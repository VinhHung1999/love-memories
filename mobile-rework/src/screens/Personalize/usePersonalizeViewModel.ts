import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ApiError, apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// Sprint 68 T465 → D1prime (Boss build 132 prototype sync) — Personalize is
// USER-LEVEL ONLY. Submit contract: PUT /api/profile { name, color } →
// setUser → router.push('/(auth)/pair-create'). Idempotent so back-swipe
// + edit-and-resubmit is safe.
//
// Prototype `pairing.jsx` L968-1100 introduced 6 named gradient styles
// (was 4); BE T471 enum extended to match in the same patch. Photo
// upload is no longer the hero affordance — the camera badge sits at
// the bottom-right of the big avatar tile and fires the picker as a
// "for later" optional, but the avatar preview itself always renders
// gradient + initial. The photo URL still persists to authStore /
// /api/profile/avatar so downstream screens can use it.

export type ColorKey =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'primaryDeep'
  | 'sunset'
  | 'mint';

export const COLOR_KEYS: readonly ColorKey[] = [
  'primary',
  'accent',
  'secondary',
  'primaryDeep',
  'sunset',
  'mint',
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
  // Avatar upload stays user-optional. Local URI rendered nowhere now —
  // prototype shows gradient+initial only — but we still cache it so
  // downstream screens (PairChoice composite, Dashboard) can show it.
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
    avatarUploading,
    onPickAvatar,
    onSubmit,
  };
}
