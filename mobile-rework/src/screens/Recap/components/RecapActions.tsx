// Sprint 67 T454 — Bottom action row (prototype `recap.jsx` L521-560).
// Per spec, the "Save 30s video" button is hidden this sprint — only
// "Send to partner" (copies share link via Clipboard) and "Save to Book"
// (toast/alert "coming soon") render.
//
// Buttons live as a 2-column row: send (filled, ink bg) + saveBook
// (outlined dashed, secondary). Tapping fires the supplied handler — the
// caller (ViewModel) handles clipboard write + alert.

import { Mail, Notebook } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

type Props = {
  shareLabel: string;
  shareSubLabel?: string;
  saveBookLabel: string;
  onShare: () => void;
  onSaveBook: () => void;
};

export function RecapActions({
  shareLabel,
  shareSubLabel,
  saveBookLabel,
  onShare,
  onSaveBook,
}: Props) {
  return (
    <View className="mx-4 mt-4" style={{ gap: 10 }}>
      <Pressable
        accessibilityRole="button"
        onPress={onShare}
        className="flex-row items-center justify-center gap-2 rounded-2xl bg-ink px-3 py-4 active:opacity-80"
      >
        <Mail size={14} color="#FFFFFF" strokeWidth={2} />
        <View className="flex-row items-center gap-2">
          <Text className="font-bodyBold text-[13px] text-bg">{shareLabel}</Text>
          {shareSubLabel ? (
            <Text className="font-body text-[11px] text-bg/70">· {shareSubLabel}</Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onSaveBook}
        className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-transparent px-3 py-3 active:opacity-70"
      >
        <Notebook size={14} color="#000" strokeWidth={2} />
        <Text className="font-bodySemibold text-[12px] text-ink-soft">{saveBookLabel}</Text>
      </Pressable>
    </View>
  );
}
