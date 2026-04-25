import { useLocalSearchParams } from 'expo-router';

import { LetterReadScreen } from '@/screens/LetterRead/LetterReadScreen';

// T422 (Sprint 65) — replaces the Sprint 60 placeholder. Real overlay lives
// in src/screens/LetterRead/. Route param `id` matches the LettersScreen
// router.push call (`router.push({ pathname: '/letter-read', params: { id } })`).

export default function LetterReadRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  return <LetterReadScreen id={params.id} />;
}
