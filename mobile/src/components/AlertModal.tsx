import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../navigation/theme';
import t from '../locales/en';

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

const ICON_CONFIG = {
  info:        { name: 'information',  isError: false },
  error:       { name: 'alert-circle', isError: true  },
  confirm:     { name: 'help-circle',  isError: false },
  destructive: { name: 'trash-can',    isError: true  },
} as const;

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
        <Pressable className="bg-white rounded-3xl w-full p-6" onPress={() => {}}>

          {/* Icon */}
          <View
            className={`w-16 h-16 rounded-full items-center justify-center self-center mb-4 ${
              icon.isError ? 'bg-red-50' : 'bg-primary/12'
            }`}>
            <Icon
              name={icon.name}
              size={32}
              color={icon.isError ? colors.errorColor : colors.primary}
            />
          </View>

          {/* Title */}
          <Text className="text-lg font-bold text-textDark text-center mb-2">{title}</Text>

          {/* Message */}
          {message ? (
            <Text className="text-sm text-textMid text-center mb-6 leading-relaxed">{message}</Text>
          ) : (
            <View className="mb-4" />
          )}

          {/* Buttons */}
          <View className={`gap-2 ${hasCancel ? 'flex-row' : ''}`}>
            {hasCancel && (
              <Pressable
                onPress={handleCancel}
                className="flex-1 py-3 rounded-2xl border border-border items-center">
                <Text className="text-sm font-semibold text-textMid">
                  {cancelLabel ?? t.common.cancel}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleConfirm}
              className={`${hasCancel ? 'flex-1' : 'w-full'} py-3 rounded-2xl items-center ${
                isDestructive ? 'bg-red-500' : 'bg-primary'
              }`}>
              <Text className="text-sm font-semibold text-white">
                {confirmLabel ?? t.common.ok}
              </Text>
            </Pressable>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}
