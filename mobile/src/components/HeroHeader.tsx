import React from 'react';
import { Pressable, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react-native';
import { useAppColors } from '../navigation/theme';

interface HeroHeaderProps {
  title: string;
  subtitle?: string;
  imageUri?: string;
  onBack?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  height?: number;
}

export default function HeroHeader({
  title,
  subtitle,
  imageUri,
  onBack,
  onEdit,
  onDelete,
  height = 280,
}: HeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const hasDarkBg = !!imageUri;

  const iconBg = hasDarkBg ? 'rgba(0,0,0,0.30)' : colors.textDark + '10';
  const iconColor = hasDarkBg ? '#FFFFFF' : colors.textDark;

  return (
    <View style={{ height }}>
      {/* Background */}
      {imageUri ? (
        <FastImage
          source={{ uri: imageUri, priority: FastImage.priority.high }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#FFF8F6',
            borderBottomWidth: 1,
            borderBottomColor: '#F0E6E3',
          }}
        />
      )}

      {/* Dark gradient overlay (only when image present) */}
      {imageUri && (
        <LinearGradient
          colors={['rgba(0,0,0,0.28)', 'transparent', 'rgba(0,0,0,0.40)']}
          locations={[0, 0.4, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}

      {/* Nav overlay */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top }}
        className="flex-row justify-between items-center px-4 pt-2">
        {/* Back button */}
        {onBack ? (
          <Pressable
            onPress={onBack}
            className="items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, backgroundColor: iconBg }}>
            <ArrowLeft size={20} color={iconColor} strokeWidth={1.5} />
          </Pressable>
        ) : <View style={{ width: 36 }} />}

        {/* Action buttons */}
        <View className="flex-row gap-2">
          {onEdit && (
            <Pressable
              onPress={onEdit}
              className="items-center justify-center rounded-xl"
              style={{ width: 36, height: 36, backgroundColor: iconBg }}>
              <Pencil size={18} color={iconColor} strokeWidth={1.5} />
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={onDelete}
              className="items-center justify-center rounded-xl"
              style={{ width: 36, height: 36, backgroundColor: iconBg }}>
              <Trash2 size={18} color={iconColor} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Title + subtitle at bottom-left */}
      <View
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        className="pb-4 pl-5 pr-5">
        <Text
          className="font-bold"
          style={{ fontSize: 24, color: hasDarkBg ? '#FFFFFF' : colors.textDark }}
          numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="mt-1"
            style={{ fontSize: 12, color: hasDarkBg ? 'rgba(255,255,255,0.70)' : colors.textMid }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
