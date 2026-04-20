import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { ApiError, apiClient } from '@/lib/apiClient';
import {
  completeAppleSignIn,
  completeGoogleSignIn,
  signInWithApple,
  signInWithGoogle,
} from '@/lib/socialAuth';
import type { SocialKind } from '@/components';
import { useAuthStore } from '@/stores/authStore';

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type LoginFieldErrors = {
  email?: string;
  password?: string;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
    coupleId: string | null;
    onboardingComplete: boolean;
  };
};

type FormError =
  | { kind: 'invalidCredentials' }
  | { kind: 'rateLimited' }
  | { kind: 'network' }
  | { kind: 'socialFailed' };

export function useLoginViewModel() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<FormError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialKind | null>(null);

  const canSubmit = email.includes('@') && password.length >= 1;

  const onToggleShow = useCallback(() => setShowPassword((s) => !s), []);

  const onSubmit = useCallback(async () => {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const next: LoginFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const f = issue.path[0];
        if (f === 'email' && !next.email) next.email = 'emailInvalid';
        if (f === 'password' && !next.password) next.password = 'passwordRequired';
      }
      setErrors(next);
      setFormError(null);
      return;
    }
    setErrors({});
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await apiClient.post<AuthResponse>(
        '/api/auth/login',
        { email: parsed.data.email, password: parsed.data.password },
        { skipAuth: true },
      );
      await setSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        onboardingComplete: res.user.onboardingComplete,
        user: {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          avatarUrl: res.user.avatar,
          coupleId: res.user.coupleId,
        },
      });
      // T301: server is the source of truth for onboardingComplete. Returning
      // users (paired + finished wizard once) land directly in (tabs); fresh
      // accounts (onboardingComplete=false) hit (auth)/pair-create.
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setFormError({ kind: 'invalidCredentials' });
        else if (err.status === 429) setFormError({ kind: 'rateLimited' });
        else if (err.status === 0) setFormError({ kind: 'network' });
        else setFormError({ kind: 'network' });
      } else {
        setFormError({ kind: 'network' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [email, password, setSession]);

  const onSwitchSignup = useCallback(() => {
    router.replace('/(auth)/signup');
  }, [router]);

  const onForgot = useCallback(() => {
    router.push('/(auth)/forgot-password');
  }, [router]);

  const onSocial = useCallback(async (kind: SocialKind) => {
    setSocialLoading(kind);
    setFormError(null);
    try {
      const provider = kind === 'apple' ? signInWithApple : signInWithGoogle;
      const result = await provider();
      if (result.kind === 'cancelled') return;
      if (kind === 'apple') {
        await completeAppleSignIn(result.idToken, result.nameHint);
      } else {
        await completeGoogleSignIn(result.idToken);
      }
      // useAuthGate routes — no manual navigation. New users → pair-create
      // (coupleId=null + onboardingComplete=false), returning users with a
      // coupleId go through the resume probe → (tabs).
    } catch {
      setFormError({ kind: 'socialFailed' });
    } finally {
      setSocialLoading(null);
    }
  }, []);

  return {
    email,
    password,
    showPassword,
    errors,
    formError,
    submitting,
    socialLoading,
    canSubmit,
    setEmail,
    setPassword,
    onToggleShow,
    onSubmit,
    onSwitchSignup,
    onForgot,
    onSocial,
  };
}
