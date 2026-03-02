import { useReducer } from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuth } from '../../lib/auth';
import { useLoading } from '../../contexts/LoadingContext';
import { GoogleProfile } from '../../types';

export type Mode       = 'login' | 'register';
export type CoupleMode = 'create' | 'join' | null;
export type GoogleStep = 'idle' | 'couple-setup';

// ── State ──────────────────────────────────────────────────────────────────────
interface LoginState {
  mode:                  Mode;
  email:                 string;
  password:              string;
  name:                  string;
  coupleMode:            CoupleMode;
  coupleName:            string;
  inviteCode:            string;
  error:                 string;
  googleStep:            GoogleStep;
  pendingGoogleIdToken:  string;
  pendingGoogleProfile:  GoogleProfile | null;
  googleCoupleMode:      CoupleMode;
  googleCoupleName:      string;
  googleInviteCode:      string;
}

const initialState: LoginState = {
  mode:                 'login',
  email:                '',
  password:             '',
  name:                 '',
  coupleMode:           null,
  coupleName:           '',
  inviteCode:           '',
  error:                '',
  googleStep:           'idle',
  pendingGoogleIdToken: '',
  pendingGoogleProfile: null,
  googleCoupleMode:     null,
  googleCoupleName:     '',
  googleInviteCode:     '',
};

// ── Actions ────────────────────────────────────────────────────────────────────
type LoginAction =
  | { type: 'SET_EMAIL';              value: string }
  | { type: 'SET_PASSWORD';           value: string }
  | { type: 'SET_NAME';               value: string }
  | { type: 'SET_COUPLE_NAME';        value: string }
  | { type: 'SET_INVITE_CODE';        value: string }
  | { type: 'SET_COUPLE_MODE';        value: CoupleMode }   // clears error
  | { type: 'SET_GOOGLE_COUPLE_MODE'; value: CoupleMode }   // clears error
  | { type: 'SET_GOOGLE_COUPLE_NAME'; value: string }
  | { type: 'SET_GOOGLE_INVITE_CODE'; value: string }
  | { type: 'SET_ERROR';              message: string }
  | { type: 'TOGGLE_MODE' }                                  // flip + reset coupleMode + clear error
  | { type: 'GOOGLE_NEEDS_COUPLE';    idToken: string; profile: GoogleProfile; defaultCoupleName: string }
  | { type: 'BACK_FROM_GOOGLE' };                            // reset googleStep + clear error

// ── Reducer ────────────────────────────────────────────────────────────────────
function reducer(state: LoginState, action: LoginAction): LoginState {
  switch (action.type) {
    case 'SET_EMAIL':              return { ...state, email:               action.value };
    case 'SET_PASSWORD':           return { ...state, password:            action.value };
    case 'SET_NAME':               return { ...state, name:                action.value };
    case 'SET_COUPLE_NAME':        return { ...state, coupleName:          action.value };
    case 'SET_INVITE_CODE':        return { ...state, inviteCode:          action.value };
    case 'SET_COUPLE_MODE':        return { ...state, coupleMode:          action.value, error: '' };
    case 'SET_GOOGLE_COUPLE_MODE': return { ...state, googleCoupleMode:    action.value, error: '' };
    case 'SET_GOOGLE_COUPLE_NAME': return { ...state, googleCoupleName:    action.value };
    case 'SET_GOOGLE_INVITE_CODE': return { ...state, googleInviteCode:    action.value };
    case 'SET_ERROR':              return { ...state, error:               action.message };
    case 'TOGGLE_MODE':            return { ...state, mode: state.mode === 'login' ? 'register' : 'login', coupleMode: null, error: '' };
    case 'GOOGLE_NEEDS_COUPLE':    return { ...state, googleStep: 'couple-setup', pendingGoogleIdToken: action.idToken, pendingGoogleProfile: action.profile, googleCoupleName: action.defaultCoupleName };
    case 'BACK_FROM_GOOGLE':       return { ...state, googleStep: 'idle', error: '' };
  }
}

// ── ViewModel ──────────────────────────────────────────────────────────────────
export function useLoginViewModel() {
  const { login, register, loginWithGoogle, completeGoogleSignup } = useAuth();
  const { showLoading, hideLoading, isLoading } = useLoading();
  const [s, dispatch] = useReducer(reducer, initialState);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    dispatch({ type: 'SET_ERROR', message: '' });
    if (s.mode === 'register') {
      if (!s.name.trim())                                    { dispatch({ type: 'SET_ERROR', message: 'Please enter your name' }); return; }
      if (!s.coupleMode)                                     { dispatch({ type: 'SET_ERROR', message: 'Please select create or join a couple' }); return; }
      if (s.coupleMode === 'create' && !s.coupleName.trim()) { dispatch({ type: 'SET_ERROR', message: 'Please enter couple name' }); return; }
      if (s.coupleMode === 'join'   && !s.inviteCode.trim()) { dispatch({ type: 'SET_ERROR', message: 'Please enter invite code' }); return; }
    }
    showLoading();
    try {
      if (s.mode === 'login') {
        await login(s.email.trim(), s.password);
      } else {
        await register(s.email.trim(), s.password, s.name.trim(), {
          inviteCode: s.coupleMode === 'join'   ? s.inviteCode.trim()  : undefined,
          coupleName: s.coupleMode === 'create' ? s.coupleName.trim()  : undefined,
        });
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: err instanceof Error ? err.message : 'Something went wrong' });
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
      if (!idToken) { dispatch({ type: 'SET_ERROR', message: 'Google Sign-In failed: no ID token' }); return; }
      showLoading();
      const result = await loginWithGoogle(idToken);
      if (result?.needsCouple) {
        dispatch({ type: 'GOOGLE_NEEDS_COUPLE', idToken, profile: result.googleProfile, defaultCoupleName: `${result.googleProfile.name}'s couple` });
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (e?.code === statusCodes.IN_PROGRESS)        return;
      dispatch({ type: 'SET_ERROR', message: err instanceof Error ? err.message : 'Google Sign-In failed' });
    } finally {
      hideLoading();
    }
  };

  const handleGoogleCoupleComplete = async () => {
    dispatch({ type: 'SET_ERROR', message: '' });
    if (!s.googleCoupleMode)                                           { dispatch({ type: 'SET_ERROR', message: 'Please select create or join' }); return; }
    if (s.googleCoupleMode === 'create' && !s.googleCoupleName.trim()) { dispatch({ type: 'SET_ERROR', message: 'Please enter couple name' }); return; }
    if (s.googleCoupleMode === 'join'   && !s.googleInviteCode.trim()) { dispatch({ type: 'SET_ERROR', message: 'Please enter invite code' }); return; }
    showLoading();
    try {
      await completeGoogleSignup(s.pendingGoogleIdToken, {
        inviteCode: s.googleCoupleMode === 'join'   ? s.googleInviteCode.trim() : undefined,
        coupleName: s.googleCoupleMode === 'create' ? s.googleCoupleName.trim() : undefined,
      });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: err instanceof Error ? err.message : 'Google signup failed' });
    } finally {
      hideLoading();
    }
  };

  return {
    // state (spread for clean access in the view)
    ...s,
    loading: isLoading,

    // field setters
    setEmail:             (v: string)     => dispatch({ type: 'SET_EMAIL',              value: v }),
    setPassword:          (v: string)     => dispatch({ type: 'SET_PASSWORD',           value: v }),
    setName:              (v: string)     => dispatch({ type: 'SET_NAME',               value: v }),
    setCoupleName:        (v: string)     => dispatch({ type: 'SET_COUPLE_NAME',        value: v }),
    setInviteCode:        (v: string)     => dispatch({ type: 'SET_INVITE_CODE',        value: v }),
    setCoupleMode:        (v: CoupleMode) => dispatch({ type: 'SET_COUPLE_MODE',        value: v }),
    setGoogleCoupleMode:  (v: CoupleMode) => dispatch({ type: 'SET_GOOGLE_COUPLE_MODE', value: v }),
    setGoogleCoupleName:  (v: string)     => dispatch({ type: 'SET_GOOGLE_COUPLE_NAME', value: v }),
    setGoogleInviteCode:  (v: string)     => dispatch({ type: 'SET_GOOGLE_INVITE_CODE', value: v }),

    // actions
    handleSubmit,
    handleGoogleSignIn,
    handleGoogleCoupleComplete,
    toggleMode:           () => dispatch({ type: 'TOGGLE_MODE' }),
    backFromGoogleSetup:  () => dispatch({ type: 'BACK_FROM_GOOGLE' }),
  };
}
