import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { ApiError, apiClient } from '@/lib/apiClient';
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
  };
};

type FormError =
  | { kind: 'invalidCredentials' }
  | { kind: 'rateLimited' }
  | { kind: 'network' };

export function useLoginViewModel() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<FormError | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        user: {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          avatarUrl: res.user.avatar,
          coupleId: res.user.coupleId,
        },
      });
      // useAuthGate in app/_layout.tsx routes to (tabs) or (auth)/pair-create
      // based on coupleId — no manual navigation needed.
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

  return {
    email,
    password,
    showPassword,
    errors,
    formError,
    submitting,
    canSubmit,
    setEmail,
    setPassword,
    onToggleShow,
    onSubmit,
    onSwitchSignup,
    onForgot,
  };
}
