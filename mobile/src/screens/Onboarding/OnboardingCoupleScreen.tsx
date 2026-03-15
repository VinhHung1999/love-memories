import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, View } from 'react-native';
import { Body, Caption, Heading, Label } from '../../components/Typography';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/index';
import { Heart, Link } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Input from '../../components/Input';
import SpringPressable from '../../components/SpringPressable';
import AlertModal, { AlertConfig } from '../../components/AlertModal';
import { coupleApi, storeTokens } from '../../lib/api';
import { clearPendingInviteCode, getPendingInviteCode } from '../../lib/pendingInvite';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../navigation/theme';

type CoupleMode = 'create' | 'join';

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

// ── Option Card ───────────────────────────────────────────────────────────────

function OptionCard({
  selected,
  onPress,
  icon,
  label,
  subtitle,
}: {
  selected: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  subtitle: string;
}) {
  const colors = useAppColors();
  const scale = useSharedValue(1);
  const handlePress = () => {
    scale.value = withSpring(0.95, { damping: 8, stiffness: 300 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    flex: 1,
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        style={{
          backgroundColor: selected ? colors.primaryLighter : '#fff',
          borderRadius: 16,
          borderWidth: 2,
          borderColor: selected ? colors.primary : '#F0E6E3',
          padding: 16,
          alignItems: 'center',
          gap: 8,
          shadowColor: selected ? colors.primary : 'transparent',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: selected ? 0.15 : 0,
          shadowRadius: 8,
        }}>
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: selected ? colors.primaryMuted : colors.gray100 }}>
          {icon}
        </View>
        <Label
          className="text-center font-semibold"
          style={{ color: selected ? colors.primary : colors.textDark, fontSize: 13 }}>
          {label}
        </Label>
        <Caption className="text-center text-textLight dark:text-darkTextLight" style={{ lineHeight: 16 }}>
          {subtitle}
        </Caption>
      </Pressable>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function OnboardingCoupleScreen() {
  const { t } = useTranslation();
  const colors = useAppColors();
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();

  const [coupleMode, setCoupleMode] = useState<CoupleMode | null>(null);
  const [coupleName, setCoupleName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<AlertConfig>({ visible: false, title: '' });

  // ── Auto-join via pending deep-link invite ─────────────────────────────────
  useEffect(() => {
    const code = getPendingInviteCode();
    if (!code) return;
    setLoading(true);
    (async () => {
      try {
        const result = await coupleApi.join(code);
        await storeTokens(result.accessToken || result.token, result.refreshToken);
        clearPendingInviteCode();
        navigation.navigate('OnboardingCelebration', {
          coupleId: result.user.coupleId!,
          partnerName: result.partnerName,
        });
      } catch {
        clearPendingInviteCode();
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showError = (message: string) => {
    setAlert({ visible: true, title: t('common.error'), message, type: 'error' });
  };

  const handleContinue = async () => {
    if (!coupleMode) { showError(t('onboarding.couple.errors.coupleModeRequired')); return; }
    if (coupleMode === 'create' && !coupleName.trim()) { showError(t('onboarding.couple.errors.coupleNameRequired')); return; }
    if (coupleMode === 'join' && !inviteCode.trim()) { showError(t('onboarding.couple.errors.inviteCodeRequired')); return; }

    if (coupleMode === 'create') {
      // Defer API call to final Avatar step — just carry coupleName through params
      navigation.navigate('OnboardingAnniversary', { coupleName: coupleName.trim() });
      return;
    }

    setLoading(true);
    try {
      // Validate invite first
      const validation = await coupleApi.validateInvite(inviteCode.trim());
      if (!validation.valid) {
        showError(validation.error);
        return;
      }
      // Show confirm dialog
      setAlert({
        visible: true,
        title: `Join ${validation.coupleName}?`,
        message: `You will be connected with ${validation.partnerName}.`,
        type: 'confirm',
        confirmLabel: t('onboarding.couple.joinConfirmBtn'),
        onConfirm: async () => {
          await doJoin();
        },
      });
    } catch (err) {
      const e = err as Error;
      showError(e.message || t('onboarding.couple.errors.failed'));
    } finally {
      setLoading(false);
    }
  };

  const doJoin = async () => {
    setLoading(true);
    try {
      const result = await coupleApi.join(inviteCode.trim());
      await storeTokens(result.accessToken || result.token, result.refreshToken);
      navigation.navigate('OnboardingCelebration', { coupleId: result.user.coupleId!, partnerName: result.partnerName });
    } catch (err) {
      const e = err as Error;
      showError(e.message || t('onboarding.couple.errors.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.primaryLighter, colors.baseBg, colors.white]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 pt-16 pb-10">

          {/* dots (no back button — first screen of OnboardingNavigator) */}
          <Animated.View entering={FadeInDown.delay(50).duration(300)} className="flex-row items-center justify-between mb-8">
            <View className="w-10" />
            <ProgressDots step={0} total={4} />
            <View className="w-10" />
          </Animated.View>

          {/* Heading */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} className="mb-8">
            <Heading size="xl" className="text-textDark dark:text-darkTextDark" style={{ fontSize: 28, lineHeight: 36 }}>
              {t('onboarding.couple.title')}
            </Heading>
          </Animated.View>

          {/* Option cards */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)} className="flex-row gap-4 mb-6">
            <OptionCard
              selected={coupleMode === 'create'}
              onPress={() => { setCoupleMode('create'); }}
              icon={<Heart size={22} color={coupleMode === 'create' ? colors.primary : '#A898AD'} strokeWidth={1.5} />}
              label={t('onboarding.couple.createLabel')}
              subtitle={t('onboarding.couple.createSubtitle')}
            />
            <OptionCard
              selected={coupleMode === 'join'}
              onPress={() => { setCoupleMode('join'); }}
              icon={<Link size={22} color={coupleMode === 'join' ? colors.primary : '#A898AD'} strokeWidth={1.5} />}
              label={t('onboarding.couple.joinLabel')}
              subtitle={t('onboarding.couple.joinSubtitle')}
            />
          </Animated.View>

          {/* Conditional input */}
          {coupleMode === 'create' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Input
                value={coupleName}
                onChangeText={setCoupleName}
                placeholder={t('onboarding.couple.namePlaceholder')}
                autoCapitalize="words"
              />
            </Animated.View>
          )}
          {coupleMode === 'join' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Input
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder={t('onboarding.couple.codePlaceholder')}
                autoCapitalize="none"
              />
            </Animated.View>
          )}

          <View className="flex-1" />

          {/* Continue button */}
          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <SpringPressable
              onPress={handleContinue}
              disabled={loading}
              className="w-full h-14 rounded-2xl items-center justify-center"
              style={{ backgroundColor: loading ? colors.primaryShadow : colors.primary }}>
              <Body size="lg" className="font-semibold" style={{ color: '#fff', letterSpacing: 0.3 }}>
                {t('onboarding.couple.continueBtn')}  →
              </Body>
            </SpringPressable>
          </Animated.View>

        </View>
      </ScrollView>

      <AlertModal
        {...alert}
        onDismiss={() => setAlert(a => ({ ...a, visible: false }))}
        onCancel={() => setAlert(a => ({ ...a, visible: false }))}
      />
    </LinearGradient>
  );
}
