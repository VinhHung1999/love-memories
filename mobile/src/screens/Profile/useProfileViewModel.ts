import { useState } from 'react';
import { Alert } from 'react-native';
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

export function useProfileViewModel() {
  const { user, logout, updateUser, linkGoogle } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const queryClient = useQueryClient();

  // ── Name edit state ────────────────────────────────────────────────────────
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');

  // ── Couple edit state ──────────────────────────────────────────────────────
  const [editCoupleOpen, setEditCoupleOpen] = useState(false);
  const [coupleNameInput, setCoupleNameInput] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState<Date | null>(null);

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
    onSuccess: data => {
      updateUser({ name: data.name });
      setEditNameOpen(false);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const coupleMutation = useMutation({
    mutationFn: () =>
      coupleApi.update({
        name: coupleNameInput.trim() || undefined,
        anniversaryDate: anniversaryDate ? anniversaryDate.toISOString() : null,
      }),
    onMutate: showLoading,
    onSettled: hideLoading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple'] });
      setEditCoupleOpen(false);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const inviteMutation = useMutation({
    mutationFn: coupleApi.generateInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple'] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
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
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to upload photo');
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
      if (!idToken) { Alert.alert('Error', 'No ID token from Google'); return; }
      await linkGoogle(idToken);
      Alert.alert('Success', 'Google account linked!');
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;
      Alert.alert('Error', err instanceof Error ? err.message : 'Google linking failed');
    } finally {
      hideLoading();
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await GoogleSignin.signOut().catch(() => {});
          await logout();
        },
      },
    ]);
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
    ? new Date(couple.anniversaryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return {
    user,
    couple,
    partner,
    initials,
    anniversaryDisplay,
    codeCopied,

    // name modal
    editNameOpen,
    nameInput,
    isNameSaving: nameMutation.isPending,
    setNameInput,
    openEditName: () => { setNameInput(user?.name ?? ''); setEditNameOpen(true); },
    closeEditName: () => setEditNameOpen(false),
    saveName: () => { if (nameInput.trim()) nameMutation.mutate(); },

    // couple modal
    editCoupleOpen,
    coupleNameInput,
    anniversaryDate,
    isCoupleSaving: coupleMutation.isPending,
    setCoupleNameInput,
    setAnniversaryDate,
    openEditCouple: () => {
      setCoupleNameInput(couple?.name ?? '');
      setAnniversaryDate(couple?.anniversaryDate ? new Date(couple.anniversaryDate) : null);
      setEditCoupleOpen(true);
    },
    closeEditCouple: () => setEditCoupleOpen(false),
    saveCouple: () => coupleMutation.mutate(),

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
