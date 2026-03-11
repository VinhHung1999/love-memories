import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUnreadCount } from '../../Notifications/useNotificationsViewModel';

interface NotificationBellProps {
  onPress: () => void;
}

export function NotificationBell({ onPress }: NotificationBellProps) {
  const count = useUnreadCount();
  return (
    <Pressable onPress={onPress} className="w-9 h-9 items-center justify-center">
      <Icon name={count > 0 ? 'bell' : 'bell-outline'} size={22} color="#fff" />
      {count > 0 && (
        <View
          className="absolute top-0.5 right-0.5 bg-error rounded-full items-center justify-center"
          style={{ minWidth: 14, height: 14, paddingHorizontal: 3 }}>
          <Text className="text-white text-[9px] font-bold leading-none">
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
