import React from 'react';
import { Label } from './Typography';

export default function FieldLabel({ children }: { children: string }) {
  return (
    <Label className="text-textDark mb-[6px] tracking-[0.1px]">
      {children}
    </Label>
  );
}
