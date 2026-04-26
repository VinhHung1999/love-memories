import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

// Sprint 66 T427 — the "Em trả lời" input card. Bám 1:1 prototype
// `recap.jsx:1069-1172` (DailyQUnansweredScreen input area).
//
// T432-F3 (Boss Build 103) — voice / photo / hints placeholder buttons
// removed entirely. Boss decided to skip the media-answer affordance
// rather than render disabled placeholders. The action row now hosts
// just the Send button at the right edge.

const MAX_CHARS = 280;
const MIN_CHARS = 3;

type Props = {
  myInitial: string;
  myName: string;
  inputName: string;
  placeholder: string;
  charsLeftLabel: (n: number) => string;
  writingTip: string;
  sendLabel: string;
  submitting: boolean;
  onSubmit: (text: string) => void;
};

export function AnswerInput({
  myInitial,
  myName,
  inputName,
  placeholder,
  charsLeftLabel,
  writingTip,
  sendLabel,
  submitting,
  onSubmit,
}: Props) {
  const c = useAppColors();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const charsLeft = MAX_CHARS - text.length;
  const canSend = text.trim().length >= MIN_CHARS && !submitting;

  return (
    <View
      className="mx-5 mt-3.5 rounded-[22px] px-4 pt-4 pb-3"
      style={{
        backgroundColor: c.surface,
        borderWidth: focused ? 2 : 1,
        borderColor: focused ? c.primary : c.lineOnSurface,
        shadowColor: focused ? c.primary : 'transparent',
        shadowOpacity: focused ? 0.27 : 0,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 8 },
      }}
    >
      {/* Top row — L-avatar + name · "Em trả lời..." + char counter */}
      <View className="flex-row items-center gap-2 mb-2.5">
        <View
          className="w-[26px] h-[26px] rounded-full overflow-hidden items-center justify-center"
        >
          <LinearGradient
            colors={[c.heroA, c.heroB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0"
          />
          <Text className="font-bodyBold text-white text-[11px] relative">{myInitial}</Text>
        </View>
        <Text className="font-bodyBold text-[12px]" style={{ color: c.ink }}>
          {myName}
        </Text>
        <Text className="font-body text-[11px]" style={{ color: c.inkMute }}>
          · {inputName}
        </Text>
        <View className="flex-1" />
        <Text
          className="font-bodySemibold text-[11px]"
          style={{
            color: charsLeft < 30 ? c.primary : c.inkMute,
            fontVariant: ['tabular-nums'],
          }}
        >
          {charsLeftLabel(charsLeft)}
        </Text>
      </View>

      {/* Textarea */}
      <TextInput
        value={text}
        onChangeText={(v) => setText(v.slice(0, MAX_CHARS))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={c.inkMute}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="font-body text-[15px] leading-[22px] min-h-[90px] p-0"
        style={{ color: c.ink }}
      />

      {/* Tip line — only visible when text empty (matches prototype). */}
      {text.length === 0 ? (
        <Text
          className="font-displayItalic text-[12px] mt-1"
          style={{ color: c.inkMute, lineHeight: 16 }}
          numberOfLines={2}
        >
          {writingTip}
        </Text>
      ) : null}

      {/* Action row — Send only (T432-F3). */}
      <View
        className="flex-row items-center justify-end mt-3.5 pt-3"
        style={{ borderTopWidth: 1, borderTopColor: c.lineOnSurface }}
      >
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
          style={{
            backgroundColor: canSend ? c.primary : c.surfaceAlt,
            shadowColor: canSend ? c.primary : 'transparent',
            shadowOpacity: canSend ? 0.53 : 0,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 6 },
          }}
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
