import React from 'react';
import { View } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  edges?: Edge[];
  className?: string;
};

export function SafeScreen({ children, edges = ['top', 'bottom'], className }: Props) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-bg">
      <View className={`flex-1 ${className ?? ''}`}>{children}</View>
    </SafeAreaView>
  );
}
