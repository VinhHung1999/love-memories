import { useState } from 'react';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuth } from '../../lib/auth';
import { coupleApi, profileApi } from '../../lib/api';

export function useProfileViewModel() {
  const { user, logout, updateUser, linkGoogle } = useAuth();
  const queryClient = useQueryClient();

  const [editNameOpen, setEditNameOpen] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');

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
    onSuccess: data => {
      updateUser({ name: data.name });
      setEditNameOpen(false);
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

  const handleLinkGoogle = async () => {
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

  // ── Derived ────────────────────────────────────────────────────────────────

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    user,
    couple,
    partner,
    initials,
    editNameOpen,
    nameInput,
    isNameSaving: nameMutation.isPending,
    isInviteGenerating: inviteMutation.isPending,
    setNameInput,
    openEditName: () => { setNameInput(user?.name ?? ''); setEditNameOpen(true); },
    closeEditName: () => setEditNameOpen(false),
    saveName: () => { if (nameInput.trim()) nameMutation.mutate(); },
    generateInvite: () => inviteMutation.mutate(),
    handleLinkGoogle,
    handleLogout,
  };
}
