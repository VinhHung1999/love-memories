import React, { useEffect, useState } from 'react';
import { Clipboard, Pressable, Share, StatusBar, View } from 'react-native';
import { Body, Caption, Heading } from '../../components/Typography';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { OnboardingStackParamList } from '../../navigation/index';
import { CheckCircle, Copy, Heart, Send, Sparkles } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../../lib/auth';
import SpringPressable from '../../components/SpringPressable';
import AlertModal, { AlertConfig } from '../../components/AlertModal';
import t from '../../locales/en';
import { useAppColors } from '../../navigation/theme';


// ── Sparkle Particles ─────────────────────────────────────────────────────────

const SPARKLE_CONFIG = [
  { tx: -72, ty: -88, size: 7,  delay: 0   },
  { tx: 72,  ty: -88, size: 5,  delay: 60  },
  { tx: 100, ty: -10, size: 6,  delay: 30  },
  { tx: 80,  ty: 60,  size: 4,  delay: 100 },
  { tx: -80, ty: 60,  size: 7,  delay: 140 },
  { tx: -100,ty: -10, size: 5,  delay: 20  },
  { tx: 0,   ty: -110,size: 6,  delay: 80  },
  { tx: 44,  ty: 96,  size: 4,  delay: 160 },
  { tx: -44, ty: 96,  size: 5,  delay: 50  },
  { tx: 118, ty: 28,  size: 4,  delay: 110 },
  { tx: -118,ty: 28,  size: 6,  delay: 70  },
  { tx: -22, ty: -116,size: 5,  delay: 190 },
];

function SparkleParticle({ tx, ty, size, delay }: { tx: number; ty: number; size: number; delay: number }) {
  const colors = useAppColors();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    x.value = withDelay(delay, withTiming(tx, { duration: 700 }));
    y.value = withDelay(delay, withTiming(ty, { duration: 700 }));
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 500 }),
    ));
    scale.value = withDelay(delay, withSequence(
      withSpring(1.2, { damping: 6, stiffness: 160 }),
      withTiming(0, { duration: 300 }),
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: colors.primary,
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={style} />;
}

// ── Hero Heart ────────────────────────────────────────────────────────────────

function HeroHeart() {
  const colors = useAppColors();
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const heartScale = useSharedValue(0);

  useEffect(() => {
    heartScale.value = withDelay(100, withSpring(1, { damping: 8, stiffness: 80 }));
    glowScale.value = withDelay(300, withRepeat(
      withSequence(
        withTiming(1.35, { duration: 1200 }),
        withTiming(1, { duration: 1200 }),
      ),
      -1, true,
    ));
    glowOpacity.value = withDelay(300, withRepeat(
      withSequence(
        withTiming(0.15, { duration: 1200 }),
        withTiming(0.4, { duration: 1200 }),
      ),
      -1, true,
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>
      {/* Glow ring */}
      <Animated.View style={[glowStyle, {
        position: 'absolute',
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: colors.primary,
      }]} />
      {/* Heart */}
      <Animated.View style={heartStyle}>
        <Heart size={56} color={colors.primary} fill={colors.primary} strokeWidth={0} />
      </Animated.View>
    </View>
  );
}

// ── Completion Overlay ────────────────────────────────────────────────────────

function CompletionOverlay() {
  const colors = useAppColors();
  const textScale = useSharedValue(0.8);
  const heartScale = useSharedValue(1);

  useEffect(() => {
    textScale.value = withDelay(300, withSequence(
      withTiming(1.05, { duration: 400 }),
      withTiming(1, { duration: 200 }),
    ));
    heartScale.value = withDelay(500, withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600 }),
        withTiming(1, { duration: 600 }),
      ),
      -1, true,
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const textStyle = useAnimatedStyle(() => ({ transform: [{ scale: textScale.value }] }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(255,240,243,0.96)',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}>
      <Animated.View style={heartStyle} className="mb-4">
        <Heart size={64} color={colors.primary} fill={colors.primary} strokeWidth={0} />
      </Animated.View>
      <Animated.View style={textStyle} className="items-center">
        <Heading size="xl" className="text-textDark dark:text-darkTextDark text-center mb-2" style={{ fontSize: 26 }}>
          {t.onboarding.avatar.doneTitle}
        </Heading>
        <Body size="md" className="text-textMid dark:text-darkTextMid text-center">
          {t.onboarding.avatar.doneSubtitle}
        </Body>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(600).duration(400)} className="mt-6 flex-row items-center gap-2">
        <Sparkles size={16} color={colors.primary} strokeWidth={1.5} />
        <Caption className="text-primary">{t.onboarding.invite.completing}</Caption>
        <Sparkles size={16} color={colors.primary} strokeWidth={1.5} />
      </Animated.View>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function OnboardingInviteScreen() {
  const colors = useAppColors();
  const route = useRoute<RouteProp<OnboardingStackParamList, 'OnboardingInvite'>>();
  const { coupleId } = route.params;

  const { updateUser } = useAuth();
  // Invite code comes from the couple creation response — no separate API call needed
  const inviteCode = route.params.inviteCode ?? null;
  const [copied, setCopied] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [alert, setAlert] = useState<AlertConfig>({ visible: false, title: '' });

  const handleCopy = () => {
    if (!inviteCode) return;
    Clipboard.setString(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    const message = t.onboarding.invite.shareMessage.replace('{code}', inviteCode);
    await Share.share({ message });
  };

  const handleDone = () => {
    setShowCompletion(true);
    setTimeout(() => updateUser({ coupleId }), 1800);
  };

  return (
    <LinearGradient
      colors={[colors.primaryLighter, colors.baseBg, colors.white]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View className="flex-1 px-6 pt-16 pb-10">
        {/* ── Hero area (flex-1 fills remaining space, centers content) ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(500)} className="flex-1 items-center justify-center gap-5">

          {/* Sparkle burst origin + heart */}
          <View style={{ alignItems: 'center', justifyContent: 'center', height: 140 }}>
            {/* Particles radiate from this container center */}
            {SPARKLE_CONFIG.map((p, i) => (
              <SparkleParticle key={i} {...p} />
            ))}
            <HeroHeart />
          </View>

          {/* Headline */}
          <View className="items-center gap-2">
            <Heading
              size="xl"
              className="text-textDark dark:text-darkTextDark text-center"
              style={{ fontSize: 27, lineHeight: 36 }}>
              Your couple is ready! 💕
            </Heading>
            <Body size="md" className="text-textMid dark:text-darkTextMid text-center" style={{ lineHeight: 22 }}>
              {t.onboarding.invite.subtitle}
            </Body>
          </View>

          {/* Invite code card — tap to copy */}
          <Pressable
            onPress={handleCopy}
            disabled={!inviteCode}
            className="w-full"
            style={{ marginTop: 4 }}>
            <View
              className="w-full rounded-3xl overflow-hidden"
              style={{
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.16,
                shadowRadius: 18,
                elevation: 6,
              }}>
              <LinearGradient
                colors={[colors.primary, '#F09AAA', '#F4B8C4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                >
                  <View style={{ paddingHorizontal: 24, paddingVertical: 28, alignItems: 'center', gap: 12 }}>
                  <Caption style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: 2.5, textTransform: 'uppercase', fontSize: 10, fontWeight: '700' }}>
                  {t.onboarding.invite.codeLabel}
                </Caption>

                {inviteCode ? (
                  <Heading
                    size="xl"
                    style={{ color: '#fff', fontSize: 34, letterSpacing: 10, fontVariant: ['tabular-nums'] }}
                    numberOfLines={1}>
                    {inviteCode}
                  </Heading>
                ) : (
                  <Body size="lg" style={{ color: 'rgba(255,255,255,0.65)', letterSpacing: 5 }}>
                    {t.onboarding.invite.generatingCode}
                  </Body>
                )}

                {/* Copy feedback */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 99,
                  paddingHorizontal: 14, paddingVertical: 6,
                }}>
                  {copied
                    ? <CheckCircle size={13} color="rgba(255,255,255,0.95)" strokeWidth={2} />
                    : <Copy size={13} color="rgba(255,255,255,0.85)" strokeWidth={2} />}
                  <Caption style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' }}>
                    {copied ? t.onboarding.invite.copied : t.onboarding.invite.copyHint}
                  </Caption>
                </View>
                  </View>


              </LinearGradient>
            </View>
          </Pressable>

        </Animated.View>

        {/* ── Bottom buttons — VERTICAL STACK ── */}
        <Animated.View entering={FadeInDown.delay(400).duration(450)} className="gap-3">

          {/* Primary — Share Invite Link */}
          <SpringPressable
            onPress={handleShare}
            disabled={!inviteCode}
            className="w-full h-14 rounded-2xl flex-row items-center justify-center gap-2"
            style={{ backgroundColor: inviteCode ? colors.primary : colors.primaryShadow }}>
            <Send size={18} color="#fff" strokeWidth={1.8} />
            <Body size="lg" style={{ color: '#fff', fontWeight: '700', letterSpacing: 0.4 }}>
              {t.onboarding.invite.shareBtn}
            </Body>
          </SpringPressable>

          {/* Ghost — Done */}
          <Pressable onPress={handleDone} className="items-center py-3">
            <Body size="md" className="text-textMid dark:text-darkTextMid" style={{ fontWeight: '500' }}>
              {t.onboarding.invite.doneBtn}
            </Body>
          </Pressable>

        </Animated.View>

      </View>

      {showCompletion && <CompletionOverlay />}
      <AlertModal {...alert} onDismiss={() => setAlert(a => ({ ...a, visible: false }))} />
    </LinearGradient>
  );
}
