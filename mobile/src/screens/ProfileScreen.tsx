import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuth } from '../lib/auth';
import { coupleApi, profileApi } from '../lib/api';

export default function ProfileScreen() {
  const { user, logout, updateUser, linkGoogle } = useAuth();
  const queryClient = useQueryClient();

  // Edit name modal
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? '');

  // ---------------------------------------------------------------------------
  // Couple data
  // ---------------------------------------------------------------------------

  const { data: couple } = useQuery({
    queryKey: ['couple'],
    queryFn: coupleApi.get,
    enabled: !!user,
  });

  const partner = couple?.users.find(u => u.id !== user?.id);

  // ---------------------------------------------------------------------------
  // Update name
  // ---------------------------------------------------------------------------

  const nameMutation = useMutation({
    mutationFn: () => profileApi.updateName(nameInput.trim()),
    onSuccess: data => {
      updateUser({ name: data.name });
      setEditNameOpen(false);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  // ---------------------------------------------------------------------------
  // Generate invite
  // ---------------------------------------------------------------------------

  const inviteMutation = useMutation({
    mutationFn: coupleApi.generateInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple'] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  // ---------------------------------------------------------------------------
  // Link Google
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Avatar initials
  // ---------------------------------------------------------------------------

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const inputCls = 'border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 bg-white';
  const rowCls = 'flex-row items-center justify-between py-3 border-b border-gray-100';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="px-4 py-6">

          {/* ── User Card ───────────────────────────────────────────────── */}
          <View className="bg-white rounded-3xl p-5 shadow-sm mb-4">
            <View className="flex-row items-center gap-4">
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <View className="w-16 h-16 rounded-full bg-rose-100 items-center justify-center">
                  <Text className="text-xl font-bold text-primary">{initials}</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="font-bold text-base text-gray-900">{user?.name}</Text>
                <Text className="text-sm text-gray-400">{user?.email}</Text>
              </View>
              <Pressable
                onPress={() => { setNameInput(user?.name ?? ''); setEditNameOpen(true); }}
                className="border border-primary/30 rounded-xl px-3 py-1.5">
                <Text className="text-primary text-xs font-medium">Edit</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Google Account ───────────────────────────────────────────── */}
          <View className="bg-white rounded-3xl p-5 shadow-sm mb-4">
            <Text className="font-semibold text-sm text-gray-700 mb-3">Google Account</Text>
            {user?.googleId ? (
              <View className="flex-row items-center gap-2 bg-green-50 rounded-xl px-3 py-2.5">
                <Text className="text-green-600 text-sm">✓ Google account linked</Text>
              </View>
            ) : (
              <>
                <Text className="text-xs text-gray-400 mb-3">
                  Link your Google account for easier sign-in
                </Text>
                <Pressable
                  onPress={handleLinkGoogle}
                  className="border-2 border-gray-200 rounded-2xl py-2.5 flex-row items-center justify-center gap-2">
                  <Text className="text-base">G</Text>
                  <Text className="text-sm font-semibold text-gray-700">Link Google Account</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* ── Couple Info ──────────────────────────────────────────────── */}
          <View className="bg-white rounded-3xl p-5 shadow-sm mb-4">
            <Text className="font-semibold text-sm text-gray-700 mb-3">❤️ Couple</Text>

            <View className={rowCls}>
              <Text className="text-sm text-gray-500">Couple name</Text>
              <Text className="text-sm font-medium text-gray-900">{couple?.name ?? '—'}</Text>
            </View>

            {/* Partner */}
            {partner && (
              <View className={rowCls}>
                <Text className="text-sm text-gray-500">Partner</Text>
                <View className="flex-row items-center gap-2">
                  {partner.avatar ? (
                    <Image source={{ uri: partner.avatar }} className="w-6 h-6 rounded-full" />
                  ) : (
                    <View className="w-6 h-6 rounded-full bg-rose-100 items-center justify-center">
                      <Text className="text-xs font-bold text-primary">
                        {partner.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text className="text-sm font-medium text-gray-900">{partner.name}</Text>
                </View>
              </View>
            )}

            {/* Invite code */}
            <View className="pt-3">
              <Text className="text-sm text-gray-500 mb-2">Invite code</Text>
              {couple?.inviteCode ? (
                <View className="flex-row items-center gap-2">
                  <View className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                    <Text className="font-mono text-sm text-gray-700">{couple.inviteCode}</Text>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => inviteMutation.mutate()}
                  disabled={inviteMutation.isPending}
                  className="border border-primary/30 rounded-xl py-2 items-center">
                  {inviteMutation.isPending
                    ? <ActivityIndicator size="small" color="#E8788A" />
                    : <Text className="text-primary text-sm">Generate invite code</Text>}
                </Pressable>
              )}
              <Text className="text-xs text-gray-400 mt-1">
                Share this code with your partner
              </Text>
            </View>
          </View>

          {/* ── Log Out ──────────────────────────────────────────────────── */}
          <Pressable
            onPress={handleLogout}
            className="mt-2 items-center py-3">
            <Text className="text-red-400 text-sm font-medium">Log out</Text>
          </Pressable>

        </View>
      </ScrollView>

      {/* ── Edit Name Modal ──────────────────────────────────────────────── */}
      <Modal visible={editNameOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-5 pt-4 pb-2 flex-row items-center justify-between border-b border-gray-100">
            <Pressable onPress={() => setEditNameOpen(false)}>
              <Text className="text-gray-400">Cancel</Text>
            </Pressable>
            <Text className="font-semibold text-gray-900">Edit Name</Text>
            <Pressable
              onPress={() => { if (nameInput.trim()) nameMutation.mutate(); }}
              disabled={nameMutation.isPending || !nameInput.trim()}>
              {nameMutation.isPending
                ? <ActivityIndicator size="small" color="#E8788A" />
                : <Text className="text-primary font-semibold">Save</Text>}
            </Pressable>
          </View>
          <View className="p-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">Name</Text>
            <TextInput
              className={inputCls}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name"
              autoFocus
              autoCapitalize="words"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
