import React, { useState } from 'react';
import { Image, Pressable, StatusBar, View } from 'react-native';
import { Body, Caption, Heading } from '../../components/Typography';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { OnboardingStackParamList } from '../../navigation/index';
import { Camera, ChevronLeft, Heart, Sparkles } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
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
import { coupleApi, profileApi, storeTokens } from '../../lib/api';
import SpringPressable from '../../components/SpringPressable';
import AlertModal, { AlertConfig } from '../../components/AlertModal';
import t from '../../locales/en';
import { useAppColors } from '../../navigation/theme';

// ── Progress Dots ─────────────────────────────────────────────────────────────

function ProgressDots({ step, total }: { step: number; total: number }) {
  const colors = useAppColors();
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className="rounded-full"
          style={{
            width: i === step ? 20 : 8,
            height: 8,
            backgroundColor: i === step ? colors.primary : colors.primary + '40',
          }}
        />
      ))}
    </View>
  );
}

// ── Confetti Particle ─────────────────────────────────────────────────────────

const CONFETTI_PIECES = [
  { x: -90, y: -140, color: '#E8788A', size: 10 },
  { x: 90,  y: -140, color: '#F4A261', size: 8  },
  { x: -50, y: -160, color: '#7EC8B5', size: 7  },
  { x: 50,  y: -160, color: '#E8788A', size: 9  },
  { x: -130,y: -80,  color: '#F4A261', size: 6  },
  { x: 130, y: -80,  color: '#7EC8B5', size: 8  },
  { x: -140,y: -120, color: '#E8788A', size: 7  },
  { x: 140, y: -120, color: '#F4A261', size: 9  },
  { x: -60, y: -180, color: '#7EC8B5', size: 6  },
  { x: 60,  y: -180, color: '#E8788A', size: 8  },
  { x: -110,y: -50,  color: '#F4A261', size: 7  },
  { x: 110, y: -50,  color: '#7EC8B5', size: 6  },
  { x: 0,   y: -170, color: '#E8788A', size: 9  },
  { x: -80, y: -100, color: '#F4A261', size: 6  },
  { x: 80,  y: -100, color: '#7EC8B5', size: 7  },
  { x: -30, y: -190, color: '#E8788A', size: 5  },
];

function ConfettiParticle({ tx, ty, color, size, delay }: { tx: number; ty: number; color: string; size: number; delay: number }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    x.value = withDelay(delay, withTiming(tx, { duration: 800 }));
    y.value = withDelay(delay, withTiming(ty, { duration: 800 }));
    opacity.value = withDelay(delay + 400, withTiming(0, { duration: 600 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    opacity: opacity.value,
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
  }));

  return <Animated.View style={style} />;
}

// ── Completion Overlay ────────────────────────────────────────────────────────

function CompletionOverlay() {
  const colors = useAppColors();
  const textScale = useSharedValue(0.8);

  React.useEffect(() => {
    textScale.value = withDelay(300, withSequence(
      withTiming(1.05, { duration: 400 }),
      withTiming(1, { duration: 200 }),
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heartScale = useSharedValue(1);
  React.useEffect(() => {
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
      {/* Confetti burst */}
      <View style={{ position: 'absolute', top: '50%', left: '50%' }}>
        {CONFETTI_PIECES.map((p, i) => (
          <ConfettiParticle key={i} tx={p.x} ty={p.y} color={p.color} size={p.size} delay={i * 30} />
        ))}
      </View>

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
        <Caption className="text-primary">{t.onboarding.avatar.completing}</Caption>
        <Sparkles size={16} color={colors.primary} strokeWidth={1.5} />
      </Animated.View>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function OnboardingAvatarScreen() {
  const colors = useAppColors();
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const route = useRoute<RouteProp<OnboardingStackParamList, 'OnboardingAvatar'>>();

  const { updateUser } = useAuth();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarMime, setAvatarMime] = useState('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [alert, setAlert] = useState<AlertConfig>({ visible: false, title: '' });

  const handlePickPhoto = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.9, selectionLimit: 1 });
    if (result.didCancel || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (asset.uri) {
      setAvatarUri(asset.uri);
      setAvatarMime(asset.type ?? 'image/jpeg');
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const data = route.params;

      let finalCoupleId: string;
      let inviteCodeFromCreate: string | undefined;

      if (data.coupleName) {
        // Create flow — API call deferred here to prevent double-call on back navigation
        const result = await coupleApi.create(data.coupleName);
        await storeTokens(result.accessToken || result.token, result.refreshToken);
        finalCoupleId = result.user.coupleId!;
        inviteCodeFromCreate = result.inviteCode;;
      } else {
        // Join flow — couple already created, coupleId passed through params
        finalCoupleId = data.coupleId!;
      }

      // Anniversary + avatar in parallel
      await Promise.all([
        data.anniversaryDate
          ? coupleApi.update({ anniversaryDate: data.anniversaryDate })
          : Promise.resolve(),
        avatarUri
          ? profileApi.uploadAvatar(avatarUri, avatarMime)
          : Promise.resolve(),
      ]);

      if (data.coupleName) {
        // Create flow → navigate to Invite screen with real coupleId
        setLoading(false);
        navigation.navigate('OnboardingInvite', {
          coupleId: finalCoupleId,
          anniversaryDate: data.anniversaryDate,
          inviteCode: inviteCodeFromCreate,
        });
      } else {
        // Join flow → show completion animation, then enter app
        setShowCompletion(true);
        setTimeout(() => {
          updateUser({ coupleId: finalCoupleId });
        }, 1800);
      }
    } catch (err) {
      setLoading(false);
      setAlert({
        visible: true,
        title: t.common.error,
        message: err instanceof Error ? err.message : t.onboarding.avatar.errors.setupFailed,
        type: 'error',
      });
    }
  };

  return (
    <LinearGradient
      colors={[colors.primaryLighter, colors.baseBg, colors.white]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View className="flex-1 px-6 pt-16 pb-10">

        {/* Back + dots */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)} className="flex-row items-center justify-between mb-8">
          <Pressable
            onPress={() => navigation.goBack()}
            disabled={loading}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primaryMuted }}>
            <ChevronLeft size={20} color={colors.primary} strokeWidth={2} />
          </Pressable>
          <ProgressDots step={3} total={4} />
          <View className="w-10" />
        </Animated.View>

        {/* Heading */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} className="items-center mb-8">
          <Heading size="xl" className="text-textDark dark:text-darkTextDark text-center mb-2" style={{ fontSize: 26, lineHeight: 34 }}>
            {t.onboarding.avatar.title}
          </Heading>
          <Body size="md" className="text-textMid dark:text-darkTextMid text-center">{t.onboarding.avatar.subtitle}</Body>
          <Caption className="text-textLight dark:text-darkTextLight text-center mt-1">{t.onboarding.avatar.optional}</Caption>
        </Animated.View>

        {/* Avatar circle */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} className="items-center flex-1 justify-center">
          <Pressable onPress={handlePickPhoto} disabled={loading}>
            <View
              className="items-center justify-center rounded-full overflow-hidden"
              style={{
                width: 120,
                height: 120,
                backgroundColor: colors.primaryMuted,
                borderWidth: 2,
                borderColor: avatarUri ? colors.primary : '#F0E6E3',
                borderStyle: 'dashed',
              }}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 120, height: 120 }} />
              ) : (
                <Camera size={36} color={colors.primary} strokeWidth={1.5} />
              )}
            </View>
            {/* Camera badge overlay */}
            {avatarUri ? (
              <View
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center border-2 border-white"
                style={{ backgroundColor: colors.primary }}>
                <Camera size={14} color="#fff" strokeWidth={1.5} />
              </View>
            ) : null}
          </Pressable>

          <Pressable onPress={handlePickPhoto} disabled={loading} className="mt-4">
            <Body size="sm" className="text-primary font-semibold">
              {avatarUri ? t.onboarding.avatar.changePhoto : t.onboarding.avatar.addPhoto}
            </Body>
          </Pressable>
        </Animated.View>

        {/* Buttons */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)} className="gap-3">
          <SpringPressable
            onPress={handleFinish}
            disabled={loading}
            className="w-full h-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: loading ? colors.primaryShadow : colors.primary }}>
            <Body size="lg" className="font-semibold" style={{ color: '#fff', letterSpacing: 0.3 }}>
              {loading
              ? t.onboarding.avatar.completing
              : route.params?.coupleName
                ? t.onboarding.avatar.createCoupleBtn
                : t.onboarding.avatar.finishBtn}
            </Body>
          </SpringPressable>

          {!loading && (
            <Pressable onPress={handleFinish} className="items-center py-3">
              <Body size="sm" className="text-textLight dark:text-darkTextLight">{t.onboarding.avatar.skipBtn}</Body>
            </Pressable>
          )}
        </Animated.View>

      </View>

      {/* Completion overlay */}
      {showCompletion && <CompletionOverlay />}

      <AlertModal
        {...alert}
        onDismiss={() => setAlert(a => ({ ...a, visible: false }))}
      />
    </LinearGradient>
  );
}
