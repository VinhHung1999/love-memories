import { useState } from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuth } from '../../lib/auth';
import { useLoading } from '../../contexts/LoadingContext';
import { GoogleProfile } from '../../types';

export type Mode = 'login' | 'register';
export type CoupleMode = 'create' | 'join' | null;
export type GoogleStep = 'idle' | 'couple-setup';

export function useLoginViewModel() {
  const { login, register, loginWithGoogle, completeGoogleSignup } = useAuth();
  const { showLoading, hideLoading, isLoading } = useLoading();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [coupleMode, _setCoupleMode] = useState<CoupleMode>(null);
  const [coupleName, setCoupleName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const [googleStep, setGoogleStep] = useState<GoogleStep>('idle');
  const [pendingGoogleIdToken, setPendingGoogleIdToken] = useState('');
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState<GoogleProfile | null>(null);
  const [googleCoupleMode, _setGoogleCoupleMode] = useState<CoupleMode>(null);
  const [googleCoupleName, setGoogleCoupleName] = useState('');
  const [googleInviteCode, setGoogleInviteCode] = useState('');

  // Setters with error reset
  const setCoupleMode = (v: CoupleMode) => { _setCoupleMode(v); setError(''); };
  const setGoogleCoupleMode = (v: CoupleMode) => { _setGoogleCoupleMode(v); setError(''); };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setError('');
    if (mode === 'register') {
      if (!name.trim())                                   { setError('Please enter your name'); return; }
      if (!coupleMode)                                    { setError('Please select create or join a couple'); return; }
      if (coupleMode === 'create' && !coupleName.trim()) { setError('Please enter couple name'); return; }
      if (coupleMode === 'join'   && !inviteCode.trim()) { setError('Please enter invite code'); return; }
    }
    showLoading();
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
      hideLoading();
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) { setError('Google Sign-In failed: no ID token'); return; }
      showLoading();
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
      hideLoading();
    }
  };

  const handleGoogleCoupleComplete = async () => {
    setError('');
    if (!googleCoupleMode)                                          { setError('Please select create or join'); return; }
    if (googleCoupleMode === 'create' && !googleCoupleName.trim()) { setError('Please enter couple name'); return; }
    if (googleCoupleMode === 'join'   && !googleInviteCode.trim()) { setError('Please enter invite code'); return; }
    showLoading();
    try {
      await completeGoogleSignup(pendingGoogleIdToken, {
        inviteCode: googleCoupleMode === 'join'   ? googleInviteCode.trim() : undefined,
        coupleName: googleCoupleMode === 'create' ? googleCoupleName.trim() : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google signup failed');
    } finally {
      hideLoading();
    }
  };

  const toggleMode = () => {
    setMode(m => (m === 'login' ? 'register' : 'login'));
    _setCoupleMode(null);
    setError('');
  };

  const backFromGoogleSetup = () => {
    setGoogleStep('idle');
    setError('');
  };

  return {
    // state
    mode, email, password, name,
    coupleMode, coupleName, inviteCode,
    loading: isLoading, // driven by global overlay context
    error,
    googleStep, pendingGoogleProfile,
    googleCoupleMode, googleCoupleName, googleInviteCode,
    // setters
    setEmail, setPassword, setName,
    setCoupleMode, setCoupleName, setInviteCode,
    setGoogleCoupleMode, setGoogleCoupleName, setGoogleInviteCode,
    // actions
    handleSubmit, handleGoogleSignIn, handleGoogleCoupleComplete,
    toggleMode, backFromGoogleSetup,
  };
}
