import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAppColors } from '../navigation/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export default function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0E6E3',
        shadowColor: '#E8788A',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}>
      <View className="flex-row items-center px-4 gap-3" style={{ height: 56 }}>
        {onBack && (
          <Pressable
            onPress={onBack}
            className="items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, backgroundColor: colors.textDark + '10' }}>
            <ArrowLeft size={20} color={colors.textDark} strokeWidth={1.5} />
          </Pressable>
        )}
        <View className="flex-1">
          <Text className="font-bold text-textDark" style={{ fontSize: 18 }} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-textMid font-medium" style={{ fontSize: 12 }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
}
