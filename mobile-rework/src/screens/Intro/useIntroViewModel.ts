import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export type IntroSlideKind = 'moments' | 'letters' | 'daily';

export const INTRO_SLIDE_KINDS: readonly IntroSlideKind[] = ['moments', 'letters', 'daily'];

export function useIntroViewModel() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);

  const finish = useCallback(() => {
    router.push('/(auth)/signup');
  }, [router]);

  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>, slideWidth: number) => {
      if (slideWidth <= 0) return;
      const next = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
      setIdx((prev) => (prev === next ? prev : next));
    },
    [],
  );

  return {
    idx,
    finish,
    slideCount: INTRO_SLIDE_KINDS.length,
    onMomentumEnd,
  };
}
