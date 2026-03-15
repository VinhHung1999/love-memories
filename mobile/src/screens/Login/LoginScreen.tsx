import React, { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  View,
} from 'react-native';
import { Body, Heading, Label } from '../../components/Typography';
import LinearGradient from 'react-native-linear-gradient';
import t from '../../locales/en';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SpringPressable from '../../components/SpringPressable';
import ErrorBox from '../../components/ErrorBox';
import FieldLabel from '../../components/FieldLabel';
import HeartLogo from './components/HeartLogo';
import GoogleGLogo from '../../components/GoogleGLogo';
import DecoBlobs from './components/DecoBlobs';
import { useLoginViewModel } from './useLoginViewModel';
import { useAppColors } from '../../navigation/theme';

// ── Main screen ───────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const colors = useAppColors();
  const vm = useLoginViewModel();

  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(160, [
      Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 8 }),
      Animated.spring(formAnim, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 5 }),
    ]).start();
  }, [logoAnim, formAnim]);

  const logoStyle = {
    opacity: logoAnim,
    transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
  };
  const formStyle = {
    opacity: formAnim,
    transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };

  return (
    <LinearGradient colors={[colors.primaryLighter, colors.white, '#FFF5EE']} start={{ x: 0.8, y: 0 }} end={{ x: 0.2, y: 1 }} style={{flex: 1}}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <DecoBlobs />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerClassName="flex-grow justify-center">
          <View className="px-7 py-8">

            {/* ── Logo / hero ── */}
            <Animated.View className="items-center pb-5" style={logoStyle}>
              <HeartLogo />
              <Heading size="lg" className="text-textDark dark:text-darkTextDark tracking-[0.3px]">{t.app.name}</Heading>
            </Animated.View>

            {/* ── Form ── */}
            <Animated.View className="w-full" style={formStyle}>
              <Heading size="lg" className="text-textDark dark:text-darkTextDark mb-4 tracking-[0.2px]">
                {vm.mode === 'login' ? t.login.welcomeBack : t.login.createAccount}
              </Heading>

              {/* Google button */}
              <SpringPressable
                className="flex-row items-center justify-center gap-[10px] h-[50px] rounded-2xl border-[1.5px] border-border dark:border-darkBorder bg-white dark:bg-darkBgCard mb-1"
                onPress={vm.handleGoogleSignIn}
                disabled={vm.loading}>
                <GoogleGLogo size={20} />
                <Body size="lg" className="font-semibold text-textDark dark:text-darkTextDark tracking-[0.1px]">
                  {vm.mode === 'login' ? t.login.continueWithGoogle : t.login.signUpWithGoogle}
                </Body>
              </SpringPressable>

              {/* Divider */}
              <View className="flex-row items-center gap-3 mt-[14px] mb-[14px]">
                <View className="flex-1 h-[1px] bg-textMid/15" />
                <Body size="sm" className="text-textLight dark:text-darkTextLight">{t.login.or}</Body>
                <View className="flex-1 h-[1px] bg-textMid/15" />
              </View>

              {/* Register-only: name */}
              {vm.mode === 'register' && (
                <>
                  <FieldLabel>{t.login.labels.name}</FieldLabel>
                  <Input placeholder={t.login.placeholders.name} value={vm.name} onChangeText={vm.setName} autoCapitalize="words" />
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
                disabled={vm.isRateLimited}
              />

              <Pressable onPress={vm.toggleMode}>
                <Label className="text-center text-primary">
                  {vm.mode === 'login' ? t.login.noAccount : t.login.hasAccount}
                </Label>
              </Pressable>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
