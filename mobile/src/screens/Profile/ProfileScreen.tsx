import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useProfileViewModel } from './useProfileViewModel';
import EditNameModal from './components/EditNameModal';
import EditCoupleModal from './components/EditCoupleModal';
import GoogleGLogo from '../../components/GoogleGLogo';
import CollapsibleHeader from '../../components/CollapsibleHeader';

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
  icon?: string;
  isLast?: boolean;
  onPress?: () => void;
}) {
  const colors = useAppColors();
  const inner = (
    <View className={`flex-row items-center justify-between py-[14px] ${isLast ? '' : 'border-b border-border/50'}`}>
      <Text className="text-sm text-textMid flex-1">{label}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-sm font-medium text-textDark">{value}</Text>
        {icon && <Icon name={icon} size={14} color={colors.textLight} />}
      </View>
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{inner}</Pressable>;
  return inner;
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, className: cls }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`bg-white rounded-3xl shadow-sm mx-4 mb-4 px-5 pt-2 pb-1 ${cls ?? ''}`}>
      {children}
    </View>
  );
}

function CardTitle({ children, action, onAction }: { children: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-center justify-between pt-3 pb-1">
      <Text className="text-xs font-bold text-textLight tracking-[0.8px] uppercase">{children}</Text>
      {action && (
        <Pressable onPress={onAction}>
          <Text className="text-xs font-semibold text-primary">{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Avatar component ──────────────────────────────────────────────────────────
function AvatarCircle({
  uri,
  initials,
  size = 88,
  onPress,
}: {
  uri?: string | null;
  initials: string;
  size?: number;
  onPress?: () => void;
}) {
  const colors = useAppColors();
  return (
    <Pressable onPress={onPress} className="relative">
      {uri ? (
        <Image
          source={{ uri }}
          className="rounded-full border-4 border-white"
          style={{ width: size, height: size }}
        />
      ) : (
        <View
          className="rounded-full bg-primary/[12%] border-4 border-white items-center justify-center"
          style={{ width: size, height: size }}>
          <Text className="font-bold text-primary" style={{ fontSize: size * 0.3 }}>{initials}</Text>
        </View>
      )}
      {/* Camera badge */}
      {onPress && (
        <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary items-center justify-center border-2 border-white">
          <Icon name="camera" size={13} color={colors.white} />
        </View>
      )}
    </Pressable>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const colors = useAppColors();
  const vm = useProfileViewModel();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  return (
    <View className="flex-1 bg-gray-50">

      {/* ── Collapsible Header ── */}
      <CollapsibleHeader
        title={vm.user?.name ?? t.profile.title}
        subtitle={t.profile.title.toUpperCase()}
        expandedHeight={170}
        collapsedHeight={56}
        scrollY={scrollY}
        renderExpandedContent={() => (
          <View className="items-center">
            <AvatarCircle
              uri={vm.user?.avatar}
              initials={vm.initials}
              size={72}
              onPress={vm.handleUploadAvatar}
            />
            <Text className="text-xs text-textMid mt-1">{vm.user?.email}</Text>
            {vm.couple?.name ? (
              <View className="mt-2 flex-row items-center gap-1.5 bg-primary/[10%] rounded-full px-3 py-1">
                <Icon name="heart" size={10} color={colors.primary} />
                <Text className="text-[10px] font-semibold text-primary">{vm.couple.name}</Text>
              </View>
            ) : null}
          </View>
        )}
        renderRight={() => (
          <Pressable
            onPress={vm.openEditName}
            className="w-9 h-9 rounded-xl items-center justify-center bg-white/20">
            <Icon name="pencil-outline" size={16} color={colors.textLight} />
          </Pressable>
        )}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        onScroll={scrollHandler}
        scrollEventThrottle={16}>
        <View className="mt-4">

          {/* ── Partner card ── */}
          {vm.partner && (
            <Card>
              <CardTitle>{t.profile.couple.partner}</CardTitle>
              <View className="flex-row items-center gap-3 py-3">
                <AvatarCircle uri={vm.partner.avatar} initials={vm.partner.name.charAt(0).toUpperCase()} size={44} />
                <View className="flex-1">
                  <Text className="font-semibold text-sm text-textDark">{vm.partner.name}</Text>
                  <Text className="text-xs text-textMid mt-0.5">{vm.partner.email}</Text>
                </View>
                <View className="w-2 h-2 rounded-full bg-green-400" />
              </View>
            </Card>
          )}

          {/* ── Couple settings card ── */}
          <Card>
            <CardTitle action={t.profile.edit} onAction={vm.openEditCouple}>
              {t.profile.couple.title}
            </CardTitle>
            <InfoRow
              label={t.profile.couple.name}
              value={vm.couple?.name ?? '—'}
              icon={vm.couple?.name ? undefined : 'plus'}
              onPress={vm.openEditCouple}
            />
            <InfoRow
              label={t.profile.couple.anniversary}
              value={vm.anniversaryDisplay ?? t.profile.couple.noAnniversary}
              icon="calendar-heart"
              isLast
              onPress={vm.openEditCouple}
            />
          </Card>

          {/* ── Invite code card ── */}
          <Card>
            <CardTitle>{t.profile.couple.inviteCode}</CardTitle>
            <View className="py-3">
              {vm.couple?.inviteCode ? (
                <>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-border/50">
                      <Text className="font-mono text-base tracking-[3px] text-textDark text-center">
                        {vm.couple.inviteCode}
                      </Text>
                    </View>
                    <Pressable
                      onPress={vm.copyInviteCode}
                      className={`w-11 h-11 rounded-xl items-center justify-center border ${
                        vm.codeCopied ? 'bg-green-50 border-green-200' : 'border-primary/30 bg-primary/[6%]'
                      }`}>
                      <Icon
                        name={vm.codeCopied ? 'check' : 'content-copy'}
                        size={17}
                        color={vm.codeCopied ? colors.success : colors.primary}
                      />
                    </Pressable>
                  </View>
                  <Text className="text-[11px] text-textLight mt-2">{t.profile.couple.shareHint}</Text>
                  <Pressable
                    onPress={vm.generateInvite}
                    disabled={vm.isInviteGenerating}
                    className="mt-3 flex-row items-center justify-center gap-1.5 py-2">
                    {vm.isInviteGenerating
                      ? <ActivityIndicator size="small" color={colors.textLight} />
                      : <>
                          <Icon name="refresh" size={13} color={colors.textLight} />
                          <Text className="text-xs text-textLight">{t.profile.couple.generateInvite}</Text>
                        </>}
                  </Pressable>
                </>
              ) : (
                <Pressable
                  onPress={vm.generateInvite}
                  disabled={vm.isInviteGenerating}
                  className="border border-primary/30 rounded-2xl py-3 flex-row items-center justify-center gap-2">
                  {vm.isInviteGenerating
                    ? <ActivityIndicator size="small" color={colors.primary} />
                    : <>
                        <Icon name="qrcode-plus" size={16} color={colors.primary} />
                        <Text className="text-sm font-medium text-primary">{t.profile.couple.generateInvite}</Text>
                      </>}
                </Pressable>
              )}
            </View>
          </Card>

          {/* ── Google account card ── */}
          <Card>
            <CardTitle>{t.profile.google.title}</CardTitle>
            {vm.user?.googleId ? (
              <View className="flex-row items-center gap-2 py-3">
                <Icon name="check-circle" size={16} color={colors.success} />
                <Text className="text-sm text-success font-medium">{t.profile.google.linked}</Text>
              </View>
            ) : (
              <View className="py-3">
                <Text className="text-xs text-textMid mb-3">{t.profile.google.linkHint}</Text>
                <Pressable
                  onPress={vm.handleLinkGoogle}
                  className="border border-border rounded-2xl py-2.5 flex-row items-center justify-center gap-2">
                  <GoogleGLogo size={18} />
                  <Text className="text-sm font-semibold text-textDark">{t.profile.google.linkButton}</Text>
                </Pressable>
              </View>
            )}
          </Card>

          {/* ── Log Out ── */}
          <Pressable onPress={vm.handleLogout} className="mt-2 mb-8 items-center py-4 mx-4">
            <Text className="text-red-400 text-sm font-semibold">{t.profile.logout}</Text>
          </Pressable>

        </View>
      </Animated.ScrollView>

      {/* ── Modals ── */}
      <EditNameModal
        visible={vm.editNameOpen}
        nameInput={vm.nameInput}
        isSaving={vm.isNameSaving}
        onChangeText={vm.setNameInput}
        onSave={vm.saveName}
        onClose={vm.closeEditName}
      />
      <EditCoupleModal
        visible={vm.editCoupleOpen}
        coupleNameInput={vm.coupleNameInput}
        anniversaryDate={vm.anniversaryDate}
        isSaving={vm.isCoupleSaving}
        onChangeName={vm.setCoupleNameInput}
        onChangeAnniversary={vm.setAnniversaryDate}
        onSave={vm.saveCouple}
        onClose={vm.closeEditCouple}
      />
    </View>
  );
}
