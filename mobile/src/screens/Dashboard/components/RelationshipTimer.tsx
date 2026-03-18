import React, { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { CalendarHeart, Heart } from 'lucide-react-native';
import { Body, Caption, Label } from '../../../components/Typography';
import AvatarCircle from '../../../components/AvatarCircle';
import { useAppColors } from '../../../navigation/theme';
import SpringPressable from '../../../components/SpringPressable';
import { useTranslation } from 'react-i18next';

// Pale rose ring color around avatars
const AVATAR_RING = '#F9D0D8';

// ECG path: symmetric waveform both sides, heart gap at center (x=38–42)
const ECG_PATH =
  'M 0,20 L 10,20 L 12,14 L 13,6 L 14,28 L 15,20 L 18,20 L 20,14 L 22,20 L 38,20 ' +
  'M 42,20 L 58,20 L 60,14 L 62,20 L 65,20 L 66,28 L 67,6 L 68,14 L 70,20 L 80,20';
const ECG_PATH_LENGTH = 180;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatedPath = Animated.createAnimatedComponent(Path) as any;

interface RelationshipTimerProps {
  duration?: { years: number; months: number; days: number; totalDays: number } | null;
  userAvatar?: string | null;
  userInitials?: string;
  partnerAvatar?: string | null;
  partnerInitials?: string;
  hasCouple?: boolean;
  momentsCount?: number;
  onInvitePartner?: () => void;
  onSetAnniversary?: () => void;
  onMomentsPress?: () => void;
}

// ── Avatar with animated shimmer ring ────────────────────────────────────────

function AvatarWithRing({
  uri,
  initials,
  animDelay = 0,
}: {
  uri?: string | null;
  initials: string;
  animDelay?: number;
}) {
  const ringOpacity = useSharedValue(1);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    const pulseConfig = { duration: 1200, easing: Easing.inOut(Easing.ease) };
    ringOpacity.value = withDelay(
      animDelay,
      withRepeat(
        withSequence(
          withTiming(0.55, pulseConfig),
          withTiming(1.0, pulseConfig),
        ),
        -1,
        false,
      ),
    );
    ringScale.value = withDelay(
      animDelay,
      withRepeat(
        withSequence(
          withTiming(1.06, pulseConfig),
          withTiming(1.0, pulseConfig),
        ),
        -1,
        false,
      ),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <Animated.View
      style={[
        ringStyle,
        { width: 60, height: 60, backgroundColor: AVATAR_RING, borderRadius: 30 },
      ]}
      className="items-center justify-center">
      <AvatarCircle uri={uri} initials={initials} size={56} />
    </Animated.View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function RelationshipTimer({
  duration,
  userAvatar,
  userInitials = '?',
  partnerAvatar,
  partnerInitials = '?',
  hasCouple = true,
  momentsCount = 0,
  onInvitePartner,
  onSetAnniversary,
  onMomentsPress,
}: RelationshipTimerProps) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const heartScale = useSharedValue(1);
  const ecgOffset = useSharedValue(0);

  // Heartbeat: lub-dub pause cycle
  useEffect(() => {
    const quick   = { duration: 150, easing: Easing.inOut(Easing.ease) };
    const release = { duration: 200, easing: Easing.inOut(Easing.ease) };
    const pause   = { duration: 600, easing: Easing.linear };

    heartScale.value = withRepeat(
      withSequence(
        withTiming(1.3, quick),
        withTiming(1.0, release),
        withTiming(1.2, quick),
        withTiming(1.0, release),
        withTiming(1.0, pause),
      ),
      -1,
      false,
    );

    ecgOffset.value = withRepeat(
      withSequence(
        withTiming(ECG_PATH_LENGTH, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0,               { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const ecgProps = useAnimatedProps(() => ({
    strokeDashoffset: ecgOffset.value,
  }));

  // ── No couple ────────────────────────────────────────────────────────────────

  if (!hasCouple) {
    return (
      <Animated.View entering={FadeIn.duration(600)}>
        <View className="bg-white dark:bg-darkBgCard rounded-3xl border border-borderSoft dark:border-darkBorder px-5 py-5">
          <View className="items-center gap-3">
            <Heart size={32} color={colors.primary} strokeWidth={1.5} />
            <View className="items-center gap-1">
              <Label className="text-textDark dark:text-darkTextDark font-semibold text-center">
                {t('dashboard.invitePartner.title')}
              </Label>
              <Caption className="text-textLight dark:text-darkTextLight text-center">
                {t('dashboard.invitePartner.subtitle')}
              </Caption>
            </View>
            <SpringPressable
              onPress={onInvitePartner ?? (() => {})}
              className="rounded-2xl bg-primary px-6 py-3 items-center">
              <Body size="sm" className="font-semibold" style={{ color: '#fff' }}>
                {t('dashboard.invitePartner.button')}
              </Body>
            </SpringPressable>
          </View>
        </View>
      </Animated.View>
    );
  }

  // ── No anniversary set ───────────────────────────────────────────────────────

  if (!duration) {
    return (
      <Animated.View entering={FadeIn.duration(600)}>
        <View className="bg-white dark:bg-darkBgCard rounded-3xl border border-borderSoft dark:border-darkBorder px-5 py-5">
          <View className="items-center gap-3">
            <CalendarHeart size={32} color={colors.primary} strokeWidth={1.5} />
            <View className="items-center gap-1">
              <Label className="text-textDark dark:text-darkTextDark font-semibold text-center">
                {t('dashboard.setAnniversary.title')}
              </Label>
              <Caption className="text-textLight dark:text-darkTextLight text-center">
                {t('dashboard.setAnniversary.subtitle')}
              </Caption>
            </View>
            <SpringPressable
              onPress={onSetAnniversary ?? (() => {})}
              className="rounded-2xl bg-primary px-6 py-3 items-center">
              <Body size="sm" className="font-semibold" style={{ color: '#fff' }}>
                {t('dashboard.setAnniversary.button')}
              </Body>
            </SpringPressable>
          </View>
        </View>
      </Animated.View>
    );
  }

  const daysLabel = duration.years >= 1
    ? `${duration.years} ${t('dashboard.couple.yearUnit')} · ${duration.totalDays} ${t('dashboard.couple.daysUnit')} ${t('dashboard.couple.together')}`
    : `${duration.totalDays} ${t('dashboard.couple.daysUnit')} ${t('dashboard.couple.together')}`;

  return (
    <Animated.View entering={FadeIn.duration(600)}>
      <View className="bg-white dark:bg-darkBgCard rounded-3xl border border-borderSoft dark:border-darkBorder px-5 py-4">

        {/* Avatar row */}
        <View className="flex-row items-center justify-center gap-2">
          <AvatarWithRing uri={userAvatar} initials={userInitials} animDelay={0} />

          {/* Connector: ECG heartbeat waveform */}
          <View className="items-center justify-center" style={{ height: 60, width: 80 }}>
            <Svg width={80} height={40} viewBox="0 0 80 40">
              <AnimatedPath
                d={ECG_PATH}
                stroke={colors.primary}
                strokeWidth={1.5}
                fill="none"
                strokeDasharray={ECG_PATH_LENGTH}
                animatedProps={ecgProps}
              />
            </Svg>
            <Animated.View
              style={[heartStyle, { position: 'absolute' }]}
              className="items-center justify-center">
              <Heart size={16} color={colors.primary} fill={colors.primary} strokeWidth={0} />
            </Animated.View>
          </View>

          <AvatarWithRing uri={partnerAvatar} initials={partnerInitials} animDelay={1200} />
        </View>

        {/* Days count */}
        <Body size="sm" className="text-center text-textMid dark:text-darkTextMid font-body mt-3">
          {daysLabel}
        </Body>

        {/* Moments pill */}
        {momentsCount > 0 ? (
          <Pressable
            onPress={onMomentsPress}
            className="self-center mt-2 flex-row items-center gap-1 px-3 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(232,120,138,0.10)' }}
          >
            <Heart size={10} color={colors.primary} fill={colors.primary} strokeWidth={0} />
            <Caption style={{ color: colors.primary, fontWeight: '700', fontSize: 11 }}>
              {momentsCount} {t('dashboard.stats.moments')}
            </Caption>
          </Pressable>
        ) : null}

      </View>
    </Animated.View>
  );
}
