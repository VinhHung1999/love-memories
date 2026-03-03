import React from 'react';
import { Text } from 'react-native';

export default function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="text-[13px] font-semibold text-textDark mb-[6px] tracking-[0.1px]">
      {children}
    </Text>
  );
}
