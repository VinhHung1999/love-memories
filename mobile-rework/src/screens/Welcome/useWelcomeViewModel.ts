import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export function useWelcomeViewModel() {
  const router = useRouter();

  const onStart = useCallback(() => {
    router.push('/(auth)/intro');
  }, [router]);

  const onLogin = useCallback(() => {
    router.push('/(auth)/login');
  }, [router]);

  return { onStart, onLogin };
}
