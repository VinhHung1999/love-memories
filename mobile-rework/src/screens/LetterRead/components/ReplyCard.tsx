import { PenLine } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

// T422 (Sprint 65) — reply card pinned at the bottom of the scroll content
// (not viewport-fixed; the spec's "sticky" means end-of-content + safe-area
// breathing room, not a floating overlay). Two CTAs: "Viết thư" primary
// (routes to /letter-compose?replyTo=…) and "❤️ Thả tim" surfaceAlt
// (no BE reaction endpoint yet — taps a ComingSoonSheet per Lu Q-C).
//
// Prototype `letters.jsx` L396-426.

type Props = {
  eyebrow: string;
  body: string;
  writeLabel: string;
  reactLabel: string;
  onWrite: () => void;
  onReact: () => void;
};

export function ReplyCard({
  eyebrow,
  body,
  writeLabel,
  reactLabel,
  onWrite,
  onReact,
}: Props) {
  return (
    <View className="mt-5 mx-5 mb-8 px-4 py-4 rounded-[20px] bg-surface border border-line-on-surface">
      <Text className="font-script text-ink-mute text-[17px]">{eyebrow}</Text>
      <Text className="mt-2 font-body text-ink-mute text-[14px] leading-[20px]">
        {body}
      </Text>
      <View className="mt-3.5 flex-row gap-2">
        <Pressable
          onPress={onWrite}
          accessibilityRole="button"
          className="flex-1 flex-row items-center justify-center gap-1.5 h-[44px] rounded-2xl bg-primary active:bg-primary-deep"
        >
          <PenLine size={14} strokeWidth={2.4} color="#ffffff" />
          <Text className="font-bodyBold text-white text-[13px]">
            {writeLabel}
          </Text>
        </Pressable>
        <Pressable
          onPress={onReact}
          accessibilityRole="button"
          className="flex-row items-center justify-center gap-1.5 h-[44px] px-4 rounded-2xl bg-surface-alt active:opacity-80"
        >
          <Text className="text-[15px]">❤️</Text>
          <Text className="font-bodyBold text-ink text-[13px]">
            {reactLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
