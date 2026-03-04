import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAppColors } from '../navigation/theme';
import t from '../locales/en';

interface TagInputProps {
  tags: string[];
  tagInput: string;
  onChangeTagInput: (text: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

export default function TagInput({ tags, tagInput, onChangeTagInput, onAddTag, onRemoveTag }: TagInputProps) {
  const colors = useAppColors();

  return (
    <View className="flex-row flex-wrap gap-2 rounded-xl p-3 min-h-[44px] items-center bg-textDark/4">
      {tags.map(tag => (
        <Pressable
          key={tag}
          onPress={() => onRemoveTag(tag)}
          className="flex-row items-center gap-1 px-3 py-[3px] rounded-lg bg-primary/12">
          <Text className="text-xs font-medium text-primary">{tag}</Text>
          <Text className="text-[10px] text-primary opacity-60">×</Text>
        </Pressable>
      ))}
      <TextInput
        className="text-[13px] text-textDark flex-1 min-w-[120px]"
        placeholder={t.moments.create.typeTag}
        placeholderTextColor={colors.textLight}
        value={tagInput}
        onChangeText={onChangeTagInput}
        onSubmitEditing={onAddTag}
        blurOnSubmit={false}
        returnKeyType="done"
      />
    </View>
  );
}
