import React from 'react';
import { Pressable, View } from 'react-native';
import { Caption } from '../../../components/Typography';
import { Bell } from 'lucide-react-native';
import { useUnreadCount } from '../../Notifications/useNotificationsViewModel';
import { useAppColors } from '@/navigation/theme';

interface NotificationBellProps {
  onPress: () => void;
}

export function NotificationBell({ onPress }: NotificationBellProps) {
  const count = useUnreadCount();
  const colors = useAppColors();
  return (
    <Pressable onPress={onPress} className="w-9 h-9 items-center justify-center">
      <Bell size={22} strokeWidth={1.5}  color={colors.textMid}/>
      {count > 0 && (
        <View
          className="absolute top-0.5 right-0.5 bg-error rounded-full items-center justify-center"
          style={{ minWidth: 14, height: 14, paddingHorizontal: 3 }}>
          <Caption className="text-white font-heading leading-none">
            {count > 99 ? '99+' : count}
          </Caption>
        </View>
      )}
    </Pressable>
  );
}
