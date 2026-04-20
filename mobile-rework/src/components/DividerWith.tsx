import { Text, View } from 'react-native';

// Ports `DividerWith` from docs/design/prototype/memoura-v2/auth.jsx:81.
// Thin horizontal rule with centered uppercase tracked label.

export function DividerWith({ label }: { label: string }) {
  return (
    <View className="flex-row items-center my-[18px]">
      <View className="flex-1 h-px bg-line" />
      <Text className="mx-2.5 font-bodySemibold text-ink-mute text-[11px] uppercase tracking-[1.4px]">
        {label}
      </Text>
      <View className="flex-1 h-px bg-line" />
    </View>
  );
}
