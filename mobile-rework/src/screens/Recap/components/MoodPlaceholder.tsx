// Sprint 67 T453 — Section 04 placeholder (prototype `recap.jsx` L282-317).
// PO + Boss decided 2026-04-27 (decision Q1) that mood data source is
// idle for v1: Vibes BE schema kept idle per Sprint 66 directive. Section
// stays in the layout to preserve scroll structure and prototype mapping
// (kicker "04"), but renders an empty-state card instead of the 5
// mood-bar rows.

import { Sparkles } from 'lucide-react-native';
import { Text, View } from 'react-native';

type Props = {
  body: string;
};

export function MoodPlaceholder({ body }: Props) {
  return (
    <View className="mt-3.5 flex-row items-start gap-3 rounded-[20px] border border-dashed border-line bg-surface px-4 py-5">
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-secondary-soft">
        <Sparkles size={18} color="#D97E3F" strokeWidth={2} />
      </View>
      <Text className="flex-1 font-body text-[13px] leading-[20px] text-ink-soft">
        {body}
      </Text>
    </View>
  );
}
