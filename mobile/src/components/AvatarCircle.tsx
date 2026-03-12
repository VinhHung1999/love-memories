import React from 'react';
import { Pressable, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Camera } from 'lucide-react-native';
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
        <FastImage
          source={{ uri, priority: FastImage.priority.normal }}
          style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 4, borderColor: '#fff' }}
          resizeMode={FastImage.resizeMode.cover}
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
          <Camera size={13} color={colors.white} strokeWidth={1.5} />
        </View>
      )}
    </Pressable>
  );
}
