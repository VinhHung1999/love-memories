import React from 'react';
import { Pressable, View } from 'react-native';
import { BaseCard } from './BaseCard';
import { Caption, Label } from './Typography';

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
      <Caption className="tracking-[0.8px] uppercase">
        {children}
      </Caption>
      {action && (
        <Pressable onPress={action.onPress}>
          <Label className="text-primary">{action.label}</Label>
        </Pressable>
      )}
    </View>
  );
}
