import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Bell, X } from 'lucide-react-native';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { AppNotification } from '../../lib/api';
import { useNotificationsViewModel } from './useNotificationsViewModel';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';

// ── Type emoji map ─────────────────────────────────────────────────────────

const TYPE_EMOJI: Record<string, string> = {
  moment: '💕',
  foodspot: '🍜',
  goal: '🎯',
  recipe: '🍳',
  cooking: '🍳',
  weekly_recap: '📊',
  monthly_recap: '📅',
  achievement: '🏆',
  letter: '💌',
  reminder: '⏰',
  system: '🔔',
};

function getEmoji(type: string): string {
  return TYPE_EMOJI[type] ?? '🔔';
}

// ── Relative time ──────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <View className="bg-white mx-4 mb-2 rounded-2xl px-4 py-3.5 flex-row items-start gap-3">
      <Skeleton className="w-9 h-9 rounded-2xl" />
      <View className="flex-1">
        <Skeleton className="w-3/4 h-3.5 rounded-md mb-1.5" />
        <Skeleton className="w-full h-2.5 rounded-md mb-1" />
        <Skeleton className="w-1/3 h-2 rounded-md mt-1" />
      </View>
    </View>
  );
}

// ── Notification Row ───────────────────────────────────────────────────────

function NotificationRow({
  item,
  onPress,
  onDelete,
}: {
  item: AppNotification;
  onPress: () => void;
  onDelete: () => void;
}) {
  const colors = useAppColors();
  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Pressable
        onPress={onPress}
        className="mb-2 mx-4 rounded-2xl overflow-hidden flex-row"
        style={{ opacity: item.read ? 0.7 : 1 }}>
        {/* Left unread accent bar */}
        {!item.read && <View className="w-[3px] bg-primary self-stretch" />}

        <View className={`flex-1 flex-row items-start gap-3 px-4 py-3.5 bg-white`}>
          {/* Emoji badge */}
          <View className="w-9 h-9 rounded-2xl bg-primary/10 items-center justify-center flex-shrink-0 mt-0.5">
            <Text className="text-base">{getEmoji(item.type)}</Text>
          </View>

          {/* Text */}
          <View className="flex-1">
            <Text
              className="text-sm leading-snug"
              style={{ fontWeight: item.read ? '500' : '600', color: item.read ? colors.textMid : colors.textDark }}
              numberOfLines={2}>
              {item.title}
            </Text>
            <Text className="text-xs text-textMid mt-0.5 leading-relaxed" numberOfLines={2}>
              {item.message}
            </Text>
            <Text className="text-[10px] text-textLight mt-1.5 font-medium">
              {relativeTime(item.createdAt)}
            </Text>
          </View>

          {/* Unread dot + delete */}
          <View className="items-center gap-2 ml-1">
            {!item.read && <View className="w-2 h-2 rounded-full bg-primary mt-1" />}
            <Pressable onPress={onDelete} hitSlop={8} className="mt-1">
              <X size={14} color={colors.textLight} strokeWidth={1.5} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────

const GROUP_LABELS: Record<string, string> = {
  today: t.notifications.today,
  yesterday: t.notifications.yesterday,
  earlier: t.notifications.earlier,
};

export default function NotificationsScreen() {
  const colors = useAppColors();
  const vm = useNotificationsViewModel();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  return (
    <View className="flex-1 bg-gray-50">
      <CollapsibleHeader
        title={t.notifications.title}
        subtitle={t.notifications.subtitle}
        scrollY={scrollY}
        renderRight={() =>
          vm.hasUnread ? (
            <Pressable onPress={vm.handleMarkAll} className="py-1">
              <Text className="text-sm font-semibold text-primary">{t.notifications.markAll}</Text>
            </Pressable>
          ) : null
        }
      />

      {vm.isLoading ? (
        <ScrollView scrollEnabled={false} className="flex-1">
          <View className="pt-14 pb-[100px]">
            {[0, 1, 2, 3, 4].map(i => <NotificationSkeleton key={i} />)}
          </View>
        </ScrollView>
      ) : vm.grouped.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t.notifications.emptyTitle}
          subtitle={t.notifications.emptySubtitle}
        />
      ) : (
        <Animated.ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={vm.refetch}
              tintColor={colors.primary}
            />
          }>
          <View key={vm.grouped.map(g => g.items.map(i => i.id).join(',')).join('|')} className="pt-14 pb-[100px]">
            {vm.grouped.map(group => (
              <View key={group.label}>
                <Text className="text-[11px] font-bold text-textLight tracking-[1px] uppercase px-5 pt-4 pb-2">
                  {GROUP_LABELS[group.label] ?? group.label}
                </Text>
                {group.items.map(item => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onPress={() => vm.handleNotificationPress(item)}
                    onDelete={() => vm.handleDelete(item.id)}
                  />
                ))}
              </View>
            ))}
          </View>
        </Animated.ScrollView>
      )}
    </View>
  );
}
