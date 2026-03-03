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
import { coupleApi, profileApi } from '../../lib/api';
import type { AlertConfig } from '../../components/AlertModal';
import t from '../../locales/en';

export function useProfileViewModel() {
  const { user, logout, updateUser, linkGoogle } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const queryClient = useQueryClient();

  // ── Name edit state ────────────────────────────────────────────────────────
  const [nameInput, setNameInput] = useState(user?.name ?? '');

  // ── Couple edit state ──────────────────────────────────────────────────────
  const [coupleNameInput, setCoupleNameInput] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState<Date | null>(null);

  // ── Alert state ────────────────────────────────────────────────────────────
  const [alert, setAlert] = useState<AlertConfig>({ visible: false, title: '' });
  const showAlert = (config: Omit<AlertConfig, 'visible'>) =>
    setAlert({ ...config, visible: true });
  const dismissAlert = () => setAlert(prev => ({ ...prev, visible: false }));

  // ── Invite code copy feedback ──────────────────────────────────────────────
  const [codeCopied, setCodeCopied] = useState(false);

  // ── Couple data ────────────────────────────────────────────────────────────
  const { data: couple } = useQuery({
    queryKey: ['couple'],
    queryFn: coupleApi.get,
    enabled: !!user,
  });

  const partner = couple?.users.find(u => u.id !== user?.id);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const nameMutation = useMutation({
    mutationFn: () => profileApi.updateName(nameInput.trim()),
    onMutate: showLoading,
    onSettled: hideLoading,
  });

  const coupleMutation = useMutation({
    mutationFn: () =>
      coupleApi.update({
        name: coupleNameInput.trim() || undefined,
        anniversaryDate: anniversaryDate ? anniversaryDate.toISOString() : null,
      }),
    onMutate: showLoading,
    onSettled: hideLoading,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['couple'] }),
  });

  const inviteMutation = useMutation({
    mutationFn: coupleApi.generateInvite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['couple'] }),
    onError: (err: Error) =>
      showAlert({ type: 'error', title: t.common.error, message: err.message }),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleUploadAvatar = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 1, selectionLimit: 1 });
    if (result.didCancel || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.uri) return;
    showLoading();
    try {
      const updated = await profileApi.uploadAvatar(asset.uri, asset.type ?? 'image/jpeg');
      updateUser({ avatar: updated.avatar });
    } catch (err) {
      showAlert({
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
        showAlert({ type: 'error', title: t.common.error, message: t.profile.errors.noGoogleToken });
        return;
      }
      await linkGoogle(idToken);
      showAlert({ type: 'info', title: t.common.success, message: t.profile.google.linkedSuccess });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;
      showAlert({
        type: 'error',
        title: t.common.error,
        message: err instanceof Error ? err.message : t.profile.errors.googleLinkFailed,
      });
    } finally {
      hideLoading();
    }
  };

  const handleLogout = () => {
    showAlert({
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

  return {
    user,
    couple,
    partner,
    initials,
    anniversaryDisplay,
    codeCopied,

    // alert
    alert,
    dismissAlert,

    // name form
    nameInput,
    isNameSaving: nameMutation.isPending,
    setNameInput,
    prepareEditName: () => setNameInput(user?.name ?? ''),
    saveName: (onClose: () => void) => {
      if (!nameInput.trim()) return;
      nameMutation.mutate(undefined, {
        onSuccess: (data) => { updateUser({ name: data.name }); onClose(); },
        onError: (err: Error) =>
          showAlert({ type: 'error', title: t.common.error, message: err.message }),
      });
    },

    // couple form
    coupleNameInput,
    anniversaryDate,
    isCoupleSaving: coupleMutation.isPending,
    setCoupleNameInput,
    setAnniversaryDate,
    prepareEditCouple: () => {
      setCoupleNameInput(couple?.name ?? '');
      setAnniversaryDate(couple?.anniversaryDate ? new Date(couple.anniversaryDate) : null);
    },
    saveCouple: (onClose: () => void) => {
      coupleMutation.mutate(undefined, {
        onSuccess: () => onClose(),
        onError: (err: Error) =>
          showAlert({ type: 'error', title: t.common.error, message: err.message }),
      });
    },

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
