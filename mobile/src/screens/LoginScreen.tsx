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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Colours (mirrors tailwind theme)
// ---------------------------------------------------------------------------
const C = {
  primary: '#E8788A',
  primaryLight: '#F4A8B4',
  primaryMuted: 'rgba(232,120,138,0.12)',
  secondary: '#F4A261',
  secondaryMuted: 'rgba(244,162,97,0.10)',
  accent: '#7EC8B5',
  accentMuted: 'rgba(126,200,181,0.10)',
  dark: '#1A1624',
  mid: '#6B5E6E',
  light: '#B0A4B4',
  border: '#EDE8EF',
  inputBg: '#F9F6FA',
  white: '#FFFFFF',
  errorBg: '#FFF0F0',
  error: '#E0505A',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Mode = 'login' | 'register';
type CoupleMode = 'create' | 'join' | null;
type GoogleStep = 'idle' | 'couple-setup';

// ---------------------------------------------------------------------------
// Animated spring button wrapper
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

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
    if (!disabled) Vibration.vibrate(8);
    if (!disabled) onPress();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}>
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
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <View style={styles.logoWrapper}>
      {/* Outer halo ring */}
      <Animated.View
        style={[styles.logoHalo, { transform: [{ scale: pulse }] }]}
      />
      {/* Inner badge */}
      <View style={styles.logoBadge}>
        <Icon name="heart" size={30} color={C.white} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Couple mode selector row
// ---------------------------------------------------------------------------
function CoupleModeSelector({
  value,
  onChange,
}: {
  value: CoupleMode;
  onChange: (v: CoupleMode) => void;
}) {
  return (
    <View style={styles.coupleSelectorRow}>
      <SpringPressable
        style={[
          styles.coupleModeBtn,
          value === 'create' && styles.coupleModeBtnActive,
        ]}
        onPress={() => onChange('create')}>
        <Icon
          name="plus-circle-outline"
          size={20}
          color={value === 'create' ? C.primary : C.light}
        />
        <Text
          style={[
            styles.coupleModeBtnText,
            value === 'create' && styles.coupleModeBtnTextActive,
          ]}>
          Create new
        </Text>
      </SpringPressable>

      <SpringPressable
        style={[
          styles.coupleModeBtn,
          value === 'join' && styles.coupleModeBtnActive,
        ]}
        onPress={() => onChange('join')}>
        <Icon
          name="account-heart-outline"
          size={20}
          color={value === 'join' ? C.primary : C.light}
        />
        <Text
          style={[
            styles.coupleModeBtnText,
            value === 'join' && styles.coupleModeBtnTextActive,
          ]}>
          Join existing
        </Text>
      </SpringPressable>
    </View>
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
  const [pendingGoogleProfile, setPendingGoogleProfile] =
    useState<GoogleProfile | null>(null);
  const [googleCoupleMode, setGoogleCoupleMode] = useState<CoupleMode>(null);
  const [googleCoupleName, setGoogleCoupleName] = useState('');
  const [googleInviteCode, setGoogleInviteCode] = useState('');

  // Entrance animation
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(headerAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 6,
      }),
      Animated.spring(cardAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 5,
      }),
    ]).start();
  }, [headerAnim, cardAnim]);

  const headerStyle = {
    opacity: headerAnim,
    transform: [
      {
        translateY: headerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-24, 0],
        }),
      },
    ],
  };

  const cardStyle = {
    opacity: cardAnim,
    transform: [
      {
        translateY: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [32, 0],
        }),
      },
    ],
  };

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSubmit = async () => {
    setError('');
    if (mode === 'register') {
      if (!name.trim()) { setError('Please enter your name'); return; }
      if (!coupleMode) { setError('Please select create or join a couple'); return; }
      if (coupleMode === 'create' && !coupleName.trim()) { setError('Please enter couple name'); return; }
      if (coupleMode === 'join' && !inviteCode.trim()) { setError('Please enter invite code'); return; }
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim(), {
          inviteCode: coupleMode === 'join' ? inviteCode.trim() : undefined,
          coupleName: coupleMode === 'create' ? coupleName.trim() : undefined,
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
      if (e?.code === statusCodes.IN_PROGRESS) return;
      setError(err instanceof Error ? err.message : 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCoupleComplete = async () => {
    setError('');
    if (!googleCoupleMode) { setError('Please select create or join a couple'); return; }
    if (googleCoupleMode === 'create' && !googleCoupleName.trim()) { setError('Please enter couple name'); return; }
    if (googleCoupleMode === 'join' && !googleInviteCode.trim()) { setError('Please enter invite code'); return; }
    setLoading(true);
    try {
      await completeGoogleSignup(pendingGoogleIdToken, {
        inviteCode: googleCoupleMode === 'join' ? googleInviteCode.trim() : undefined,
        coupleName: googleCoupleMode === 'create' ? googleCoupleName.trim() : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google signup failed');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Google couple-setup screen
  // ---------------------------------------------------------------------------
  if (googleStep === 'couple-setup') {
    return (
      <LinearGradient
        colors={['#FFF0F3', '#FFFFFF', '#FFF5EE']}
        start={{ x: 0.8, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={styles.screen}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <DecoBlobs />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              {pendingGoogleProfile?.picture ? null : null}
              <Text style={styles.cardTitle}>
                Welcome, {pendingGoogleProfile?.name}! 👋
              </Text>
              <Text style={styles.cardSubtitle}>One more step — set up your couple</Text>

              <Text style={styles.fieldLabel}>Couple</Text>
              <CoupleModeSelector value={googleCoupleMode} onChange={v => { setGoogleCoupleMode(v); setError(''); }} />

              {googleCoupleMode === 'create' && (
                <StyledInput
                  placeholder="Couple name (e.g. Hung & Nhu)"
                  value={googleCoupleName}
                  onChangeText={setGoogleCoupleName}
                  autoCapitalize="words"
                />
              )}
              {googleCoupleMode === 'join' && (
                <StyledInput
                  placeholder="Invite code from your partner"
                  value={googleInviteCode}
                  onChangeText={setGoogleInviteCode}
                  autoCapitalize="none"
                />
              )}

              {!!error && <ErrorBox message={error} />}

              <SpringPressable
                style={[styles.btnPrimary, loading && styles.btnDisabled]}
                onPress={handleGoogleCoupleComplete}
                disabled={loading}>
                {loading
                  ? <ActivityIndicator color={C.white} />
                  : <Text style={styles.btnPrimaryText}>Create account</Text>}
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

  // ---------------------------------------------------------------------------
  // Main login / register screen
  // ---------------------------------------------------------------------------
  return (
    <LinearGradient
      colors={['#FFF0F3', '#FFFFFF', '#FFF5EE']}
      start={{ x: 0.8, y: 0 }}
      end={{ x: 0.2, y: 1 }}
      style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <DecoBlobs />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <Animated.View style={[styles.header, headerStyle]}>
            <HeartLogo />
            <Text style={styles.appName}>Love Scrum</Text>
            <Text style={styles.appTagline}>Our little world 🌸</Text>
          </Animated.View>

          {/* ── Card ── */}
          <Animated.View style={[styles.card, cardStyle]}>
            <Text style={styles.cardTitle}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </Text>

            {/* Google button */}
            <SpringPressable
              style={styles.btnGoogle}
              onPress={handleGoogleSignIn}
              disabled={loading}>
              <Icon name="google" size={20} color="#4285F4" />
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
                <StyledInput
                  placeholder="Your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />

                <Text style={styles.fieldLabel}>Couple</Text>
                <CoupleModeSelector
                  value={coupleMode}
                  onChange={v => { setCoupleMode(v); setError(''); }}
                />

                {coupleMode === 'create' && (
                  <StyledInput
                    placeholder="Couple name (e.g. Hung & Nhu)"
                    value={coupleName}
                    onChangeText={setCoupleName}
                    autoCapitalize="words"
                  />
                )}
                {coupleMode === 'join' && (
                  <StyledInput
                    placeholder="Invite code from your partner"
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="none"
                  />
                )}
              </>
            )}

            <Text style={styles.fieldLabel}>Email</Text>
            <StyledInput
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text style={styles.fieldLabel}>Password</Text>
            <StyledInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'login' ? 'password' : 'new-password'}
            />

            {!!error && <ErrorBox message={error} />}

            {/* Submit button */}
            <SpringPressable
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color={C.white} />
                : <Text style={styles.btnPrimaryText}>
                    {mode === 'login' ? 'Sign in' : 'Create account'}
                  </Text>}
            </SpringPressable>

            {/* Toggle mode */}
            <Pressable
              onPress={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setCoupleMode(null);
                setError('');
              }}>
              <Text style={styles.toggleText}>
                {mode === 'login'
                  ? "Don't have an account? Register"
                  : 'Already have an account? Sign in'}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// Small shared components
// ---------------------------------------------------------------------------

function StyledInput(props: React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      style={[
        styles.input,
        focused && styles.inputFocused,
      ]}
      placeholderTextColor={C.light}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <View style={styles.errorBox}>
      <Icon name="alert-circle-outline" size={14} color={C.error} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

function DecoBlobs() {
  return (
    <>
      {/* Top-right pink blob */}
      <View style={styles.blobTopRight} />
      {/* Bottom-left peach blob */}
      <View style={styles.blobBottomLeft} />
      {/* Top-left teal accent */}
      <View style={styles.blobTopLeft} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
  },

  // ── Decorative blobs ──
  blobTopRight: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: C.primaryMuted,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -70,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: C.secondaryMuted,
  },
  blobTopLeft: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.3,
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: C.accentMuted,
  },

  // ── Header / logo ──
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoHalo: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(232,120,138,0.28)',
    backgroundColor: 'rgba(232,120,138,0.06)',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow under badge
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: C.mid,
    letterSpacing: 0.2,
  },

  // ── Card ──
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    padding: 28,
    // Multi-layer shadow for depth
    shadowColor: '#3D1A2E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 18,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.dark,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: C.mid,
    textAlign: 'center',
    marginBottom: 20,
  },

  // ── Google button ──
  btnGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    marginBottom: 16,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
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
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    fontSize: 12,
    color: C.light,
    fontWeight: '500',
  },

  // ── Couple selector ──
  coupleSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  coupleModeBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.inputBg,
  },
  coupleModeBtnActive: {
    borderColor: C.primary,
    backgroundColor: 'rgba(232,120,138,0.06)',
  },
  coupleModeBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.light,
  },
  coupleModeBtnTextActive: {
    color: C.primary,
    fontWeight: '600',
  },

  // ── Input ──
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.dark,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  input: {
    height: 52,
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 16,
    fontSize: 15,
    color: C.dark,
    marginBottom: 14,
  },
  inputFocused: {
    borderColor: C.primary,
    backgroundColor: C.white,
  },

  // ── Error ──
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.errorBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: C.error,
    flex: 1,
    lineHeight: 16,
  },

  // ── Primary button ──
  btnPrimary: {
    height: 52,
    backgroundColor: C.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    // Coloured shadow for lifted look
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 14,
    elevation: 8,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  btnPrimaryText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Toggle mode ──
  toggleText: {
    textAlign: 'center',
    fontSize: 13,
    color: C.primary,
    fontWeight: '500',
  },
  linkText: {
    textAlign: 'center',
    fontSize: 13,
    color: C.mid,
    fontWeight: '500',
  },
});
