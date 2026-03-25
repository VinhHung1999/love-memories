import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppColors } from '../navigation/theme';
import { Label, Caption } from './Typography';
import { handleNotificationNavigation } from '../lib/pushNotifications';
import type { InAppNotification } from '../lib/InAppNotificationContext';

// ── Props ─────────────────────────────────────────────────────────────────────

interface InAppNotificationBannerProps {
  notification: InAppNotification;
  onDismiss: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InAppNotificationBanner({
  notification,
  onDismiss,
}: InAppNotificationBannerProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // Slide animation — Animated.Value transform requires style prop (exception)
  const translateY = useRef(new Animated.Value(-120)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mount: slide in
  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      stiffness: 300,
      damping: 20,
      useNativeDriver: true,
    }).start();

    dismissTimer.current = setTimeout(() => {
      handleDismiss();
    }, 4000);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    Animated.timing(translateY, {
      toValue: -120,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    handleNotificationNavigation(navigation, notification.data);
    handleDismiss();
  };

  return (
    <Animated.View
      className="absolute left-4 right-4 z-[9999] rounded-2xl shadow-lg bg-bgCard dark:bg-darkBgCard border border-border dark:border-darkBorder"
      style={{
        // top requires dynamic safe-area calc — style exception allowed
        top: insets.top + 8,
        // transform requires Animated.Value — style exception allowed
        transform: [{ translateY }],
      }}>
      <Pressable onPress={handlePress}>
        <View className="flex-row items-center p-[14px] gap-[10px]">
          {/* App icon — pink circle with mail emoji */}
          <View className="w-9 h-9 rounded-full items-center justify-center bg-primary/10 shrink-0">
            <Text style={{ fontSize: 18 }}>💌</Text>
          </View>

          {/* Text content */}
          <View className="flex-1 gap-[2px]">
            <Label className="text-textDark dark:text-darkTextDark font-semibold text-[13px]">
              {notification.title}
            </Label>
            {notification.body ? (
              <Caption
                numberOfLines={1}
                className="text-textMid dark:text-darkTextMid text-[12px]">
                {notification.body}
              </Caption>
            ) : null}
          </View>

          {/* Dismiss button */}
          <Pressable
            onPress={e => {
              e.stopPropagation();
              handleDismiss();
            }}
            hitSlop={8}
            className="w-6 h-6 items-center justify-center shrink-0">
            <X size={14} color={colors.textLight} strokeWidth={2} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}
