import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Send } from 'lucide-react-native';
import Input from './Input';
import { useAppColors } from '../navigation/theme';

interface CommentInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  placeholder?: string;
}

export default function CommentInput({
  value,
  onChangeText,
  onSubmit,
  isSubmitting,
  placeholder,
}: CommentInputProps) {
  const colors = useAppColors();
  const canSubmit = value.trim().length > 0 && !isSubmitting;
  const sendScale = useSharedValue(1);

  const sendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handlePress = () => {
    if (!canSubmit) return;
    sendScale.value = withSequence(
      withTiming(0.88, { duration: 100 }),
      withSpring(1.0, { damping: 15, stiffness: 300 }),
    );
    onSubmit();
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
      <View style={{ flex: 1 }}>
        <Input
          multiline
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          maxLength={500}
          style={{ maxHeight: 96 }}
        />
      </View>
      {/* marginBottom: 10 compensates for Input's built-in mb-[10px] wrapper */}
      <Animated.View style={[sendStyle, { marginBottom: 10 }]}>
        <Pressable onPress={handlePress} disabled={!canSubmit}>
          <LinearGradient
            colors={
              canSubmit
                ? [colors.primary, colors.primaryLight]
                : ['rgba(232,120,138,0.30)', 'rgba(242,165,176,0.30)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={18} strokeWidth={2} color="#fff" />
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}
