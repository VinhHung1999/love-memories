import React from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';
import type { LocalPhoto } from '../useCreateMomentViewModel';

interface PhotoPickerProps {
  photos: LocalPhoto[];
  onAddFromLibrary: () => void;
  onAddFromCamera: () => void;
  onRemove: (index: number) => void;
}

export default function PhotoPicker({ photos, onAddFromLibrary, onAddFromCamera, onRemove }: PhotoPickerProps) {
  const colors = useAppColors();

  const handleAddPress = () => {
    Alert.alert('Add Photo', 'Choose source', [
      { text: 'Camera', onPress: onAddFromCamera },
      { text: 'Library', onPress: onAddFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {/* Add button */}
      {photos.length < 10 ? (
        <Pressable
          onPress={handleAddPress}
          className="rounded-xl items-center justify-center"
          style={{
            width: 72,
            height: 72,
            borderWidth: 1.5,
            borderColor: 'rgba(196,168,168,0.4)',
            borderStyle: 'dashed',
            backgroundColor: 'transparent',
          }}>
          <Icon name="plus" size={22} color={colors.textLight} />
          <Text className="text-[9px] font-medium text-textLight mt-0.5">Add</Text>
        </Pressable>
      ) : null}

      {/* Photo thumbnails */}
      {photos.map((photo, idx) => (
        <View key={`${photo.uri}-${idx}`} className="rounded-xl overflow-hidden" style={{ width: 72, height: 72 }}>
          <Image
            source={{ uri: photo.uri }}
            style={{ width: 72, height: 72, resizeMode: 'cover' }}
          />
          {/* Remove button */}
          <Pressable
            onPress={() => onRemove(idx)}
            className="absolute top-1 right-1 w-5 h-5 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(26,22,36,0.65)' }}
            hitSlop={4}>
            <Icon name="close" size={11} color="#fff" />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
