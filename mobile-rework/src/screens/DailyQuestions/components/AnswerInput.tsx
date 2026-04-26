import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

// Sprint 66 T433 RESCUE — naked input. Build 103/104/105 all bled focus
// from the same root: any focus-driven re-render of the parent View (border
// width/color/shadow flip, char-counter, tip-line conditional) reframes
// the TextInput and iOS dispatches an immediate blur. Stripped to the
// bare minimum: ONE static-styled View, ONE TextInput, ONE Send button.
// No focused useState. No conditional styling. No auxiliary chrome.
//
// If a future sprint wants to re-introduce the focused glow, char counter,
// or tip line, do it via siblings/overlays that DON'T re-render the
// TextInput's parent — or accept the focus loss is a hard tax.

const MAX_CHARS = 280;
const MIN_CHARS = 3;

type Props = {
  placeholder: string;
  sendLabel: string;
  submitting: boolean;
  onSubmit: (text: string) => void;
};

export function AnswerInput({ placeholder, sendLabel, submitting, onSubmit }: Props) {
  const c = useAppColors();
  const [text, setText] = useState('');
  const canSend = text.trim().length >= MIN_CHARS && !submitting;

  return (
    <View
      className="mx-5 mt-3.5 rounded-[22px] px-4 pt-4 pb-3"
      style={{
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.lineOnSurface,
      }}
    >
      <TextInput
        value={text}
        onChangeText={(v) => setText(v.slice(0, MAX_CHARS))}
        placeholder={placeholder}
        placeholderTextColor={c.inkMute}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="font-body text-[15px] leading-[22px] min-h-[90px] p-0"
        style={{ color: c.ink }}
      />

      <View className="flex-row items-center justify-end mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: c.lineOnSurface }}>
        <Pressable
          onPress={() => {
            if (!canSend) return;
            onSubmit(text);
            setText('');
          }}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={sendLabel}
          className="rounded-[14px] py-2.5 px-4 flex-row items-center gap-1.5 active:opacity-90"
          style={{ backgroundColor: canSend ? c.primary : c.surfaceAlt }}
        >
          <Text
            className="font-bodyBold text-[13px]"
            style={{ color: canSend ? '#ffffff' : c.inkMute }}
          >
            {sendLabel}
          </Text>
          <Send size={12} strokeWidth={2.5} color={canSend ? '#ffffff' : c.inkMute} />
        </Pressable>
      </View>
    </View>
  );
}
