import React, { useState } from 'react';
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
import ErrorBox from '../../components/ErrorBox';
import { coupleApi, storeTokens } from '../../lib/api';
import t from '../../locales/en';

type CoupleMode = 'create' | 'join';

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
          backgroundColor: selected ? '#FFF0F3' : '#fff',
          borderRadius: 16,
          borderWidth: 2,
          borderColor: selected ? '#E8788A' : '#F0E6E3',
          padding: 16,
          alignItems: 'center',
          gap: 8,
          shadowColor: selected ? '#E8788A' : 'transparent',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: selected ? 0.15 : 0,
          shadowRadius: 8,
        }}>
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: selected ? '#E8788A15' : '#F5F5F5' }}>
          {icon}
        </View>
        <Label
          className="text-center font-semibold"
          style={{ color: selected ? '#E8788A' : '#1A1624', fontSize: 13 }}>
          {label}
        </Label>
        <Caption className="text-center text-textLight" style={{ lineHeight: 16 }}>
          {subtitle}
        </Caption>
      </Pressable>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function OnboardingCoupleScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();

  const [coupleMode, setCoupleMode] = useState<CoupleMode | null>(null);
  const [coupleName, setCoupleName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setError('');
    if (!coupleMode) { setError(t.onboarding.couple.errors.coupleModeRequired); return; }
    if (coupleMode === 'create' && !coupleName.trim()) { setError(t.onboarding.couple.errors.coupleNameRequired); return; }
    if (coupleMode === 'join' && !inviteCode.trim()) { setError(t.onboarding.couple.errors.inviteCodeRequired); return; }

    setLoading(true);
    try {
      if (coupleMode === 'create') {
        const result = await coupleApi.create(coupleName.trim());
        await storeTokens(result.accessToken || result.token, result.refreshToken);
        navigation.navigate('OnboardingAnniversary', { coupleId: result.user.coupleId! });
      } else {
        const result = await coupleApi.join(inviteCode.trim());
        await storeTokens(result.accessToken || result.token, result.refreshToken);
        navigation.navigate('OnboardingCelebration', { coupleId: result.user.coupleId!, partnerName: result.partnerName });
      }
    } catch (err) {
      const e = err as Error;
      setError(e.message || t.onboarding.couple.errors.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FFF0F3', '#FFF8F6', '#FFFFFF']}
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
            <Heading size="xl" className="text-textDark" style={{ fontSize: 28, lineHeight: 36 }}>
              {t.onboarding.couple.title}
            </Heading>
          </Animated.View>

          {/* Option cards */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)} className="flex-row gap-4 mb-6">
            <OptionCard
              selected={coupleMode === 'create'}
              onPress={() => { setCoupleMode('create'); setError(''); }}
              icon={<Heart size={22} color={coupleMode === 'create' ? '#E8788A' : '#A898AD'} strokeWidth={1.5} />}
              label={t.onboarding.couple.createLabel}
              subtitle={t.onboarding.couple.createSubtitle}
            />
            <OptionCard
              selected={coupleMode === 'join'}
              onPress={() => { setCoupleMode('join'); setError(''); }}
              icon={<Link size={22} color={coupleMode === 'join' ? '#E8788A' : '#A898AD'} strokeWidth={1.5} />}
              label={t.onboarding.couple.joinLabel}
              subtitle={t.onboarding.couple.joinSubtitle}
            />
          </Animated.View>

          {/* Conditional input */}
          {coupleMode === 'create' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Input
                value={coupleName}
                onChangeText={setCoupleName}
                placeholder={t.onboarding.couple.namePlaceholder}
                autoCapitalize="words"
              />
            </Animated.View>
          )}
          {coupleMode === 'join' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Input
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder={t.onboarding.couple.codePlaceholder}
                autoCapitalize="none"
              />
            </Animated.View>
          )}

          {!!error && <ErrorBox message={error} />}

          <View className="flex-1" />

          {/* Continue button */}
          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <SpringPressable
              onPress={handleContinue}
              disabled={loading}
              className="w-full h-14 rounded-2xl items-center justify-center"
              style={{ backgroundColor: loading ? '#E8788A80' : '#E8788A' }}>
              <Body size="lg" className="font-semibold" style={{ color: '#fff', letterSpacing: 0.3 }}>
                {t.onboarding.couple.continueBtn}  →
              </Body>
            </SpringPressable>
          </Animated.View>

        </View>
      </ScrollView>
    </LinearGradient>
  );
}
