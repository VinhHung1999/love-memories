import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { useSignupDraftStore } from '@/stores/signupDraftStore';

export const PASSWORD_MIN = 6;

// Onboarding-API-timing rule: no /auth/register here. Stage credentials and
// let T285's Finish step actually call the backend.
export const signupSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(PASSWORD_MIN),
});

export type SignupFieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

type ErrorKey = 'nameRequired' | 'emailInvalid' | 'passwordTooShort';

function fieldErrorKey(path: string[]): ErrorKey | null {
  const f = path[0];
  if (f === 'name') return 'nameRequired';
  if (f === 'email') return 'emailInvalid';
  if (f === 'password') return 'passwordTooShort';
  return null;
}

export function useSignUpViewModel() {
  const router = useRouter();
  const setDraft = useSignupDraftStore((s) => s.setDraft);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<SignupFieldErrors>({});

  const canSubmit =
    name.trim().length > 0 && email.includes('@') && password.length >= PASSWORD_MIN;

  const onToggleShow = useCallback(() => setShowPassword((s) => !s), []);

  const onSubmit = useCallback(() => {
    const parsed = signupSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      const next: SignupFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = fieldErrorKey(issue.path.map(String));
        if (!key) continue;
        if (key === 'nameRequired' && !next.name) next.name = 'nameRequired';
        if (key === 'emailInvalid' && !next.email) next.email = 'emailInvalid';
        if (key === 'passwordTooShort' && !next.password) next.password = 'passwordTooShort';
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setDraft({ name: parsed.data.name, email: parsed.data.email, password: parsed.data.password });
    router.push('/(auth)/personalize');
  }, [name, email, password, setDraft, router]);

  const onSwitchLogin = useCallback(() => {
    router.replace('/(auth)/login');
  }, [router]);

  return {
    name,
    email,
    password,
    showPassword,
    errors,
    canSubmit,
    setName,
    setEmail,
    setPassword,
    onToggleShow,
    onSubmit,
    onSwitchLogin,
  };
}
