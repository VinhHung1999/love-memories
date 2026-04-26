import { Text, View } from 'react-native';

// T425 (Sprint 65) — group label between buckets (today / yesterday /
// earlier). Matches prototype `notifications.jsx` L185-189: small
// uppercase label in ink-mute, generous padding-left.

type Props = {
  label: string;
};

export function GroupHeader({ label }: Props) {
  return (
    <View className="px-6 pt-4 pb-1">
      <Text className="font-bodyBold text-ink-mute text-[11px] tracking-[1.5px] uppercase">
        {label}
      </Text>
    </View>
  );
}
