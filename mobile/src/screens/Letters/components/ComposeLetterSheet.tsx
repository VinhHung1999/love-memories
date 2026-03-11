import React, { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';
import AppBottomSheet from '../../../components/AppBottomSheet';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import FieldLabel from '../../../components/FieldLabel';
import ErrorBox from '../../../components/ErrorBox';
import { useComposeLetterViewModel, MOODS } from './useComposeLetterViewModel';
import type { LoveLetter } from '../../../types';

const MOOD_EMOJI: Record<string, string> = {
  love: '❤️', happy: '😊', miss: '🥺', grateful: '🙏', playful: '😄', romantic: '🌹',
};

export default function ComposeLetterSheet({
  onClose,
  initialLetter,
}: {
  onClose: () => void;
  initialLetter?: LoveLetter;
}) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const colors = useAppColors();
  const vm = useComposeLetterViewModel(onClose, initialLetter);

  useEffect(() => { sheetRef.current?.present(); }, []);

  return (
    <AppBottomSheet
      ref={sheetRef}
      scrollable
      title={initialLetter ? t.loveLetters.editTitle : t.loveLetters.composeTitle}
      showHeader={false}
      onDismiss={onClose}>

      <View className="px-5 pb-10 pt-4">
        {/* Manual title */}
        <Text className="text-base font-bold text-textDark mb-4">
          {initialLetter ? t.loveLetters.editTitle : t.loveLetters.composeTitle}
        </Text>

        {vm.error ? <ErrorBox message={vm.error} /> : null}

        {/* Title */}
        <View className="mb-4">
          <FieldLabel>{t.loveLetters.titleLabel}</FieldLabel>
          <Input
            value={vm.title}
            onChangeText={vm.setTitle}
            placeholder={t.loveLetters.titlePlaceholder}
            returnKeyType="next"
          />
        </View>

        {/* Content */}
        <View className="mb-4">
          <FieldLabel>{t.loveLetters.contentLabel}</FieldLabel>
          <Input
            value={vm.content}
            onChangeText={vm.setContent}
            placeholder={t.loveLetters.contentPlaceholder}
            multiline
            numberOfLines={8}
            style={{ minHeight: 160, textAlignVertical: 'top' }}
          />
        </View>

        {/* Mood picker */}
        <View className="mb-6">
          <FieldLabel>{t.loveLetters.moodLabel}</FieldLabel>
          <View className="flex-row gap-2 flex-wrap mt-1">
            {MOODS.map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => vm.setMood(m)}
                className="items-center justify-center rounded-2xl px-2 py-2 gap-0.5"
                style={{
                  minWidth: 52,
                  backgroundColor: vm.mood === m ? colors.primaryMuted : colors.gray100,
                  borderWidth: 2,
                  borderColor: vm.mood === m ? colors.primary : 'transparent',
                }}>
                <Text className="text-2xl">{MOOD_EMOJI[m]}</Text>
                <Text
                  className="text-[10px] font-semibold capitalize"
                  style={{ color: vm.mood === m ? colors.primary : colors.textLight }}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row gap-3">
          <Button
            label={vm.isSaving ? t.loveLetters.saving : t.loveLetters.saveDraft}
            onPress={vm.saveDraft}
            variant="outline"
            disabled={!vm.isValid || vm.isSaving || vm.isSending}
          />
          <Button
            label={vm.isSending ? t.loveLetters.sending : t.loveLetters.sendNow}
            onPress={vm.sendNow}
            disabled={!vm.isValid || vm.isSaving || vm.isSending}
          />
        </View>
      </View>
    </AppBottomSheet>
  );
}
