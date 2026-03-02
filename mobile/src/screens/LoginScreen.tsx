import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Path } from 'react-native-svg';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuth } from '../lib/auth';
import { GoogleProfile } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------
const C = {
  primary: '#E8788A',
  primaryShadow: 'rgba(232,120,138,0.40)',
  primaryMuted: 'rgba(232,120,138,0.13)',
  secondary: '#F4A261',
  secondaryMuted: 'rgba(244,162,97,0.11)',
  accentMuted: 'rgba(126,200,181,0.10)',
  dark: '#1A1624',
  mid: '#5C4E60',
  light: '#A898AD',
  border: 'rgba(255,255,255,0.70)',
  inputBg: 'rgba(255,255,255,0.88)',
  inputFocusBg: 'rgba(255,255,255,0.98)',
  inputBorderFocus: 'rgba(232,120,138,0.60)',
  white: '#FFFFFF',
  errorBg: 'rgba(255,240,240,0.95)',
  error: '#D94F58',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Mode = 'login' | 'register';
type CoupleMode = 'create' | 'join' | null;
type GoogleStep = 'idle' | 'couple-setup';

// ---------------------------------------------------------------------------
// Animated spring button
// ---------------------------------------------------------------------------
function SpringPressable({
  onPress,
  disabled,
  style,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  style?: object | object[];
  children: React.ReactNode;
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
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Pulsing heart logo
// ---------------------------------------------------------------------------
function HeartLogo() {
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
    <View style={styles.logoWrapper}>
      <Animated.View style={[styles.logoHalo, { transform: [{ scale: pulse }] }]} />
      <View style={styles.logoBadge}>
        <Icon name="heart" size={22} color={C.white} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Official 4-colour Google G logo via SVG
// ---------------------------------------------------------------------------
function GoogleGLogo({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Blue — right arc */}
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      {/* Green — bottom arc */}
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      {/* Yellow — bottom-left arc */}
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      {/* Red — top arc */}
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Styled input (semi-frosted, works directly on gradient)
// ---------------------------------------------------------------------------
function StyledInput(props: React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      style={[styles.input, focused && styles.inputFocused]}
      placeholderTextColor={C.light}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ---------------------------------------------------------------------------
// Couple mode selector
// ---------------------------------------------------------------------------
function CoupleModeSelector({ value, onChange }: { value: CoupleMode; onChange: (v: CoupleMode) => void }) {
  return (
    <View style={styles.coupleSelectorRow}>
      {(['create', 'join'] as const).map(opt => (
        <SpringPressable
          key={opt}
          style={[styles.coupleModeBtn, value === opt && styles.coupleModeBtnActive]}
          onPress={() => onChange(opt)}>
          <Icon
            name={opt === 'create' ? 'plus-circle-outline' : 'account-heart-outline'}
            size={20}
            color={value === opt ? C.primary : C.light}
          />
          <Text style={[styles.coupleModeBtnText, value === opt && styles.coupleModeBtnTextActive]}>
            {opt === 'create' ? 'Create new' : 'Join existing'}
          </Text>
        </SpringPressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Error box
// ---------------------------------------------------------------------------
function ErrorBox({ message }: { message: string }) {
  return (
    <View style={styles.errorBox}>
      <Icon name="alert-circle-outline" size={14} color={C.error} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Decorative background blobs
// ---------------------------------------------------------------------------
function DecoBlobs() {
  return (
    <>
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />
      <View style={styles.blobMidLeft} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function LoginScreen() {
  const { login, register, loginWithGoogle, completeGoogleSignup } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [coupleMode, setCoupleMode] = useState<CoupleMode>(null);
  const [coupleName, setCoupleName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [googleStep, setGoogleStep] = useState<GoogleStep>('idle');
  const [pendingGoogleIdToken, setPendingGoogleIdToken] = useState('');
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState<GoogleProfile | null>(null);
  const [googleCoupleMode, setGoogleCoupleMode] = useState<CoupleMode>(null);
  const [googleCoupleName, setGoogleCoupleName] = useState('');
  const [googleInviteCode, setGoogleInviteCode] = useState('');

  // Entrance animations
  const logoAnim  = useRef(new Animated.Value(0)).current;
  const formAnim  = useRef(new Animated.Value(0)).current;

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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');
    if (mode === 'register') {
      if (!name.trim())                                     { setError('Please enter your name'); return; }
      if (!coupleMode)                                      { setError('Please select create or join a couple'); return; }
      if (coupleMode === 'create' && !coupleName.trim())    { setError('Please enter couple name'); return; }
      if (coupleMode === 'join'   && !inviteCode.trim())    { setError('Please enter invite code'); return; }
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim(), {
          inviteCode: coupleMode === 'join'   ? inviteCode.trim()  : undefined,
          coupleName: coupleMode === 'create' ? coupleName.trim()  : undefined,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) { setError('Google Sign-In failed: no ID token'); return; }
      setLoading(true);
      const result = await loginWithGoogle(idToken);
      if (result?.needsCouple) {
        setPendingGoogleIdToken(idToken);
        setPendingGoogleProfile(result.googleProfile);
        setGoogleCoupleName(`${result.googleProfile.name}'s couple`);
        setGoogleStep('couple-setup');
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (e?.code === statusCodes.IN_PROGRESS)        return;
      setError(err instanceof Error ? err.message : 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCoupleComplete = async () => {
    setError('');
    if (!googleCoupleMode)                                          { setError('Please select create or join'); return; }
    if (googleCoupleMode === 'create' && !googleCoupleName.trim())  { setError('Please enter couple name'); return; }
    if (googleCoupleMode === 'join'   && !googleInviteCode.trim())  { setError('Please enter invite code'); return; }
    setLoading(true);
    try {
      await completeGoogleSignup(pendingGoogleIdToken, {
        inviteCode: googleCoupleMode === 'join'   ? googleInviteCode.trim() : undefined,
        coupleName: googleCoupleMode === 'create' ? googleCoupleName.trim() : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google signup failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Google couple-setup (full-screen, no card) ────────────────────────────
  if (googleStep === 'couple-setup') {
    return (
      <LinearGradient colors={['#FFF0F3', '#FFFFFF', '#FFF5EE']} start={{ x: 0.8, y: 0 }} end={{ x: 0.2, y: 1 }} style={styles.screen}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <DecoBlobs />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.formSection}>
              <Text style={styles.screenTitle}>Welcome, {pendingGoogleProfile?.name}! 👋</Text>
              <Text style={styles.screenSubtitle}>One more step — set up your couple</Text>

              <Text style={styles.fieldLabel}>Couple</Text>
              <CoupleModeSelector value={googleCoupleMode} onChange={v => { setGoogleCoupleMode(v); setError(''); }} />

              {googleCoupleMode === 'create' && (
                <StyledInput placeholder="Couple name (e.g. Hung & Nhu)" value={googleCoupleName} onChangeText={setGoogleCoupleName} autoCapitalize="words" />
              )}
              {googleCoupleMode === 'join' && (
                <StyledInput placeholder="Invite code from your partner" value={googleInviteCode} onChangeText={setGoogleInviteCode} autoCapitalize="none" />
              )}

              {!!error && <ErrorBox message={error} />}

              <SpringPressable style={[styles.btnPrimary, loading && styles.btnDisabled]} onPress={handleGoogleCoupleComplete} disabled={loading}>
                {loading ? <ActivityIndicator color={C.white} /> : <Text style={styles.btnPrimaryText}>Create account</Text>}
              </SpringPressable>

              <Pressable onPress={() => { setGoogleStep('idle'); setError(''); }}>
                <Text style={styles.linkText}>← Back</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // ── Main full-screen login / register ─────────────────────────────────────
  return (
    <LinearGradient colors={['#FFF0F3', '#FFFFFF', '#FFF5EE']} start={{ x: 0.8, y: 0 }} end={{ x: 0.2, y: 1 }} style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <DecoBlobs />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Logo / hero ── */}
          <Animated.View style={[styles.heroSection, logoStyle]}>
            <HeartLogo />
            <Text style={styles.appName}>Love Scrum</Text>
          </Animated.View>

          {/* ── Form directly on background ── */}
          <Animated.View style={[styles.formSection, formStyle]}>
            <Text style={styles.screenTitle}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </Text>

            {/* Google full-width button — Spotify style, top of form */}
            <SpringPressable style={styles.btnGoogle} onPress={handleGoogleSignIn} disabled={loading}>
              <GoogleGLogo size={20} />
              <Text style={styles.btnGoogleText}>
                {mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
              </Text>
            </SpringPressable>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register-only fields */}
            {mode === 'register' && (
              <>
                <Text style={styles.fieldLabel}>Name</Text>
                <StyledInput placeholder="Your name" value={name} onChangeText={setName} autoCapitalize="words" />

                <Text style={styles.fieldLabel}>Couple</Text>
                <CoupleModeSelector value={coupleMode} onChange={v => { setCoupleMode(v); setError(''); }} />

                {coupleMode === 'create' && (
                  <StyledInput placeholder="Couple name (e.g. Hung & Nhu)" value={coupleName} onChangeText={setCoupleName} autoCapitalize="words" />
                )}
                {coupleMode === 'join' && (
                  <StyledInput placeholder="Invite code from your partner" value={inviteCode} onChangeText={setInviteCode} autoCapitalize="none" />
                )}
              </>
            )}

            {/* Email + Password */}
            <Text style={styles.fieldLabel}>Email</Text>
            <StyledInput placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />

            <Text style={styles.fieldLabel}>Password</Text>
            <StyledInput placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'login' ? 'password' : 'new-password'} />

            {!!error && <ErrorBox message={error} />}

            {/* Primary submit */}
            <SpringPressable style={[styles.btnPrimary, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
              {loading
                ? <ActivityIndicator color={C.white} />
                : <Text style={styles.btnPrimaryText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>}
            </SpringPressable>

            {/* Toggle mode */}
            <Pressable onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setCoupleMode(null); setError(''); }}>
              <Text style={styles.toggleText}>
                {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
              </Text>
            </Pressable>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: { flex: 1 },
  kav: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 32,
  },

  // ── Blobs ──
  blobTopRight: {
    position: 'absolute', top: -100, right: -70,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: C.primaryMuted,
  },
  blobBottomLeft: {
    position: 'absolute', bottom: -80, left: -70,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: C.secondaryMuted,
  },
  blobMidLeft: {
    position: 'absolute', top: SCREEN_HEIGHT * 0.4, left: -50,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: C.accentMuted,
  },

  // ── Hero ──
  heroSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  logoWrapper: {
    width: 64, height: 64,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  logoHalo: {
    position: 'absolute',
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(232,120,138,0.30)',
    backgroundColor: 'rgba(232,120,138,0.07)',
  },
  logoBadge: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: 0.3,
  },

  // ── Form section (no card) ──
  formSection: {
    width: '100%',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.dark,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  screenSubtitle: {
    fontSize: 14,
    color: C.mid,
    marginBottom: 22,
  },

  // ── Google full-width button (Spotify style) ──
  btnGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 50,
    backgroundColor: C.inputBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  btnGoogleText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.dark,
    letterSpacing: 0.1,
  },

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    marginBottom: 14,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(90,70,95,0.15)' },
  dividerText: { fontSize: 12, color: C.light, fontWeight: '500' },

  // ── Couple selector ──
  coupleSelectorRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  coupleModeBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.60)',
    backgroundColor: 'rgba(255,255,255,0.70)',
  },
  coupleModeBtnActive: {
    borderColor: C.primary,
    backgroundColor: 'rgba(232,120,138,0.08)',
  },
  coupleModeBtnText: { fontSize: 12, fontWeight: '500', color: C.light },
  coupleModeBtnTextActive: { color: C.primary, fontWeight: '600' },

  // ── Input ──
  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: C.dark,
    marginBottom: 6, letterSpacing: 0.1,
  },
  input: {
    height: 50,
    backgroundColor: C.inputBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 18,
    fontSize: 15,
    color: C.dark,
    marginBottom: 10,
  },
  inputFocused: {
    backgroundColor: C.inputFocusBg,
    borderColor: C.inputBorderFocus,
  },

  // ── Error ──
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: C.errorBg,
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: { fontSize: 13, color: C.error, flex: 1, lineHeight: 18 },

  // ── Primary button ──
  btnPrimary: {
    height: 50,
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  btnDisabled: { opacity: 0.65 },
  btnPrimaryText: {
    color: C.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.4,
  },

  // ── Links ──
  toggleText: { textAlign: 'center', fontSize: 14, color: C.primary, fontWeight: '500' },
  linkText: { textAlign: 'center', fontSize: 14, color: C.mid, fontWeight: '500' },
});
