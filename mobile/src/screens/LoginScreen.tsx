import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuth } from '../lib/auth';
import { GoogleProfile } from '../types';

// ---------------------------------------------------------------------------
// Google Sign-In config — call once at app start (done in App.tsx)
// We just use it here for the button
// ---------------------------------------------------------------------------

type Mode = 'login' | 'register';
type CoupleMode = 'create' | 'join' | null;
type GoogleStep = 'idle' | 'couple-setup';

export default function LoginScreen() {
  const { login, register, loginWithGoogle, completeGoogleSignup } = useAuth();

  // Email/password form state
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [coupleMode, setCoupleMode] = useState<CoupleMode>(null);
  const [coupleName, setCoupleName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google OAuth state
  const [googleStep, setGoogleStep] = useState<GoogleStep>('idle');
  const [pendingGoogleIdToken, setPendingGoogleIdToken] = useState('');
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState<GoogleProfile | null>(null);
  const [googleCoupleMode, setGoogleCoupleMode] = useState<CoupleMode>(null);
  const [googleCoupleName, setGoogleCoupleName] = useState('');
  const [googleInviteCode, setGoogleInviteCode] = useState('');

  // ---------------------------------------------------------------------------
  // Email/password submit
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

  // ---------------------------------------------------------------------------
  // Google Sign-In
  // ---------------------------------------------------------------------------

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        setError('Google Sign-In failed: no ID token');
        return;
      }
      setLoading(true);
      const result = await loginWithGoogle(idToken);
      if (result?.needsCouple) {
        setPendingGoogleIdToken(idToken);
        setPendingGoogleProfile(result.googleProfile);
        setGoogleCoupleName(`${result.googleProfile.name}'s couple`);
        setGoogleStep('couple-setup');
      }
      // else: auth context sets user → RootNavigator switches to MainNavigator
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (e?.code === statusCodes.IN_PROGRESS) return;
      setError(err instanceof Error ? err.message : 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Google couple setup submit
  // ---------------------------------------------------------------------------

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
  // Render helpers
  // ---------------------------------------------------------------------------

  const inputCls = 'w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 bg-white mb-3';
  const btnPrimary = 'w-full bg-primary rounded-2xl py-3 items-center mb-3';

  // ---------------------------------------------------------------------------
  // Google couple setup screen
  // ---------------------------------------------------------------------------

  if (googleStep === 'couple-setup') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-rose-50">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled">
          <View className="w-full max-w-sm bg-white rounded-3xl shadow-sm p-6">
            <Text className="text-2xl font-bold text-center text-gray-900 mb-1">
              Welcome, {pendingGoogleProfile?.name}!
            </Text>
            <Text className="text-sm text-gray-500 text-center mb-6">
              One more step — set up your couple
            </Text>

            {/* Create / Join selector */}
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={() => { setGoogleCoupleMode('create'); setError(''); }}
                className={`flex-1 rounded-2xl border-2 py-3 items-center ${
                  googleCoupleMode === 'create' ? 'border-primary bg-rose-50' : 'border-gray-200'
                }`}>
                <Text className={googleCoupleMode === 'create' ? 'text-primary font-semibold text-sm' : 'text-gray-500 text-sm'}>
                  + Create new
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { setGoogleCoupleMode('join'); setError(''); }}
                className={`flex-1 rounded-2xl border-2 py-3 items-center ${
                  googleCoupleMode === 'join' ? 'border-primary bg-rose-50' : 'border-gray-200'
                }`}>
                <Text className={googleCoupleMode === 'join' ? 'text-primary font-semibold text-sm' : 'text-gray-500 text-sm'}>
                  Join existing
                </Text>
              </Pressable>
            </View>

            {googleCoupleMode === 'create' && (
              <TextInput
                className={inputCls}
                placeholder="Couple name (e.g. Hung & Nhu)"
                value={googleCoupleName}
                onChangeText={setGoogleCoupleName}
                autoCapitalize="words"
              />
            )}
            {googleCoupleMode === 'join' && (
              <TextInput
                className={inputCls}
                placeholder="Invite code from your partner"
                value={googleInviteCode}
                onChangeText={setGoogleInviteCode}
                autoCapitalize="none"
              />
            )}

            {!!error && (
              <View className="bg-red-50 rounded-xl px-3 py-2 mb-3">
                <Text className="text-red-500 text-xs">{error}</Text>
              </View>
            )}

            <Pressable className={btnPrimary} onPress={handleGoogleCoupleComplete} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-semibold">Create account</Text>}
            </Pressable>

            <Pressable onPress={() => { setGoogleStep('idle'); setError(''); }}>
              <Text className="text-center text-gray-400 text-sm">Back</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ---------------------------------------------------------------------------
  // Main login/register screen
  // ---------------------------------------------------------------------------

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-rose-50">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-4 shadow-md">
            <Text className="text-3xl">❤️</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900">Love Scrum</Text>
          <Text className="text-sm text-gray-400 mt-1">Our little world 🌸</Text>
        </View>

        {/* Card */}
        <View className="w-full max-w-sm bg-white rounded-3xl shadow-sm p-6">
          <Text className="text-xl font-bold text-center text-gray-900 mb-5">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </Text>

          {/* Google Sign-In button */}
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={loading}
            className="w-full border-2 border-gray-200 rounded-2xl py-3 flex-row items-center justify-center gap-2 mb-4">
            <Text className="text-lg">G</Text>
            <Text className="text-sm font-semibold text-gray-700">
              {mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
            </Text>
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center gap-3 mb-4">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="text-xs text-gray-400">or</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Register-only fields */}
          {mode === 'register' && (
            <>
              <TextInput
                className={inputCls}
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              {/* Couple mode selector */}
              <Text className="text-sm font-medium text-gray-700 mb-2">Couple</Text>
              <View className="flex-row gap-3 mb-3">
                <Pressable
                  onPress={() => { setCoupleMode('create'); setError(''); }}
                  className={`flex-1 rounded-2xl border-2 py-3 items-center ${
                    coupleMode === 'create' ? 'border-primary bg-rose-50' : 'border-gray-200'
                  }`}>
                  <Text className={coupleMode === 'create' ? 'text-primary font-semibold text-sm' : 'text-gray-500 text-sm'}>
                    + Create new
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => { setCoupleMode('join'); setError(''); }}
                  className={`flex-1 rounded-2xl border-2 py-3 items-center ${
                    coupleMode === 'join' ? 'border-primary bg-rose-50' : 'border-gray-200'
                  }`}>
                  <Text className={coupleMode === 'join' ? 'text-primary font-semibold text-sm' : 'text-gray-500 text-sm'}>
                    Join existing
                  </Text>
                </Pressable>
              </View>

              {coupleMode === 'create' && (
                <TextInput
                  className={inputCls}
                  placeholder="Couple name (e.g. Hung & Nhu)"
                  value={coupleName}
                  onChangeText={setCoupleName}
                  autoCapitalize="words"
                />
              )}
              {coupleMode === 'join' && (
                <TextInput
                  className={inputCls}
                  placeholder="Invite code from your partner"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="none"
                />
              )}
            </>
          )}

          {/* Email + Password */}
          <TextInput
            className={inputCls}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            className={inputCls}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'login' ? 'password' : 'new-password'}
          />

          {/* Error */}
          {!!error && (
            <View className="bg-red-50 rounded-xl px-3 py-2 mb-3">
              <Text className="text-red-500 text-xs">{error}</Text>
            </View>
          )}

          {/* Submit */}
          <Pressable className={btnPrimary} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-semibold">
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </Text>}
          </Pressable>

          {/* Toggle mode */}
          <Pressable
            onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setCoupleMode(null); setError(''); }}>
            <Text className="text-center text-primary text-sm">
              {mode === 'login'
                ? "Don't have an account? Register"
                : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
