import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';

export default function HeartLogo() {
  const colors = useAppColors();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <View className="w-16 h-16 items-center justify-center mb-[10px]">
      {/* style kept: Animated.Value transform */}
      <Animated.View
        className="absolute w-16 h-16 rounded-full border-2 border-primary/30 bg-primary/[7%]"
        style={{ transform: [{ scale: pulse }] }}
      />
      <View className="w-12 h-12 rounded-full bg-primary items-center justify-center shadow-lg">
        <Icon name="heart" size={22} color={colors.white} />
      </View>
    </View>
  );
}
