import React, { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import t from '../../locales/en';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SpringPressable from '../../components/SpringPressable';
import ErrorBox from '../../components/ErrorBox';
import FieldLabel from '../../components/FieldLabel';
import HeartLogo from './components/HeartLogo';
import GoogleGLogo from '../../components/GoogleGLogo';
import CoupleModeSelector from './components/CoupleModeSelector';
import DecoBlobs from './components/DecoBlobs';
import { useLoginViewModel } from './useLoginViewModel';

// ── Main screen ───────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const vm = useLoginViewModel();

  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(160, [
      Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 8 }),
      Animated.spring(formAnim, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 5 }),
    ]).start();
  }, [logoAnim, formAnim]);

  // style kept: Animated.Value opacity + transform — impossible to express as className
  const logoStyle = {
    opacity: logoAnim,
    transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
  };
  const formStyle = {
    opacity: formAnim,
    transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };

  const form = (
    <View className="min-h-full px-7 pt-14 pb-8">

      {/* ── Logo / hero ── */}
      <Animated.View className="items-center pb-5" style={logoStyle}>
        <HeartLogo />
        <Text className="text-2xl font-extrabold text-textDark tracking-[0.3px]">{t.app.name}</Text>
      </Animated.View>

      {/* ── Form ── */}
      <Animated.View className="w-full" style={formStyle}>
        <Text className="text-[22px] font-bold text-textDark mb-4 tracking-[0.2px]">
          {vm.mode === 'login' ? t.login.welcomeBack : t.login.createAccount}
        </Text>

        {/* Google button */}
        <SpringPressable
          className="flex-row items-center justify-center gap-[10px] h-[50px] rounded-2xl border-[1.5px] border-border bg-white shadow-sm mb-1"
          onPress={vm.handleGoogleSignIn}
          disabled={vm.loading}>
          <GoogleGLogo size={20} />
          <Text className="text-[15px] font-semibold text-textDark tracking-[0.1px]">
            {vm.mode === 'login' ? t.login.continueWithGoogle : t.login.signUpWithGoogle}
          </Text>
        </SpringPressable>

        {/* Divider */}
        <View className="flex-row items-center gap-3 mt-[14px] mb-[14px]">
          <View className="flex-1 h-[1px] bg-textMid/15" />
          <Text className="text-xs font-medium text-textLight">{t.login.or}</Text>
          <View className="flex-1 h-[1px] bg-textMid/15" />
        </View>

        {/* Register-only fields */}
        {vm.mode === 'register' && (
          <>
            <FieldLabel>{t.login.labels.name}</FieldLabel>
            <Input placeholder={t.login.placeholders.name} value={vm.name} onChangeText={vm.setName} autoCapitalize="words" />

            <FieldLabel>{t.login.labels.couple}</FieldLabel>
            <CoupleModeSelector value={vm.coupleMode} onChange={vm.setCoupleMode} />

            {vm.coupleMode === 'create' && (
              <Input placeholder={t.login.placeholders.coupleName} value={vm.coupleName} onChangeText={vm.setCoupleName} autoCapitalize="words" />
            )}
            {vm.coupleMode === 'join' && (
              <Input placeholder={t.login.placeholders.inviteCode} value={vm.inviteCode} onChangeText={vm.setInviteCode} autoCapitalize="none" />
            )}
          </>
        )}

        <FieldLabel>{t.login.labels.email}</FieldLabel>
        <Input placeholder={t.login.placeholders.email} value={vm.email} onChangeText={vm.setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />

        <FieldLabel>{t.login.labels.password}</FieldLabel>
        <Input placeholder={t.login.placeholders.password} value={vm.password} onChangeText={vm.setPassword} secureTextEntry autoComplete={vm.mode === 'login' ? 'password' : 'new-password'} />

        {vm.mode === 'register' && (
          <>
            <FieldLabel>{t.login.labels.confirmPassword}</FieldLabel>
            <Input placeholder={t.login.placeholders.confirmPassword} value={vm.confirmPassword} onChangeText={vm.setConfirmPassword} secureTextEntry autoComplete="new-password" />
          </>
        )}

        {!!vm.error && <ErrorBox message={vm.error} />}

        <Button
          label={vm.mode === 'login' ? t.login.signIn : t.login.createAccount}
          onPress={vm.handleSubmit}
          loading={vm.loading}
        />

        <Pressable onPress={vm.toggleMode}>
          <Text className="text-center text-sm font-medium text-primary">
            {vm.mode === 'login' ? t.login.noAccount : t.login.hasAccount}
          </Text>
        </Pressable>
      </Animated.View>

    </View>
  );

  const googleSetupForm = (
    <View className="min-h-full px-7 pt-14 pb-8">
      <Text className="text-[22px] font-bold text-textDark mb-2">
        Welcome, {vm.pendingGoogleProfile?.name}! 👋
      </Text>
      <Text className="text-sm text-textMid mb-6">{t.login.googleSetup.subtitle}</Text>

      <FieldLabel>{t.login.labels.couple}</FieldLabel>
      <CoupleModeSelector value={vm.googleCoupleMode} onChange={vm.setGoogleCoupleMode} />

      {vm.googleCoupleMode === 'create' && (
        <Input placeholder={t.login.placeholders.coupleName} value={vm.googleCoupleName} onChangeText={vm.setGoogleCoupleName} autoCapitalize="words" />
      )}
      {vm.googleCoupleMode === 'join' && (
        <Input placeholder={t.login.placeholders.inviteCode} value={vm.googleInviteCode} onChangeText={vm.setGoogleInviteCode} autoCapitalize="none" />
      )}

      {!!vm.error && <ErrorBox message={vm.error} />}

      <Button label={t.login.createAccount} onPress={vm.handleGoogleCoupleComplete} loading={vm.loading} />

      <Pressable onPress={vm.backFromGoogleSetup}>
        <Text className="text-center text-sm font-medium text-textMid">{t.login.back}</Text>
      </Pressable>
    </View>
  );

  return (
    <LinearGradient colors={['#FFF0F3', '#FFFFFF', '#FFF5EE']} start={{ x: 0.8, y: 0 }} end={{ x: 0.2, y: 1 }} className="flex-1">
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <DecoBlobs />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {vm.googleStep === 'couple-setup' ? googleSetupForm : form}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
