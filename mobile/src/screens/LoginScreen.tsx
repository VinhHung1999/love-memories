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
        <Icon name="heart" size={32} color={C.white} />
      </View>
    </View>
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
            <Text style={styles.appTagline}>Our little world 🌸</Text>
          </Animated.View>

          {/* ── Form directly on background ── */}
          <Animated.View style={[styles.formSection, formStyle]}>
            <Text style={styles.screenTitle}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </Text>

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

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social icons row — small circular buttons, no text */}
            <View style={styles.socialRow}>
              <SpringPressable style={styles.socialBtn} onPress={handleGoogleSignIn} disabled={loading}>
                <Icon name="google" size={22} color="#4285F4" />
              </SpringPressable>
            </View>
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
    paddingTop: 72,
    paddingBottom: 48,
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
    paddingBottom: 48,
  },
  logoWrapper: {
    width: 96, height: 96,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  logoHalo: {
    position: 'absolute',
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(232,120,138,0.30)',
    backgroundColor: 'rgba(232,120,138,0.07)',
  },
  logoBadge: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.50,
    shadowRadius: 18,
    elevation: 14,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  appTagline: {
    fontSize: 15,
    color: C.mid,
    letterSpacing: 0.2,
  },

  // ── Form section (no card) ──
  formSection: {
    width: '100%',
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: C.dark,
    marginBottom: 22,
    letterSpacing: 0.2,
  },
  screenSubtitle: {
    fontSize: 14,
    color: C.mid,
    marginBottom: 22,
  },

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(90,70,95,0.15)' },
  dividerText: { fontSize: 12, color: C.light, fontWeight: '500' },

  // ── Social icons row ──
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },

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
    height: 54,
    backgroundColor: C.inputBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 18,
    fontSize: 15,
    color: C.dark,
    marginBottom: 14,
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
    height: 54,
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
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
