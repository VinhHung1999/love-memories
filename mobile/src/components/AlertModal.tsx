import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { AlertCircle, HelpCircle, Info, Trash2 } from 'lucide-react-native';
import { useAppColors } from '../navigation/theme';
import t from '../locales/en';
import { Body, Heading, Label } from './Typography';

// ── AlertConfig — exported for ViewModel alert state ─────────────────────────

export interface AlertConfig {
  visible: boolean;
  title: string;
  message?: string;
  type?: 'info' | 'error' | 'confirm' | 'destructive';
  confirmLabel?: string;
  onConfirm?: () => void | Promise<void>;
}

// ── AlertModal Props ──────────────────────────────────────────────────────────

interface AlertModalProps extends AlertConfig {
  cancelLabel?: string;
  onCancel?: () => void;
  onDismiss?: () => void;
}

// ── Icon config per type ──────────────────────────────────────────────────────

const ICON_CONFIG: Record<string, { icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; isError: boolean }> = {
  info:        { icon: Info,         isError: false },
  error:       { icon: AlertCircle,  isError: true  },
  confirm:     { icon: HelpCircle,   isError: false },
  destructive: { icon: Trash2,       isError: true  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AlertModal({
  visible,
  title,
  message,
  type = 'info',
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  onDismiss,
}: AlertModalProps) {
  const colors = useAppColors();
  const icon = ICON_CONFIG[type];
  const isDestructive = type === 'destructive';
  const hasCancel = type === 'confirm' || type === 'destructive';

  const handleBackdropPress = () => onDismiss?.();
  const handleCancel = () => { onCancel?.(); onDismiss?.(); };
  const handleConfirm = async () => { await onConfirm?.(); onDismiss?.(); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleBackdropPress}>
      {/* Full-screen backdrop — tap to dismiss */}
      <Pressable
        className="flex-1 bg-black/40 items-center justify-center px-8"
        onPress={handleBackdropPress}>
        {/* Card — absorbs tap to prevent backdrop dismiss */}
        <Pressable className="bg-white dark:bg-darkBgCard rounded-3xl w-full p-6" onPress={() => {}}>

          {/* Icon */}
          <View
            className="w-16 h-16 rounded-full items-center justify-center self-center mb-4"
            style={{ backgroundColor: icon?.isError ? colors.errorBg : colors.primaryMuted }}>
            {icon ? <icon.icon size={32} color={icon.isError ? colors.errorColor : colors.primary} strokeWidth={1.5} /> : null}
          </View>

          {/* Title */}
          <Heading size="md" className="text-textDark dark:text-darkTextDark text-center mb-2">{title}</Heading>

          {/* Message */}
          {message ? (
            <Body className="text-textMid dark:text-darkTextMid text-center mb-6 leading-relaxed">{message}</Body>
          ) : (
            <View className="mb-4" />
          )}

          {/* Buttons */}
          <View className="gap-2" style={{ flexDirection: hasCancel ? 'row' : 'column' }}>
            {hasCancel && (
              <Pressable
                onPress={handleCancel}
                className="flex-1 py-3 rounded-2xl border border-border dark:border-darkBorder items-center">
                <Label className="font-semibold text-textMid dark:text-darkTextMid">
                  {cancelLabel ?? t.common.cancel}
                </Label>
              </Pressable>
            )}
            <Pressable
              onPress={handleConfirm}
              className="py-3 rounded-2xl items-center"
              style={{ flex: hasCancel ? 1 : undefined, width: hasCancel ? undefined : '100%', backgroundColor: isDestructive ? colors.errorColor : colors.primary }}>
              <Label className="font-semibold" style={{ color: '#FFFFFF' }}>
                {confirmLabel ?? t.common.ok}
              </Label>
            </Pressable>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}
