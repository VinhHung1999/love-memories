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
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { CalendarHeart, Heart } from 'lucide-react-native';
import { Body, Caption, Label } from '../../../components/Typography';
import AvatarCircle from '../../../components/AvatarCircle';
import { useAppColors } from '../../../navigation/theme';
import SpringPressable from '../../../components/SpringPressable';
import { useTranslation } from 'react-i18next';
import { useCountUp } from './useCountUp';

// ECG path — symmetric waveform, heart gap at center (x=38–42)
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

// ── Avatar with three-layer animated ring ─────────────────────────────────────

function AvatarWithRing({
  uri,
  initials,
  animDelay = 0,
}: {
  uri?: string | null;
  initials: string;
  animDelay?: number;
}) {
  const colors = useAppColors();
  const haloScale   = useSharedValue(1);
  const haloOpacity = useSharedValue(0.6);

  useEffect(() => {
    const cfg = { duration: 1400, easing: Easing.inOut(Easing.ease) };
    haloScale.value = withDelay(
      animDelay,
      withRepeat(
        withSequence(withTiming(1.10, cfg), withTiming(1.0, cfg)),
        -1,
        false,
      ),
    );
    haloOpacity.value = withDelay(
      animDelay,
      withRepeat(
        withSequence(withTiming(0.25, cfg), withTiming(0.6, cfg)),
        -1,
        false,
      ),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: haloScale.value }],
    opacity: haloOpacity.value,
  }));

  return (
    <View style={{ width: 80, height: 80, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer halo — animated pulse */}
      <Animated.View
        style={[
          haloStyle,
          {
            position: 'absolute',
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.primaryMuted,
          },
        ]}
      />
      {/* Middle rose ring */}
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 38,
          backgroundColor: '#F9D0D8',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* White separator */}
        <View
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AvatarCircle uri={uri} initials={initials} size={66} />
        </View>
      </View>
    </View>
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
  const ecgOffset  = useSharedValue(0);
  const displayDays = useCountUp(duration?.totalDays ?? 0, 800);

  // Lub-dub heartbeat
  useEffect(() => {
    const quick   = { duration: 140, easing: Easing.inOut(Easing.ease) };
    const release = { duration: 190, easing: Easing.inOut(Easing.ease) };
    const pause   = { duration: 700, easing: Easing.linear };

    heartScale.value = withRepeat(
      withSequence(
        withTiming(1.35, quick),
        withTiming(1.0,  release),
        withTiming(1.20, quick),
        withTiming(1.0,  release),
        withTiming(1.0,  pause),
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

  const { years, months, days, totalDays } = duration;

  // Build sub-label: "2y · 3m" or "3m · 14d" or just "14d"
  const subParts: string[] = [];
  if (years > 0)  subParts.push(`${years}${t('dashboard.couple.yearUnit')}`);
  if (months > 0) subParts.push(`${months}m`);
  if (subParts.length === 0 && days > 0) subParts.push(`${days}d`);
  const subLabel = subParts.join(' · ');

  return (
    <Animated.View entering={FadeIn.duration(600)}>
      {/* Shadow wrapper */}
      <View
        style={{
          borderRadius: 28,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 6,
        }}
      >
        <LinearGradient
          colors={['#FFFFFF', '#FFF8F4', '#FFE4EA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ borderRadius: 28 }}
        >
          <View
            style={{
              borderRadius: 28,
              borderWidth: 1,
              borderColor: 'rgba(232,120,138,0.20)',
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: 20,
            }}
          >
            {/* ── Avatar row ── */}
            <View className="flex-row items-center justify-center" style={{ gap: 0 }}>
              {/* User avatar */}
              <AvatarWithRing uri={userAvatar} initials={userInitials} animDelay={0} />

              {/* ECG connector */}
              <View
                className="items-center justify-center"
                style={{ width: 80, height: 80 }}
              >
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
                <Animated.View style={[heartStyle, { position: 'absolute' }]}>
                  <Heart size={18} color={colors.primary} fill={colors.primary} strokeWidth={0} />
                </Animated.View>
              </View>

              {/* Partner avatar — half-phase offset */}
              <AvatarWithRing uri={partnerAvatar} initials={partnerInitials} animDelay={1400} />
            </View>

            {/* ── Day counter ── */}
            <View className="items-center mt-4">
              <View className="flex-row items-baseline gap-1.5">
                <Label
                  style={{
                    fontSize: 44,
                    fontWeight: '800',
                    color: colors.textDark,
                    lineHeight: 48,
                    fontFamily: 'BeVietnamPro-Bold',
                  }}
                >
                  {displayDays}
                </Label>
                <Caption style={{ color: colors.textMid, fontSize: 16, fontWeight: '600' }}>
                  {t('dashboard.couple.daysUnit')}
                </Caption>
              </View>
              <Caption
                className="font-medium mt-0.5"
                style={{ color: colors.textMid, fontSize: 13 }}
              >
                {t('dashboard.couple.together')}
              </Caption>
              {subLabel ? (
                <Caption
                  className="mt-1"
                  style={{ color: colors.textLight, fontSize: 12 }}
                >
                  {subLabel}
                </Caption>
              ) : null}
            </View>

            {/* ── Moments pill — bottom-right ── */}
            {momentsCount > 0 ? (
              <Pressable
                onPress={onMomentsPress}
                style={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(232,120,138,0.10)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 20,
                  gap: 4,
                }}
              >
                <Heart size={10} color={colors.primary} fill={colors.primary} strokeWidth={0} />
                <Caption
                  style={{
                    color: colors.primary,
                    fontWeight: '700',
                    fontSize: 11,
                  }}
                >
                  {momentsCount} {t('dashboard.stats.moments')}
                </Caption>
              </Pressable>
            ) : null}

          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}
