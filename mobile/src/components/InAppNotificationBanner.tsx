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

  // Slide animation
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

    // Auto-dismiss after 4 seconds
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
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY }],
        // Shadow
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
        elevation: 20,
        borderRadius: 16,
        backgroundColor: colors.bgCard,
      }}>
      <Pressable onPress={handlePress}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 14,
            gap: 10,
            borderRadius: 16,
            backgroundColor: colors.bgCard,
            borderWidth: 1,
            borderColor: colors.borderSoft,
          }}>
          {/* App icon placeholder — pink circle with heart emoji */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
            <Text style={{ fontSize: 18 }}>💌</Text>
          </View>

          {/* Text content */}
          <View style={{ flex: 1, gap: 1 }}>
            <Label
              className="text-textDark"
              style={{ color: colors.textDark, fontFamily: 'BeVietnamPro-SemiBold', fontSize: 13 }}>
              {notification.title}
            </Label>
            {notification.body ? (
              <Caption
                numberOfLines={1}
                style={{ color: colors.textMid, fontSize: 12 }}>
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
            style={{
              width: 24,
              height: 24,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
            <X size={14} color={colors.textLight} strokeWidth={2} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}
