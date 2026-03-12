import React from 'react';
import { View } from 'react-native';

/**
 * BaseCard - Minimal card container with only border/background/shadow
 * Use this when you need card style but want to control layout yourself
 */

interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
}

export function BaseCard({ children, className: cls }: BaseCardProps) {
  return (
    <View className={`bg-white rounded-xl border border-borderSoft shadow-sm ${cls ?? ''}`}>
      {children}
    </View>
  );
}
