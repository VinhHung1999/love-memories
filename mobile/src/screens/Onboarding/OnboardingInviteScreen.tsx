import React, { useEffect, useState } from 'react';
import { Clipboard, Pressable, Share, StatusBar, View } from 'react-native';
import { Body, Caption, Heading } from '../../components/Typography';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { OnboardingStackParamList } from '../../navigation/index';
import { Copy, Heart, Send, Sparkles } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../../lib/auth';
import { coupleApi } from '../../lib/api';
import SpringPressable from '../../components/SpringPressable';
import AlertModal, { AlertConfig } from '../../components/AlertModal';
import t from '../../locales/en';

// ── Progress Dots — identical to other onboarding screens ─────────────────────

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className="rounded-full"
          style={{
            width: i === step ? 20 : 8,
            height: 8,
            backgroundColor: i === step ? '#E8788A' : '#E8788A40',
          }}
        />
      ))}
    </View>
  );
}

// ── Completion Overlay ────────────────────────────────────────────────────────

function CompletionOverlay() {
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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}>
      <Animated.View style={heartStyle} className="mb-4">
        <Heart size={64} color="#E8788A" fill="#E8788A" strokeWidth={0} />
      </Animated.View>
      <Animated.View style={textStyle} className="items-center">
        <Heading size="xl" className="text-textDark text-center mb-2" style={{ fontSize: 26 }}>
          {t.onboarding.avatar.doneTitle}
        </Heading>
        <Body size="md" className="text-textMid text-center">
          {t.onboarding.avatar.doneSubtitle}
        </Body>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(600).duration(400)} className="mt-6 flex-row items-center gap-2">
        <Sparkles size={16} color="#E8788A" strokeWidth={1.5} />
        <Caption className="text-primary">{t.onboarding.invite.completing}</Caption>
        <Sparkles size={16} color="#E8788A" strokeWidth={1.5} />
      </Animated.View>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
// Layout mirrors OnboardingAvatarScreen exactly:
//   LinearGradient → View(flex-1 px-6 pt-16 pb-10) → dots → heading → flex-1 content → buttons

export default function OnboardingInviteScreen() {
  const route = useRoute<RouteProp<OnboardingStackParamList, 'OnboardingInvite'>>();
  const { coupleId } = route.params;

  const { updateUser } = useAuth();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [alert, setAlert] = useState<AlertConfig>({ visible: false, title: '' });

  useEffect(() => {
    coupleApi.generateInvite()
      .then(r => { setInviteCode(r.inviteCode); setLoading(false); })
      .catch(() => {
        setLoading(false);
        setAlert({ visible: true, title: t.common.error, message: t.onboarding.invite.errors.failedToGenerate, type: 'error' });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = () => {
    if (!inviteCode) return;
    Clipboard.setString(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      colors={['#FFF0F3', '#FFF8F6', '#FFFFFF']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Same outer container as OnboardingAvatarScreen */}
      <View className="flex-1 px-6 pt-16 pb-10">

        {/* ── Progress dots (no back button — final step) ── */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} className="flex-row items-center justify-center mb-8">
          <ProgressDots step={3} total={4} />
        </Animated.View>

        {/* ── Icon + heading ── */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} className="items-center mb-8">
          <View
            className="w-20 h-20 rounded-3xl items-center justify-center mb-4"
            style={{ backgroundColor: '#E8788A15' }}>
            <Heart size={36} color="#E8788A" fill="#E8788A20" strokeWidth={1.5} />
          </View>
          <Heading size="xl" className="text-textDark text-center" style={{ fontSize: 26, lineHeight: 34 }}>
            {t.onboarding.invite.title}
          </Heading>
          <Caption className="text-textMid text-center mt-2">
            {t.onboarding.invite.subtitle}
          </Caption>
        </Animated.View>

        {/* ── Invite code card — flex-1 mirrors avatar circle area ── */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} className="flex-1 justify-center">
          <View
            className="w-full rounded-3xl overflow-hidden"
            style={{
              shadowColor: '#E8788A',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 20,
              elevation: 8,
            }}>
            <LinearGradient
              colors={['#E8788A', '#F4A0B0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingHorizontal: 28, paddingVertical: 32, alignItems: 'center' }}>

              <Caption
                style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16, fontSize: 11, fontWeight: '600' }}>
                {t.onboarding.invite.codeLabel}
              </Caption>

              {loading ? (
                <Body size="lg" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: 4 }}>
                  {t.onboarding.invite.generatingCode}
                </Body>
              ) : (
                <Pressable onPress={handleCopy} style={{ alignItems: 'center', gap: 12 }}>
                  <Heading
                    size="xl"
                    style={{ color: '#fff', fontSize: 34, letterSpacing: 8, fontVariant: ['tabular-nums'] }}
                    numberOfLines={1}>
                    {inviteCode ?? '------'}
                  </Heading>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6,
                  }}>
                    <Copy size={12} color="rgba(255,255,255,0.9)" strokeWidth={2} />
                    <Caption style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '600', fontSize: 12 }}>
                      {copied ? t.onboarding.invite.copied : t.onboarding.invite.copyHint}
                    </Caption>
                  </View>
                </Pressable>
              )}

            </LinearGradient>
          </View>
        </Animated.View>

        {/* ── Share + Done — pinned bottom (no mt, mirrors avatar buttons) ── */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)} className="flex-row gap-4">
          <SpringPressable
            onPress={handleShare}
            disabled={!inviteCode}
            className="flex-1 h-14 rounded-2xl flex-row items-center justify-center gap-2"
            style={{ borderWidth: 1.5, borderColor: '#E8788A', backgroundColor: 'transparent' }}>
            <Send size={16} color="#E8788A" strokeWidth={1.8} />
            <Body size="md" style={{ color: '#E8788A', fontWeight: '600', letterSpacing: 0.3 }}>
              {t.onboarding.invite.shareBtn}
            </Body>
          </SpringPressable>

          <SpringPressable
            onPress={handleDone}
            className="flex-1 h-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: '#E8788A' }}>
            <Body size="lg" style={{ color: '#fff', fontWeight: '600', letterSpacing: 0.3 }}>
              {t.onboarding.invite.doneBtn}
            </Body>
          </SpringPressable>
        </Animated.View>

      </View>

      {showCompletion && <CompletionOverlay />}
      <AlertModal {...alert} onDismiss={() => setAlert(a => ({ ...a, visible: false }))} />
    </LinearGradient>
  );
}
