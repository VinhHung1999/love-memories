import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/theme/ThemeProvider';

// T401 (Sprint 63) — sticky reply bar at MomentDetail bottom. Prototype
// moments.jsx L672-696: rounded pill with input + circular send button.
// KeyboardAvoidingView on iOS keeps the bar above the keyboard
// (behavior='padding'); Android uses undefined (system handles via
// adjustResize from AndroidManifest softInputMode).
//
// Lives OUTSIDE the ScrollView so it stays pinned while the user scrolls
// through comments. Safe-area bottom inset padded in so it doesn't sit
// under the home indicator.

type Props = {
  onSend: (content: string) => Promise<boolean>;
  disabled?: boolean;
  posting?: boolean;
};

export function ReplyBar({ onSend, disabled, posting }: Props) {
  const { t } = useTranslation();
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  const trimmed = text.trim();
  const canSend = !disabled && !posting && trimmed.length > 0;

  const handleSend = async () => {
    if (!canSend) return;
    const content = trimmed;
    setText('');
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View
        className="px-4 pt-2 border-t border-line-on-surface bg-bg"
        style={{ paddingBottom: Math.max(insets.bottom, 10) }}
      >
        <View className="flex-row items-center gap-2 h-11 rounded-full bg-surface border border-line-on-surface pl-4 pr-1.5">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('moments.detail.comments.placeholder')}
            placeholderTextColor={c.inkMute}
            editable={!disabled}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            className="flex-1 font-body text-ink text-[14px] h-full"
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
            <Ionicons name="send" size={14} color={canSend ? '#ffffff' : c.inkMute} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
