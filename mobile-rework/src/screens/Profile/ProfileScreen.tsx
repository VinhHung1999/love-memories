import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';

import { LinearGradient, SafeScreen } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { type HeroPerson, useProfileViewModel } from './useProfileViewModel';

// T338 (Sprint 61) — Profile hero card. Subsequent tasks in the sprint
// (T339 stats, T340 settings, T341 edit sheets, T345 sign out, T347 legal,
// T348 delete account) append sections below this hero card.

export function ProfileScreen() {
  const vm = useProfileViewModel();

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
          <HeroCard
            me={vm.me}
            partner={vm.partner}
            coupleName={vm.coupleName}
            anniversaryLabel={vm.anniversaryLabel}
            isSolo={vm.isSolo}
          />
        )}
      </ScrollView>
    </SafeScreen>
  );
}

type HeroProps = {
  me: HeroPerson;
  partner: HeroPerson | null;
  coupleName: string | null;
  anniversaryLabel: string | null;
  isSolo: boolean;
};

function HeroCard({ me, partner, coupleName, anniversaryLabel, isSolo }: HeroProps) {
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
              <HeroAvatars me={me} partner={partner} isSolo={isSolo} />

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
};

function HeroAvatars({ me, partner, isSolo }: AvatarsProps) {
  const c = useAppColors();
  // Container width shrinks when solo so the name column gets more room.
  const containerClass = isSolo ? 'relative w-[52px] h-14' : 'relative w-[82px] h-14';

  return (
    <View className={containerClass}>
      <HeroAvatar
        person={me}
        gradient={[c.heroA, c.heroB]}
        offsetClass="left-0 top-0"
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
};

function HeroAvatar({ person, gradient, offsetClass }: HeroAvatarProps) {
  return (
    <View
      className={`absolute w-[52px] h-[52px] rounded-full overflow-hidden border-[3px] border-white/70 ${offsetClass}`}
    >
      {person.avatarUrl ? (
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
      )}
    </View>
  );
}
