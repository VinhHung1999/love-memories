import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useUnreadCount } from '../../Notifications/useNotificationsViewModel';

interface NotificationBellProps {
  onPress: () => void;
}

export function NotificationBell({ onPress }: NotificationBellProps) {
  const count = useUnreadCount();
  return (
    <Pressable onPress={onPress} className="w-9 h-9 items-center justify-center">
      <Bell size={22} color="#fff" strokeWidth={1.5} />
      {count > 0 && (
        <View
          className="absolute top-0.5 right-0.5 bg-error rounded-full items-center justify-center"
          style={{ minWidth: 14, height: 14, paddingHorizontal: 3 }}>
          <Text className="text-white text-[9px] font-heading leading-none">
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
