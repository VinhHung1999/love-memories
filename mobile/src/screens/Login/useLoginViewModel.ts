import { useReducer, useState } from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuth } from '../../lib/auth';
import { useLoading } from '../../contexts/LoadingContext';
import type { OnboardingData } from '../Onboarding/types';
import t from '../../locales/en';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export type Mode = 'login' | 'register';

// ── State ──────────────────────────────────────────────────────────────────────
interface LoginState {
  mode:             Mode;
  email:            string;
  password:         string;
  confirmPassword:  string;
  name:             string;
  error:            string;
}

const initialState: LoginState = {
  mode:            'login',
  email:           '',
  password:        '',
  confirmPassword: '',
  name:            '',
  error:           '',
};

// ── Actions ────────────────────────────────────────────────────────────────────
type LoginAction =
  | { type: 'SET_EMAIL';            value: string }
  | { type: 'SET_PASSWORD';         value: string }
  | { type: 'SET_CONFIRM_PASSWORD'; value: string }
  | { type: 'SET_NAME';             value: string }
  | { type: 'SET_ERROR';            message: string }
  | { type: 'TOGGLE_MODE' };

// ── Reducer ────────────────────────────────────────────────────────────────────
function reducer(state: LoginState, action: LoginAction): LoginState {
  switch (action.type) {
    case 'SET_EMAIL':            return { ...state, email:           action.value };
    case 'SET_PASSWORD':         return { ...state, password:        action.value };
    case 'SET_CONFIRM_PASSWORD': return { ...state, confirmPassword: action.value };
    case 'SET_NAME':             return { ...state, name:            action.value };
    case 'SET_ERROR':            return { ...state, error:           action.message };
    case 'TOGGLE_MODE':          return { ...state, mode: state.mode === 'login' ? 'register' : 'login', confirmPassword: '', error: '' };
  }
}

// ── ViewModel ──────────────────────────────────────────────────────────────────
export function useLoginViewModel() {
  const { login, loginWithGoogle } = useAuth();
  const { showLoading, hideLoading, isLoading } = useLoading();
  const [s, dispatch] = useReducer(reducer, initialState);

  // Pending onboarding data — set to navigate to wizard
  const [pendingOnboarding, setPendingOnboarding] = useState<OnboardingData | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    dispatch({ type: 'SET_ERROR', message: '' });
    if (!s.email.trim())                { dispatch({ type: 'SET_ERROR', message: t.login.errors.emailRequired }); return; }
    if (!EMAIL_RE.test(s.email.trim())) { dispatch({ type: 'SET_ERROR', message: t.login.errors.emailInvalid }); return; }
    if (!s.password)                    { dispatch({ type: 'SET_ERROR', message: t.login.errors.passwordRequired }); return; }

    if (s.mode === 'register') {
      if (s.password.length < MIN_PASSWORD_LENGTH) { dispatch({ type: 'SET_ERROR', message: t.login.errors.passwordTooShort }); return; }
      if (s.confirmPassword !== s.password)        { dispatch({ type: 'SET_ERROR', message: t.login.errors.passwordMismatch }); return; }
      if (!s.name.trim())                          { dispatch({ type: 'SET_ERROR', message: t.login.errors.nameRequired }); return; }
      // Navigate to onboarding wizard instead of calling register directly
      setPendingOnboarding({ email: s.email.trim(), password: s.password, userName: s.name.trim() });
      return;
    }

    // Login flow
    showLoading();
    try {
      await login(s.email.trim(), s.password);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: err instanceof Error ? err.message : t.login.errors.somethingWrong });
    } finally {
      hideLoading();
    }
  };

  const handleGoogleSignIn = async () => {
    dispatch({ type: 'SET_ERROR', message: '' });
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) { dispatch({ type: 'SET_ERROR', message: t.login.errors.googleNoToken }); return; }
      showLoading();
      const result = await loginWithGoogle(idToken);
      if (result?.needsCouple) {
        // Navigate to onboarding wizard
        setPendingOnboarding({ googleIdToken: idToken, googleProfile: result.googleProfile });
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (e?.code === statusCodes.IN_PROGRESS)        return;
      dispatch({ type: 'SET_ERROR', message: err instanceof Error ? err.message : t.login.errors.googleSignInFailed });
    } finally {
      hideLoading();
    }
  };

  return {
    ...s,
    loading: isLoading,
    pendingOnboarding,
    clearPendingOnboarding: () => setPendingOnboarding(null),

    setEmail:           (v: string) => dispatch({ type: 'SET_EMAIL',            value: v }),
    setPassword:        (v: string) => dispatch({ type: 'SET_PASSWORD',         value: v }),
    setConfirmPassword: (v: string) => dispatch({ type: 'SET_CONFIRM_PASSWORD', value: v }),
    setName:            (v: string) => dispatch({ type: 'SET_NAME',             value: v }),

    handleSubmit,
    handleGoogleSignIn,
    toggleMode: () => dispatch({ type: 'TOGGLE_MODE' }),
  };
}
