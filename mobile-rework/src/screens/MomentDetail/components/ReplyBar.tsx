import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { LinearGradient } from '@/components/Gradient';
import { useAppColors } from '@/theme/ThemeProvider';

// T414 (Sprint 63) — redesign to match prototype moments.jsx L672-696.
//
// Changes from the T401/T408 version:
//   - Inline inside the ScrollView (no longer sticky-to-bottom). The outer
//     KeyboardAvoidingView still lifts the whole scroll surface above the
//     keyboard, and because the input is part of the scroll content RN's
//     normal focus-into-view flow keeps it visible.
//   - Drops the border-t + insets.bottom padding — the bar is now a self-
//     contained rounded card (rounded-[22px], border, padding 8 8 8 14).
//   - Adds a 24×24 gradient avatar circle with the current user's initial,
//     matching the prototype's `L` avatar on a heroA→heroB gradient.
//   - Placeholder now interpolates the partner's name: "Viết gì đó cho
//     {{partner}}…" / "Say something to {{partner}}…".
//
// MomentDetailScreen renders this inside DetailBody after CommentsSection.

type Props = {
  onSend: (content: string) => Promise<boolean>;
  partnerName: string;
  userInitial: string;
  disabled?: boolean;
  posting?: boolean;
};

export function ReplyBar({
  onSend,
  partnerName,
  userInitial,
  disabled,
  posting,
}: Props) {
  const { t } = useTranslation();
  const c = useAppColors();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const trimmed = text.trim();
  const canSend = !disabled && !posting && trimmed.length > 0;

  const handleSend = async () => {
    if (!canSend) return;
    const content = trimmed;
    setText('');
    inputRef.current?.blur();
    const ok = await onSend(content);
    if (!ok) {
      setText(content);
      Alert.alert(t('moments.detail.comments.postError'));
    }
  };

  const sendStyle = canSend
    ? { backgroundColor: c.primary }
    : { backgroundColor: c.lineOnSurface };

  return (
    <View
      className="mt-4 flex-row items-center gap-2 rounded-[22px] border border-line-on-surface bg-surface pl-[14px] pr-2 py-2"
    >
      <View className="w-6 h-6 rounded-full overflow-hidden items-center justify-center">
        <LinearGradient
          colors={[c.heroA, c.heroB]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <Text className="font-bodyBold text-white text-[10px]">
          {userInitial}
        </Text>
      </View>
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder={t('moments.detail.comments.placeholder', {
          partner: partnerName,
        })}
        placeholderTextColor={c.inkMute}
        editable={!disabled}
        multiline={false}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
        className="flex-1 font-body text-ink text-[13px] p-0"
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel={t('moments.detail.comments.sendLabel')}
        accessibilityState={{ disabled: !canSend }}
        className="w-8 h-8 rounded-full items-center justify-center active:opacity-80"
        style={sendStyle}
      >
        <Ionicons name="send" size={12} color={canSend ? '#ffffff' : c.inkMute} />
      </Pressable>
    </View>
  );
}
