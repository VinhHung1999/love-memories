import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../navigation/theme';

interface AvatarCircleProps {
  uri?: string | null;
  initials: string;
  size?: number;              // default 48
  onPress?: () => void;
  showCameraBadge?: boolean;  // default false
}

export default function AvatarCircle({
  uri,
  initials,
  size = 48,
  onPress,
  showCameraBadge = false,
}: AvatarCircleProps) {
  const colors = useAppColors();

  return (
    <Pressable onPress={onPress} className="relative">
      {uri ? (
        <Image
          source={{ uri }}
          className="rounded-full border-4 border-white"
          style={{ width: size, height: size }}
        />
      ) : (
        <View
          className="rounded-full bg-primary/[12%] border-4 border-white items-center justify-center"
          style={{ width: size, height: size }}>
          <Text className="font-bold text-primary" style={{ fontSize: size * 0.3 }}>
            {initials}
          </Text>
        </View>
      )}
      {showCameraBadge && (
        <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary items-center justify-center border-2 border-white">
          <Icon name="camera" size={13} color={colors.white} />
        </View>
      )}
    </Pressable>
  );
}
