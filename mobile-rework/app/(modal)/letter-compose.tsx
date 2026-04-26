import { useLocalSearchParams } from 'expo-router';

import { LetterComposeScreen } from '@/screens/LetterCompose/LetterComposeScreen';

// T423 (Sprint 65) — replaces the T421 placeholder. Three entry modes are
// keyed off the route params:
//   • no params       → fresh draft
//   • ?id=…           → edit existing draft (Drafts tab tap)
//   • ?replyTo=…      → reply prefill (Letter Read overlay's "Viết thư" CTA)

export default function LetterComposeRoute() {
  const params = useLocalSearchParams<{ id?: string; replyTo?: string }>();
  return (
    <LetterComposeScreen
      params={{ id: params.id, replyTo: params.replyTo }}
    />
  );
}
