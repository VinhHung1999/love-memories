import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BaseCard } from './BaseCard';

export { BaseCard };

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className: cls }: CardProps) {
  return (
    <BaseCard className={`mx-4 mb-4 px-5 pt-2 pb-3 ${cls ?? ''}`}>
      {children}
    </BaseCard>
  );
}

// ── CardTitle ─────────────────────────────────────────────────────────────────

interface CardTitleProps {
  children: string;
  action?: { label: string; onPress: () => void };
}

export function CardTitle({ children, action }: CardTitleProps) {
  return (
    <View className="flex-row items-center justify-between pt-3 pb-1">
      <Text className="text-xs font-bold text-textLight tracking-[0.8px] uppercase">
        {children}
      </Text>
      {action && (
        <Pressable onPress={action.onPress}>
          <Text className="text-xs font-semibold text-primary">{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}
