import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { ApiError, apiClient } from '@/lib/apiClient';

export const forgotSchema = z.object({
  email: z.string().trim().email(),
});

type FormError = { kind: 'rateLimited' } | { kind: 'network' };

export function useForgotPasswordViewModel() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<FormError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const canSubmit = email.includes('@');

  const onSubmit = useCallback(async () => {
    const parsed = forgotSchema.safeParse({ email });
    if (!parsed.success) {
      setEmailError('emailInvalid');
      return;
    }
    setEmailError(undefined);
    setFormError(null);
    setSubmitting(true);
    try {
      // BE always returns 200 — no enumeration; so we always show "sent".
      await apiClient.post(
        '/api/auth/forgot-password',
        { email: parsed.data.email },
        { skipAuth: true },
      );
      setSentEmail(parsed.data.email);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) setFormError({ kind: 'rateLimited' });
        else setFormError({ kind: 'network' });
      } else {
        setFormError({ kind: 'network' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [email]);

  const onBackToLogin = useCallback(() => {
    router.replace('/(auth)/login');
  }, [router]);

  return {
    email,
    emailError,
    formError,
    submitting,
    sent,
    sentEmail,
    canSubmit,
    setEmail,
    onSubmit,
    onBackToLogin,
  };
}
