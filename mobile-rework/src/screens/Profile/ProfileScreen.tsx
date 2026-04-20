import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';

import {
  ComingSoonSheet,
  type ComingSoonSheetHandle,
  EditProfileSheet,
  type EditProfileSheetHandle,
  InviteCodeSheet,
  type InviteCodeSheetHandle,
  LinearGradient,
  SafeScreen,
  SettingsCard,
  SettingsRow,
} from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { type HeroPerson, type ProfileStats, useProfileViewModel } from './useProfileViewModel';

// T338 (Sprint 61) — Profile hero card. T339 stats row, T340 settings list
// (9 rows incl. "Chỉnh sửa hồ sơ" per PO approach b). T341/T342 edit sheets,
// T343 notifications persistence, T345 sign-out nav reset, T347 legal rows,
// T348 delete-account flow append on top of this scaffold.

export function ProfileScreen() {
  const vm = useProfileViewModel();
  const { t } = useTranslation();
  const comingSoonRef = useRef<ComingSoonSheetHandle>(null);
  const inviteSheetRef = useRef<InviteCodeSheetHandle>(null);
  const editProfileRef = useRef<EditProfileSheetHandle>(null);

  // Approach (b) — dedicated "Chỉnh sửa hồ sơ" row is the primary affordance;
  // the hero self-avatar is the secondary affordance and shares this handler.
  const onEditProfile = useCallback(() => {
    editProfileRef.current?.open();
  }, []);

  const onInvitePress = useCallback(() => {
    if (!vm.inviteCode) {
      comingSoonRef.current?.open();
      return;
    }
    inviteSheetRef.current?.open(vm.inviteCode);
  }, [vm.inviteCode]);

  const onCoupleNamePress = useCallback(() => {
    comingSoonRef.current?.open();
  }, []);

  const onAnniversariesPress = useCallback(() => {
    comingSoonRef.current?.open();
  }, []);

  const onAppearancePress = useCallback(() => {
    comingSoonRef.current?.open();
  }, []);

  const onMemouraPlusPress = useCallback(() => {
    comingSoonRef.current?.open();
  }, []);

  const onReplayTourPress = useCallback(() => {
    comingSoonRef.current?.open();
  }, []);

  const onSignOutPress = useCallback(() => {
    Alert.alert(
      t('profile.settingsList.signOutAlert.title'),
      t('profile.settingsList.signOutAlert.body'),
      [
        { text: t('profile.settingsList.signOutAlert.cancel'), style: 'cancel' },
        {
          text: t('profile.settingsList.signOutAlert.confirm'),
          style: 'destructive',
          onPress: () => {
            void vm.signOut();
          },
        },
      ],
    );
  }, [t, vm]);

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-28"
        showsVerticalScrollIndicator={false}
      >
        {vm.stage === 'loading' ? (
          <View className="pt-16 items-center">
            <ActivityIndicator />
          </View>
        ) : (
          <>
            <HeroCard
              me={vm.me}
              partner={vm.partner}
              coupleName={vm.coupleName}
              anniversaryLabel={vm.anniversaryLabel}
              isSolo={vm.isSolo}
              onEditProfile={onEditProfile}
            />
            {/* Stats only make sense when paired. Solo users have no couple-
                scoped counts — hide the row and never hit the endpoint. */}
            {!vm.isSolo ? <StatsRow stats={vm.stats} /> : null}

            <View className="mx-5 mt-4">
              <SettingsCard>
                <SettingsRow
                  icon="✏️"
                  label={t('profile.settingsList.editProfile')}
                  detail={t('profile.settingsList.editProfileDetail')}
                  onPress={onEditProfile}
                />
                <SettingsRow
                  icon="🎂"
                  label={t('profile.settingsList.anniversaries')}
                  onPress={onAnniversariesPress}
                />
                <SettingsRow
                  icon="👥"
                  label={t('profile.settingsList.coupleName')}
                  detail={vm.coupleNameDetail ?? undefined}
                  onPress={onCoupleNamePress}
                />
                <SettingsRow
                  icon="🔗"
                  label={t('profile.settingsList.inviteCode')}
                  detail={vm.inviteCode ? vm.inviteCode.toUpperCase() : undefined}
                  onPress={onInvitePress}
                  disabled={!vm.inviteCode}
                />
                <NotificationsRow
                  enabled={vm.notificationsEnabled}
                  onToggle={vm.setNotificationsEnabled}
                />
                <SettingsRow
                  icon="🌙"
                  label={t('profile.settingsList.appearance')}
                  detail={t('profile.settingsList.detail.system')}
                  onPress={onAppearancePress}
                />
                <SettingsRow
                  icon="💎"
                  label={t('profile.settingsList.memouraPlus')}
                  detail={t('profile.settingsList.detail.free')}
                  onPress={onMemouraPlusPress}
                />
                <SettingsRow
                  icon="👋"
                  label={t('profile.settingsList.replayTour')}
                  onPress={onReplayTourPress}
                />
                <SettingsRow
                  icon="🚪"
                  label={t('profile.settingsList.signOut')}
                  destructive
                  onPress={onSignOutPress}
                />
              </SettingsCard>
            </View>
          </>
        )}
      </ScrollView>

      <ComingSoonSheet ref={comingSoonRef} />
      <InviteCodeSheet ref={inviteSheetRef} />
      <EditProfileSheet ref={editProfileRef} />
    </SafeScreen>
  );
}

type NotificationsRowProps = {
  enabled: boolean;
  onToggle: (next: boolean) => void;
};

// Dedicated row wrapper so the Switch stays thumb-sized (44×26) and renders
// in place of the chevron. Row.disabled={false} because the whole row is
// still tappable — tapping anywhere flips the switch for a better touch
// target than the 44pt Switch alone.
function NotificationsRow({ enabled, onToggle }: NotificationsRowProps) {
  const { t } = useTranslation();
  const c = useAppColors();
  return (
    <SettingsRow
      icon="🔔"
      label={t('profile.settingsList.notifications')}
      detail={
        enabled
          ? t('profile.settingsList.detail.on')
          : t('profile.settingsList.detail.off')
      }
      onPress={() => onToggle(!enabled)}
      trailing={
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: c.lineOnSurface, true: c.primary }}
          thumbColor={c.bg}
          ios_backgroundColor={c.lineOnSurface}
        />
      }
    />
  );
}

type HeroProps = {
  me: HeroPerson;
  partner: HeroPerson | null;
  coupleName: string | null;
  anniversaryLabel: string | null;
  isSolo: boolean;
  onEditProfile: () => void;
};

function HeroCard({
  me,
  partner,
  coupleName,
  anniversaryLabel,
  isSolo,
  onEditProfile,
}: HeroProps) {
  const { t } = useTranslation();
  const c = useAppColors();

  // Solo = subdued gradient (soft rose → bg); paired = prototype's hero
  // heroA→heroB→heroC 135deg wash (more-screens.jsx:16). Explicit 3-tuple so
  // expo-linear-gradient's readonly-tuple prop narrows correctly.
  const gradientColors: readonly [string, string, string] = isSolo
    ? [c.primarySoft, c.surface, c.bg]
    : [c.heroA, c.heroB, c.heroC];

  const displayName =
    coupleName ??
    (partner
      ? `${me.name || t('profile.hero.selfFallback')} & ${partner.name || t('profile.hero.partnerFallback')}`
      : me.name || t('profile.hero.selfFallback'));

  const headingTextClass = isSolo ? 'text-ink' : 'text-white';
  const eyebrowTextClass = isSolo ? 'text-ink-soft' : 'text-white/85';

  return (
    <View className="mx-5 mt-4">
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-3xl overflow-hidden shadow-elevated"
      >
        {/* LinearGradient ignores padding — content goes inside an inner View. */}
        <View className="relative px-5 pt-6 pb-5">
          {/* Prototype's radial highlight (more-screens.jsx:19-20) — RN has no
              radial gradient, so we approximate with a soft rounded wash pinned
              top-left. Clipped by the parent's overflow-hidden. */}
          {!isSolo ? (
            <View
              pointerEvents="none"
              className="absolute -top-6 -left-6 w-56 h-40 rounded-full bg-white/25"
            />
          ) : null}

          <View className="relative">
            <Text
              className={`font-displayItalic uppercase tracking-[2px] text-[11px] ${eyebrowTextClass}`}
            >
              {isSolo ? t('profile.hero.soloLabel') : t('profile.hero.usLabel')}
            </Text>

            <View className="mt-1.5 flex-row items-center gap-2.5">
              <HeroAvatars
                me={me}
                partner={partner}
                isSolo={isSolo}
                onEditProfile={onEditProfile}
              />

              <View className="flex-1 min-w-0">
                <Text
                  numberOfLines={1}
                  className={`font-displayMedium text-[28px] leading-[30px] ${headingTextClass}`}
                >
                  {displayName}
                </Text>

                {isSolo ? (
                  <Text className="mt-1 font-body text-ink-soft text-[13px] leading-[18px]">
                    {t('profile.hero.notPaired')}
                  </Text>
                ) : anniversaryLabel ? (
                  // Prototype calls for Dancing Script on this line specifically
                  // (more-screens.jsx:49). font-script is loaded in fonts.ts and
                  // Boss explicitly approved its use on Profile for this line.
                  <Text className="mt-0.5 font-script text-white/90 text-[18px] leading-[22px]">
                    {t('profile.hero.since', { date: anniversaryLabel })}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

type AvatarsProps = {
  me: HeroPerson;
  partner: HeroPerson | null;
  isSolo: boolean;
  onEditProfile: () => void;
};

function HeroAvatars({ me, partner, isSolo, onEditProfile }: AvatarsProps) {
  const c = useAppColors();
  // Container width shrinks when solo so the name column gets more room.
  const containerClass = isSolo ? 'relative w-[52px] h-14' : 'relative w-[82px] h-14';

  return (
    <View className={containerClass}>
      {/* Self avatar is the secondary affordance for edit-profile — primary
          is the dedicated "Chỉnh sửa hồ sơ" row below. Partner avatar is
          NOT tappable (editing someone else's photo is never the user's
          intent — T342 handles couple-name edits instead). */}
      <HeroAvatar
        person={me}
        gradient={[c.heroA, c.heroB]}
        offsetClass="left-0 top-0"
        onPress={onEditProfile}
      />
      {partner ? (
        <HeroAvatar
          person={partner}
          gradient={[c.secondary, c.primary]}
          offsetClass="left-[30px] top-1"
        />
      ) : null}
    </View>
  );
}

type HeroAvatarProps = {
  person: HeroPerson;
  gradient: [string, string];
  offsetClass: string;
  onPress?: () => void;
};

function StatsRow({ stats }: { stats: ProfileStats }) {
  const { t } = useTranslation();
  return (
    <View className="mx-5 mt-3 flex-row gap-2">
      <StatCard value={stats.moments} label={t('profile.stats.moments')} />
      <StatCard value={stats.letters} label={t('profile.stats.letters')} />
      <StatCard value={stats.questions} label={t('profile.stats.questions')} />
    </View>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-surface border border-line px-3 py-3 items-center">
      <Text className="font-displayMedium text-ink text-[22px] leading-[26px]">{value}</Text>
      <Text className="mt-0.5 font-body text-ink-mute text-[11px] uppercase tracking-[1px]">
        {label}
      </Text>
    </View>
  );
}

function HeroAvatar({ person, gradient, offsetClass, onPress }: HeroAvatarProps) {
  const content = person.avatarUrl ? (
    <Image
      source={{ uri: person.avatarUrl }}
      className="w-full h-full"
      resizeMode="cover"
    />
  ) : (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="w-full h-full"
    >
      <View className="flex-1 items-center justify-center">
        <Text className="font-displayBold text-white text-[22px]">
          {person.initial}
        </Text>
      </View>
    </LinearGradient>
  );

  if (!onPress) {
    return (
      <View
        className={`absolute w-[52px] h-[52px] rounded-full overflow-hidden border-[3px] border-white/70 ${offsetClass}`}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={6}
      className={`absolute w-[52px] h-[52px] rounded-full overflow-hidden border-[3px] border-white/70 active:opacity-85 ${offsetClass}`}
    >
      {content}
    </Pressable>
  );
}
