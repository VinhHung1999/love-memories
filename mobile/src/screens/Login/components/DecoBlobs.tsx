import React from 'react';
import { View } from 'react-native';

// top-[40%] replaces SCREEN_HEIGHT * 0.4 — parent is flex-1 (full screen), so 40% ≈ same result
export default function DecoBlobs() {
  return (
    <>
      <View className="absolute w-[300px] h-[300px] -top-[100px] -right-[70px] rounded-full bg-primary/[13%]" />
      <View className="absolute w-[240px] h-[240px] -bottom-[80px] -left-[70px] rounded-full bg-secondary/[11%]" />
      <View className="absolute w-[140px] h-[140px] top-[40%] -left-[50px] rounded-full bg-accent/10" />
    </>
  );
}
