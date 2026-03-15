import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuth } from '../../lib/auth';
import { useLoading } from '../../contexts/LoadingContext';
import { useTranslation } from 'react-i18next';
import { coupleApi } from '../../lib/api';
import { getPendingInviteCode } from '../../lib/pendingInvite';
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
  const { t } = useTranslation();
  const { login, loginWithGoogle, beginEmailOnboarding, completeOnboarding, beginGoogleOnboarding } = useAuth();
  const { showLoading, hideLoading, isLoading } = useLoading();
  const [s, dispatch] = useReducer(reducer, initialState);

  // ── Invite banner ─────────────────────────────────────────────────────────
  const [inviteBanner, setInviteBanner] = useState<{
    partnerName: string;
    coupleName: string;
  } | null>(null);

  useEffect(() => {
    const code = getPendingInviteCode();
    if (!code) return;
    coupleApi.validateInvite(code).then(result => {
      if (result.valid) {
        setInviteBanner({ partnerName: result.partnerName, coupleName: result.coupleName });
      }
    }).catch(() => {});
  }, []);

  const dismissInviteBanner = () => setInviteBanner(null);

  // ── Rate-limit countdown ──────────────────────────────────────────────────
  const [retrySeconds, setRetrySeconds] = useState<number | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) { clearInterval(retryTimerRef.current); }
    };
  }, []);

  const fmtCountdown = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const startRetryCountdown = useCallback((seconds: number) => {
    if (retryTimerRef.current) { clearInterval(retryTimerRef.current); }
    setRetrySeconds(seconds);
    dispatch({ type: 'SET_ERROR', message: `Too many attempts. Try again in ${fmtCountdown(seconds)}` });
    retryTimerRef.current = setInterval(() => {
      setRetrySeconds(prev => {
        const next = (prev ?? 1) - 1;
        if (next <= 0) {
          clearInterval(retryTimerRef.current!);
          retryTimerRef.current = null;
          dispatch({ type: 'SET_ERROR', message: '' });
          return null;
        }
        dispatch({ type: 'SET_ERROR', message: `Too many attempts. Try again in ${fmtCountdown(next)}` });
        return next;
      });
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    dispatch({ type: 'SET_ERROR', message: '' });
    if (!s.email.trim())                { dispatch({ type: 'SET_ERROR', message: t('login.errors.emailRequired') }); return; }
    if (!EMAIL_RE.test(s.email.trim())) { dispatch({ type: 'SET_ERROR', message: t('login.errors.emailInvalid') }); return; }
    if (!s.password)                    { dispatch({ type: 'SET_ERROR', message: t('login.errors.passwordRequired') }); return; }

    if (s.mode === 'register') {
      if (s.password.length < MIN_PASSWORD_LENGTH) { dispatch({ type: 'SET_ERROR', message: t('login.errors.passwordTooShort') }); return; }
      if (s.confirmPassword !== s.password)        { dispatch({ type: 'SET_ERROR', message: t('login.errors.passwordMismatch') }); return; }
      if (!s.name.trim())                          { dispatch({ type: 'SET_ERROR', message: t('login.errors.nameRequired') }); return; }
      // Register immediately, then navigation auto-redirects to OnboardingNavigator (coupleId=null)
      showLoading();
      try {
        const regUser = await beginEmailOnboarding(s.email.trim(), s.password, s.name.trim());
        completeOnboarding(regUser);
      } catch (err) {
        const e = err as Error & { status?: number; retryAfterSeconds?: number };
        if (e.status === 429 || e.retryAfterSeconds) {
          startRetryCountdown(e.retryAfterSeconds ?? 60);
        } else {
          dispatch({ type: 'SET_ERROR', message: e.message || t('login.errors.somethingWrong') });
        }
      } finally {
        hideLoading();
      }
      return;
    }

    // Login flow
    showLoading();
    try {
      await login(s.email.trim(), s.password);
    } catch (err) {
      const e = err as Error & { status?: number; retryAfterSeconds?: number };
      if (e.status === 429 || e.retryAfterSeconds) {
        startRetryCountdown(e.retryAfterSeconds ?? 60);
      } else {
        dispatch({ type: 'SET_ERROR', message: e.message || t('login.errors.somethingWrong') });
      }
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
      if (!idToken) { dispatch({ type: 'SET_ERROR', message: t('login.errors.googleNoToken') }); return; }
      showLoading();
      const result = await loginWithGoogle(idToken);
      if (result?.needsCouple) {
        const regUser = await beginGoogleOnboarding(idToken);
        completeOnboarding(regUser);
      }
    } catch (err: unknown) {
      const e = err as { code?: string; status?: number; retryAfterSeconds?: number; message?: string };
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (e?.code === statusCodes.IN_PROGRESS)        return;
      if (e?.status === 429 || e?.retryAfterSeconds) {
        startRetryCountdown(e.retryAfterSeconds ?? 60);
      } else {
        dispatch({ type: 'SET_ERROR', message: e.message || t('login.errors.googleSignInFailed') });
      }
    } finally {
      hideLoading();
    }
  };

  return {
    ...s,
    loading: isLoading,
    isRateLimited: retrySeconds !== null,

    setEmail:           (v: string) => dispatch({ type: 'SET_EMAIL',            value: v }),
    setPassword:        (v: string) => dispatch({ type: 'SET_PASSWORD',         value: v }),
    setConfirmPassword: (v: string) => dispatch({ type: 'SET_CONFIRM_PASSWORD', value: v }),
    setName:            (v: string) => dispatch({ type: 'SET_NAME',             value: v }),

    inviteBanner,
    dismissInviteBanner,

    handleSubmit,
    handleGoogleSignIn,
    toggleMode: () => dispatch({ type: 'TOGGLE_MODE' }),
  };
}
