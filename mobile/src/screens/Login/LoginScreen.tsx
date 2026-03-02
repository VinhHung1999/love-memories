import React, { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  Vibration,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Path } from 'react-native-svg';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useLoginViewModel, CoupleMode } from './useLoginViewModel';

// ── Animated spring wrapper ──────────────────────────────────────────────────
// style prop kept: Animated.Value transform cannot be expressed as a className
function SpringPressable({
  onPress,
  disabled,
  children,
  className: cls,
}: {
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
    if (!disabled) { Vibration.vibrate(8); onPress(); }
  };

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
      <Animated.View className={cls} style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ── Pulsing heart logo ───────────────────────────────────────────────────────
function HeartLogo() {
  const colors = useAppColors(); // needed: Icon color prop
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <View className="w-16 h-16 items-center justify-center mb-[10px]">
      {/* style kept: Animated.Value transform */}
      <Animated.View
        className="absolute w-16 h-16 rounded-full border-2 border-primary/30 bg-primary/[7%]"
        style={{ transform: [{ scale: pulse }] }}
      />
      <View className="w-12 h-12 rounded-full bg-primary items-center justify-center shadow-lg">
        <Icon name="heart" size={22} color={colors.white} />
      </View>
    </View>
  );
}

// ── Official 4-colour Google G ───────────────────────────────────────────────
function GoogleGLogo({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </Svg>
  );
}

// ── Couple mode selector ─────────────────────────────────────────────────────
function CoupleModeSelector({ value, onChange }: { value: CoupleMode; onChange: (v: CoupleMode) => void }) {
  const colors = useAppColors(); // needed: Icon color prop

  return (
    <View className="flex-row gap-[10px] mb-[14px]">
      {(['create', 'join'] as const).map(opt => {
        const active = value === opt;
        return (
          <SpringPressable
            key={opt}
            className={`flex-1 flex-col items-center gap-[6px] py-3 rounded-[14px] border-[1.5px] ${
              active ? 'border-primary bg-primary/[8%]' : 'border-white/60 bg-white/70'
            }`}
            onPress={() => onChange(opt)}>
            <Icon
              name={opt === 'create' ? 'plus-circle-outline' : 'account-heart-outline'}
              size={20}
              color={active ? colors.primary : colors.textLight}
            />
            <Text className={`text-xs ${active ? 'text-primary font-semibold' : 'text-textLight font-medium'}`}>
              {opt === 'create' ? t.login.couple.createNew : t.login.couple.joinExisting}
            </Text>
          </SpringPressable>
        );
      })}
    </View>
  );
}

// ── Error box ────────────────────────────────────────────────────────────────
function ErrorBox({ message }: { message: string }) {
  const colors = useAppColors(); // needed: Icon color prop

  return (
    <View className="flex-row items-center gap-[7px] bg-errorBg rounded-xl px-[14px] py-[10px] mb-3">
      <Icon name="alert-circle-outline" size={14} color={colors.errorColor} />
      <Text className="flex-1 text-[13px] leading-[18px] text-error">{message}</Text>
    </View>
  );
}

// ── Decorative background blobs ───────────────────────────────────────────────
// top-[40%] replaces SCREEN_HEIGHT * 0.4 — parent is flex-1 (full screen), so 40% ≈ same result
function DecoBlobs() {
  return (
    <>
      <View className="absolute w-[300px] h-[300px] -top-[100px] -right-[70px] rounded-full bg-primary/[13%]" />
      <View className="absolute w-[240px] h-[240px] -bottom-[80px] -left-[70px] rounded-full bg-secondary/[11%]" />
      <View className="absolute w-[140px] h-[140px] top-[40%] -left-[50px] rounded-full bg-accent/10" />
    </>
  );
}

// ── Field label ──────────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="text-[13px] font-semibold text-textDark mb-[6px] tracking-[0.1px]">
      {children}
    </Text>
  );
}

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
