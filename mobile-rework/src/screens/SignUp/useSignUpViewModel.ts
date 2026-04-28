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

export const PASSWORD_MIN = 6;

// Sprint-6 spec §T282 #4: Submit fires /auth/register immediately. JWT is
// required by /couple/generate-invite + /couple/joinCouple in T284/T285, so
// register must happen before any pair step. Pair-create is the first screen
// after success — useAuthGate routes there because the new user has
// onboardingComplete=false (default for fresh accounts) and is still on the
// pre-auth /(auth)/signup segment.

export const signupSchema = z
  .object({
    name: z.string().trim().min(1),
    email: z.string().trim().email(),
    password: z.string().min(PASSWORD_MIN),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'passwordMismatch',
  });

export type SignupFieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type FormError =
  | { kind: 'emailTaken' }
  | { kind: 'rateLimited' }
  | { kind: 'network' }
  | { kind: 'socialFailed' };

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

function fieldErrorKey(path: PropertyKey[]): keyof SignupFieldErrors | null {
  const f = path[0];
  if (f === 'name') return 'name';
  if (f === 'email') return 'email';
  if (f === 'password') return 'password';
  if (f === 'confirmPassword') return 'confirmPassword';
  return null;
}

export function useSignUpViewModel() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<SignupFieldErrors>({});
  const [formError, setFormError] = useState<FormError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialKind | null>(null);

  const canSubmit =
    name.trim().length > 0 &&
    email.includes('@') &&
    password.length >= PASSWORD_MIN &&
    confirmPassword.length > 0 &&
    !submitting;

  const onToggleShow = useCallback(() => setShowPassword((s) => !s), []);
  const onToggleShowConfirm = useCallback(() => setShowConfirmPassword((s) => !s), []);

  const onSubmit = useCallback(async () => {
    const parsed = signupSchema.safeParse({ name, email, password, confirmPassword });
    if (!parsed.success) {
      const next: SignupFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = fieldErrorKey(issue.path);
        if (!key) continue;
        if (key === 'confirmPassword') {
          if (!next.confirmPassword) next.confirmPassword = 'passwordMismatch';
        } else if (key === 'name' && !next.name) {
          next.name = 'nameRequired';
        } else if (key === 'email' && !next.email) {
          next.email = 'emailInvalid';
        } else if (key === 'password' && !next.password) {
          next.password = 'passwordTooShort';
        }
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
        '/api/auth/register',
        {
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password,
        },
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
          color: (res.user as { color?: string | null }).color ?? null,
          coupleId: res.user.coupleId,
        },
      });
      // useAuthGate in app/_layout.tsx routes to /(auth)/pair-create because
      // the brand-new user has onboardingComplete=false (server default) →
      // PRE_AUTH_SCREENS branch fires once accessToken flips on /(auth)/signup.
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) setFormError({ kind: 'emailTaken' });
        else if (err.status === 429) setFormError({ kind: 'rateLimited' });
        else setFormError({ kind: 'network' });
      } else {
        setFormError({ kind: 'network' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [name, email, password, confirmPassword, setSession]);

  const onSwitchLogin = useCallback(() => {
    router.replace('/(auth)/login');
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
    } catch {
      setFormError({ kind: 'socialFailed' });
    } finally {
      setSocialLoading(null);
    }
  }, []);

  return {
    name,
    email,
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    errors,
    formError,
    submitting,
    socialLoading,
    canSubmit,
    setName,
    setEmail,
    setPassword,
    setConfirmPassword,
    onToggleShow,
    onToggleShowConfirm,
    onSubmit,
    onSwitchLogin,
    onSocial,
  };
}
