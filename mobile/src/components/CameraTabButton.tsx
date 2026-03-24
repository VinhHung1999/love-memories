import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Camera } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { launchCamera } from 'react-native-image-picker';
import CreateMomentSheet from '../screens/CreateMoment/CreateMomentSheet';

const BUTTON_SIZE = 64;
const FLOAT_OFFSET = 28;

export default function CameraTabButton(_props: BottomTabBarButtonProps) {
  const navigation = useNavigation<any>();

  // ── Subtle pulse: 1.0 → 1.04 → 1.0 over 3s loop ──
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0,  { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0,  { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    const result = await launchCamera({ mediaType: 'photo', saveToPhotos: false });
    if (result.didCancel || !result.assets?.[0]) return;
    const photo = result.assets[0];
    // Push onto AppStack (parent of MainTabs) so we don't switch tabs away from current screen
    const appStack = navigation.getParent();
    if (appStack) {
      appStack.push('BottomSheet', {
        screen: CreateMomentSheet,
        props: { initialPhoto: { uri: photo.uri!, mimeType: photo.type ?? 'image/jpeg' } },
      });
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -FLOAT_OFFSET,
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            borderRadius: BUTTON_SIZE / 2,
            shadowColor: '#E8788A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 8,
          },
          animStyle,
        ]}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => ({
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            borderRadius: BUTTON_SIZE / 2,
            overflow: 'hidden',
            opacity: pressed ? 0.88 : 1,
          })}>
          <LinearGradient
            colors={['#F4A0B0', '#E8788A']}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={{ flex: 1, borderRadius: BUTTON_SIZE / 2 }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={28} color="#FFFFFF" strokeWidth={1.8} />
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}
