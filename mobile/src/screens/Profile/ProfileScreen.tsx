import React from 'react';
import {
  Linking,
  Pressable,
  View,
} from 'react-native';
import { Body, Caption } from '../../components/Typography';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { CalendarHeart, Check, CheckCircle, Copy, Heart, Pencil, Plus, QrCode, RefreshCw } from 'lucide-react-native';
import { useAppColors } from '../../navigation/theme';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useAuth } from '../../lib/auth';
import { useTranslation } from 'react-i18next';
import { useProfileViewModel } from './useProfileViewModel';
import EditNameSheet from './components/EditNameSheet';
import EditCoupleSheet from './components/EditCoupleSheet';
import DeleteAccountSheet from './components/DeleteAccountSheet';
import GoogleGLogo from '../../components/GoogleGLogo';
import ScreenHeader from '../../components/ScreenHeader';
import HeaderIcon from '../../components/HeaderIcon';
import { Card, CardTitle } from '../../components/Card';
import AvatarCircle from '../../components/AvatarCircle';
import Skeleton from '../../components/Skeleton';

// ── Reusable row inside a card ────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  icon,
  isLast,
  onPress,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  isLast?: boolean;
  onPress?: () => void;
}) {
  const colors = useAppColors();
  const inner = (
    <View className="flex-row items-center justify-between py-[14px]" style={{ borderBottomWidth: isLast ? 0 : 1, borderBottomColor: colors.border + '80' }}>
      <Body size="md" className="text-textMid dark:text-darkTextMid flex-1">{label}</Body>
      <View className="flex-row items-center gap-2">
        <Body size="md" className="font-medium text-textDark dark:text-darkTextDark">{value}</Body>
        {icon && React.createElement(icon, { size: 14, color: colors.textLight, strokeWidth: 1.5 })}
      </View>
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{inner}</Pressable>;
  return inner;
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { t } = useTranslation();
  const colors = useAppColors();
  const navigation = useAppNavigation();
  const { logout } = useAuth();
  const vm = useProfileViewModel();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const handleOpenEditName = () => {
    if (vm.user) navigation.showBottomSheet(EditNameSheet, { user: vm.user });
  };

  const handleOpenEditCouple = () => {
    navigation.showBottomSheet(EditCoupleSheet, { couple: vm.couple ?? null, slogan: vm.slogan });
  };

  const handleOpenDeleteAccount = () => {
    navigation.showBottomSheet(DeleteAccountSheet, {
      onDeleted: async () => {
        await logout();
      },
    });
  };

  return (
    <View className="flex-1 bg-baseBg dark:bg-darkBaseBg">

      <ScreenHeader
        scrollY={scrollY}
        title={vm.user?.name ?? t('profile.title')}
        subtitle={t('profile.title').toUpperCase()}
        right={<HeaderIcon icon={Pencil} onPress={handleOpenEditName} />}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        className="flex-1"
        contentContainerStyle={{paddingBottom: 20}}>

        {/* ── Avatar + couple info section ── */}
        <View className="items-center pt-2 pb-4">
          <AvatarCircle
            uri={vm.user?.avatar}
            initials={vm.initials}
            size={72}
            onPress={vm.handleUploadAvatar}
            showCameraBadge
          />
          <Body size="sm" className="text-textMid dark:text-darkTextMid mt-1">{vm.user?.email}</Body>
          {vm.couple?.name ? (
            <View className="mt-2 flex-row items-center gap-1.5 bg-primary/[10%] rounded-full px-3 py-1">
              <Heart size={10} color={colors.primary} strokeWidth={1.5} />
              <Caption className="font-semibold text-primary">{vm.couple.name}</Caption>
            </View>
          ) : null}
          {vm.anniversaryDisplay ? (
            <View className="mt-1.5 flex-row items-center gap-1">
              <CalendarHeart size={11} color={colors.textLight} strokeWidth={1.5} />
              <Caption className="text-textMid dark:text-darkTextMid">Since {vm.anniversaryDisplay}</Caption>
            </View>
          ) : null}
          {vm.slogan ? (
            <Caption className="text-textLight dark:text-darkTextLight italic mt-1.5 text-center" numberOfLines={1}>
              {vm.slogan}
            </Caption>
          ) : null}
        </View>

          {/* ── Partner card ── */}
          {vm.isCoupleLoading ? (
            <Card>
              <View className="flex-row items-center gap-3 py-3">
                <Skeleton className="w-11 h-11 rounded-full" />
                <View className="flex-1 gap-2">
                  <Skeleton className="w-28 h-3.5 rounded-md" />
                  <Skeleton className="w-40 h-3 rounded-md" />
                </View>
              </View>
            </Card>
          ) : vm.partner ? (
            <Card>
              <CardTitle>{t('profile.couple.partner')}</CardTitle>
              <View className="flex-row items-center gap-3 py-3">
                <AvatarCircle
                  uri={vm.partner.avatar}
                  initials={vm.partner.name.charAt(0).toUpperCase()}
                  size={44}
                />
                <View className="flex-1">
                  <Body size="md" className="font-semibold text-textDark dark:text-darkTextDark">{vm.partner.name}</Body>
                  <Body size="sm" className="text-textMid dark:text-darkTextMid mt-0.5">{vm.partner.email}</Body>
                </View>
                <View className="w-2 h-2 rounded-full bg-green-400" />
              </View>
            </Card>
          ) : null}

          {/* ── Couple settings card ── */}
          {vm.isCoupleLoading ? (
            <Card>
              <View className="gap-3 py-1">
                <Skeleton className="w-3/4 h-3.5 rounded-md" />
                <Skeleton className="w-full h-3 rounded-md" />
                <Skeleton className="w-full h-3 rounded-md" />
              </View>
            </Card>
          ) : (
            <Card>
              <CardTitle action={{ label: t('profile.edit'), onPress: handleOpenEditCouple }}>
                {t('profile.couple.title')}
              </CardTitle>
              <InfoRow
                label={t('profile.couple.name')}
                value={vm.couple?.name ?? '—'}
                icon={vm.couple?.name ? undefined : Plus}
                onPress={handleOpenEditCouple}
              />
              <InfoRow
                label={t('profile.couple.anniversary')}
                value={vm.anniversaryDisplay ?? t('profile.couple.noAnniversary')}
                icon={CalendarHeart}
                isLast
                onPress={handleOpenEditCouple}
              />
            </Card>
          )}

          {/* ── Invite code card ── */}
          <Card>
            <CardTitle>{t('profile.couple.inviteCode')}</CardTitle>
            <View className="py-3">
              {vm.couple?.inviteCode ? (
                <>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-border dark:border-darkBorder/50">
                      <Body size="md" className="font-mono tracking-[3px] text-textDark dark:text-darkTextDark text-center">
                        {vm.couple.inviteCode}
                      </Body>
                    </View>
                    <Pressable
                      onPress={vm.copyInviteCode}
                      className="w-11 h-11 rounded-xl items-center justify-center border"
                      style={{ backgroundColor: vm.codeCopied ? colors.successBg : colors.primary + '0F', borderColor: vm.codeCopied ? colors.success + '4D' : colors.primary + '4D' }}>
                      {vm.codeCopied
                        ? <Check size={17} color={colors.success} strokeWidth={1.5} />
                        : <Copy size={17} color={colors.primary} strokeWidth={1.5} />}
                    </Pressable>
                  </View>
                  <Caption className="text-textLight dark:text-darkTextLight mt-2">{t('profile.couple.shareHint')}</Caption>
                  <Pressable
                    onPress={vm.generateInvite}
                    disabled={vm.isInviteGenerating}
                    className="mt-3 flex-row items-center justify-center gap-1.5 py-2">
                    {vm.isInviteGenerating
                      ? <Skeleton className="w-24 h-3.5 rounded-full" />
                      : <>
                          <RefreshCw size={13} color={colors.textLight} strokeWidth={1.5} />
                          <Caption className="text-textLight dark:text-darkTextLight">{t('profile.couple.generateInvite')}</Caption>
                        </>}
                  </Pressable>
                </>
              ) : (
                <Pressable
                  onPress={vm.generateInvite}
                  disabled={vm.isInviteGenerating}
                  className="border border-primary/30 rounded-2xl py-3 flex-row items-center justify-center gap-2">
                  {vm.isInviteGenerating
                    ? <Skeleton className="w-32 h-4 rounded-full" />
                    : <>
                        <QrCode size={16} color={colors.primary} strokeWidth={1.5} />
                        <Body size="md" className="font-medium text-primary">{t('profile.couple.generateInvite')}</Body>
                      </>}
                </Pressable>
              )}
            </View>
          </Card>

          {/* ── Google account card ── */}
          <Card>
            <CardTitle>{t('profile.google.title')}</CardTitle>
            {vm.user?.googleId ? (
              <View className="flex-row items-center gap-2 py-3">
                <CheckCircle size={16} color={colors.success} strokeWidth={1.5} />
                <Body size="md" className="text-success font-medium">{t('profile.google.linked')}</Body>
              </View>
            ) : (
              <View className="py-3">
                <Body size="sm" className="text-textMid dark:text-darkTextMid mb-3">{t('profile.google.linkHint')}</Body>
                <Pressable
                  onPress={vm.handleLinkGoogle}
                  className="border border-border dark:border-darkBorder rounded-2xl py-2.5 flex-row items-center justify-center gap-2">
                  <GoogleGLogo size={18} />
                  <Body size="md" className="font-semibold text-textDark dark:text-darkTextDark">{t('profile.google.linkButton')}</Body>
                </Pressable>
              </View>
            )}
          </Card>

          {/* ── Legal ── */}
          <Card>
            <CardTitle>{t('legal.title')}</CardTitle>
            <Pressable
              onPress={() => Linking.openURL('https://love-scrum.hungphu.work/privacy-policy')}
              className="flex-row items-center py-3 border-b"
              style={{ borderColor: colors.border }}
            >
              <Body size="sm" className="flex-1" style={{ color: colors.textDark }}>{t('legal.privacyPolicy')}</Body>
              <Body size="sm" style={{ color: colors.textLight }}>›</Body>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL('https://love-scrum.hungphu.work/terms-of-service')}
              className="flex-row items-center py-3"
            >
              <Body size="sm" className="flex-1" style={{ color: colors.textDark }}>{t('legal.termsOfService')}</Body>
              <Body size="sm" style={{ color: colors.textLight }}>›</Body>
            </Pressable>
          </Card>

          {/* ── Log Out ── */}
          <Pressable onPress={vm.handleLogout} className="mt-2 items-center py-4 mx-4">
            <Body size="md" className="text-red-400 font-semibold">{t('profile.logout')}</Body>
          </Pressable>

          {/* ── Delete Account ── */}
          <Pressable onPress={handleOpenDeleteAccount} className="mb-10 items-center py-2 mx-4">
            <Body size="sm" className="text-textLight dark:text-darkTextLight">{t('profile.deleteAccount.title')}</Body>
          </Pressable>

      </Animated.ScrollView>

    </View>
  );
}
