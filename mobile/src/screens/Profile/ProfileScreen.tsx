import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useProfileViewModel } from './useProfileViewModel';

export default function ProfileScreen() {
  const colors = useAppColors();
  const vm = useProfileViewModel();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="px-4 py-6">

          {/* ── User Card ── */}
          <View className="bg-white rounded-3xl p-5 shadow-sm mb-4">
            <View className="flex-row items-center gap-4">
              {vm.user?.avatar ? (
                <Image source={{ uri: vm.user.avatar }} className="w-16 h-16 rounded-full" />
              ) : (
                <View className="w-16 h-16 rounded-full bg-rose-100 items-center justify-center">
                  <Text className="text-xl font-bold text-primary">{vm.initials}</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="font-bold text-base text-gray-900">{vm.user?.name}</Text>
                <Text className="text-sm text-gray-400">{vm.user?.email}</Text>
              </View>
              <Pressable
                onPress={vm.openEditName}
                className="border border-primary/30 rounded-xl px-3 py-1.5">
                <Text className="text-primary text-xs font-medium">{t.profile.edit}</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Google Account ── */}
          <View className="bg-white rounded-3xl p-5 shadow-sm mb-4">
            <Text className="font-semibold text-sm text-gray-700 mb-3">{t.profile.google.title}</Text>
            {vm.user?.googleId ? (
              <View className="flex-row items-center gap-2 bg-green-50 rounded-xl px-3 py-2.5">
                <Text className="text-green-600 text-sm">{t.profile.google.linked}</Text>
              </View>
            ) : (
              <>
                <Text className="text-xs text-gray-400 mb-3">{t.profile.google.linkHint}</Text>
                <Pressable
                  onPress={vm.handleLinkGoogle}
                  className="border-2 border-gray-200 rounded-2xl py-2.5 flex-row items-center justify-center gap-2">
                  <Text className="text-base">G</Text>
                  <Text className="text-sm font-semibold text-gray-700">{t.profile.google.linkButton}</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* ── Couple Info ── */}
          <View className="bg-white rounded-3xl p-5 shadow-sm mb-4">
            <Text className="font-semibold text-sm text-gray-700 mb-3">{t.profile.couple.title}</Text>

            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <Text className="text-sm text-gray-500">{t.profile.couple.name}</Text>
              <Text className="text-sm font-medium text-gray-900">{vm.couple?.name ?? '—'}</Text>
            </View>

            {vm.partner && (
              <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                <Text className="text-sm text-gray-500">{t.profile.couple.partner}</Text>
                <View className="flex-row items-center gap-2">
                  {vm.partner.avatar ? (
                    <Image source={{ uri: vm.partner.avatar }} className="w-6 h-6 rounded-full" />
                  ) : (
                    <View className="w-6 h-6 rounded-full bg-rose-100 items-center justify-center">
                      <Text className="text-xs font-bold text-primary">
                        {vm.partner.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text className="text-sm font-medium text-gray-900">{vm.partner.name}</Text>
                </View>
              </View>
            )}

            {/* Invite code */}
            <View className="pt-3">
              <Text className="text-sm text-gray-500 mb-2">{t.profile.couple.inviteCode}</Text>
              {vm.couple?.inviteCode ? (
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Text className="font-mono text-sm text-gray-700">{vm.couple.inviteCode}</Text>
                </View>
              ) : (
                <Pressable
                  onPress={vm.generateInvite}
                  disabled={vm.isInviteGenerating}
                  className="border border-primary/30 rounded-xl py-2 items-center">
                  {vm.isInviteGenerating
                    ? <ActivityIndicator size="small" color={colors.primary} />
                    : <Text className="text-primary text-sm">{t.profile.couple.generateInvite}</Text>}
                </Pressable>
              )}
              <Text className="text-xs text-gray-400 mt-1">{t.profile.couple.shareHint}</Text>
            </View>
          </View>

          {/* ── Log Out ── */}
          <Pressable onPress={vm.handleLogout} className="mt-2 items-center py-3">
            <Text className="text-red-400 text-sm font-medium">{t.profile.logout}</Text>
          </Pressable>

        </View>
      </ScrollView>

      {/* ── Edit Name Modal ── */}
      <Modal visible={vm.editNameOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-5 pt-4 pb-2 flex-row items-center justify-between border-b border-gray-100">
            <Pressable onPress={vm.closeEditName}>
              <Text className="text-gray-400">{t.profile.cancel}</Text>
            </Pressable>
            <Text className="font-semibold text-gray-900">{t.profile.editName}</Text>
            <Pressable
              onPress={vm.saveName}
              disabled={vm.isNameSaving || !vm.nameInput.trim()}>
              {vm.isNameSaving
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text className="text-primary font-semibold">{t.profile.save}</Text>}
            </Pressable>
          </View>
          <View className="p-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">{t.profile.labels.name}</Text>
            <TextInput
              className="border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 bg-white"
              value={vm.nameInput}
              onChangeText={vm.setNameInput}
              placeholder={t.login.placeholders.name}
              autoFocus
              autoCapitalize="words"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
