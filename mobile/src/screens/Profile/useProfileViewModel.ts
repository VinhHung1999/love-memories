import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { launchImageLibrary } from 'react-native-image-picker';
import Clipboard from '@react-native-clipboard/clipboard';
import { useAuth } from '../../lib/auth';
import { useLoading } from '../../contexts/LoadingContext';
import { useUploadProgress } from '../../contexts/UploadProgressContext';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { coupleApi, profileApi, settingsApi } from '../../lib/api';
import t from '../../locales/en';

export function useProfileViewModel() {
  const { user, logout, updateUser, linkGoogle } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const { startUpload, incrementUpload } = useUploadProgress();
  const navigation = useAppNavigation();
  const queryClient = useQueryClient();

  // ── Invite code copy feedback ──────────────────────────────────────────────
  const [codeCopied, setCodeCopied] = useState(false);

  // ── Couple data ────────────────────────────────────────────────────────────
  const { data: couple, isLoading: isCoupleLoading } = useQuery({
    queryKey: ['couple'],
    queryFn: coupleApi.get,
    enabled: !!user,
  });

  const { data: sloganSetting } = useQuery({
    queryKey: ['settings', 'app_slogan'],
    queryFn: () => settingsApi.get('app_slogan'),
    enabled: !!user,
  });

  const partner = couple?.users.find(u => u.id !== user?.id);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const inviteMutation = useMutation({
    mutationFn: coupleApi.generateInvite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['couple'] }),
    onError: (err: Error) =>
      navigation.showAlert({ type: 'error', title: t.common.error, message: err.message }),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleUploadAvatar = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 1, selectionLimit: 1 });
    if (result.didCancel || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.uri) return;
    startUpload(1);
    try {
      const updated = await profileApi.uploadAvatar(asset.uri, asset.type ?? 'image/jpeg');
      updateUser({ avatar: updated.avatar });
      incrementUpload();
    } catch (err) {
      incrementUpload(); // still complete the progress indicator
      navigation.showAlert({
        type: 'error',
        title: t.common.error,
        message: err instanceof Error ? err.message : t.profile.errors.avatarFailed,
      });
    } finally {
      hideLoading();
    }
  };

  const handleLinkGoogle = async () => {
    showLoading();
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        navigation.showAlert({ type: 'error', title: t.common.error, message: t.profile.errors.noGoogleToken });
        return;
      }
      await linkGoogle(idToken);
      navigation.showAlert({ type: 'info', title: t.common.success, message: t.profile.google.linkedSuccess });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;
      navigation.showAlert({
        type: 'error',
        title: t.common.error,
        message: err instanceof Error ? err.message : t.profile.errors.googleLinkFailed,
      });
    } finally {
      hideLoading();
    }
  };

  const handleLogout = () => {
    navigation.showAlert({
      type: 'destructive',
      title: t.profile.logout,
      message: t.profile.logoutMessage,
      confirmLabel: t.profile.logout,
      onConfirm: async () => {
        await GoogleSignin.signOut().catch(() => {});
        await logout();
      },
    });
  };

  const copyInviteCode = () => {
    if (!couple?.inviteCode) return;
    Clipboard.setString(couple.inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const anniversaryDisplay = couple?.anniversaryDate
    ? new Date(couple.anniversaryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const slogan = sloganSetting?.value ?? null;

  return {
    user,
    couple,
    isCoupleLoading,
    partner,
    initials,
    anniversaryDisplay,
    slogan,
    codeCopied,

    // invite
    isInviteGenerating: inviteMutation.isPending,
    generateInvite: () => inviteMutation.mutate(),
    copyInviteCode,

    // actions
    handleUploadAvatar,
    handleLinkGoogle,
    handleLogout,
  };
}
