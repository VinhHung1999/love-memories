import React, { useEffect, useRef } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { ChevronLeft, ChevronRight, Heart, ImageIcon, Plus } from 'lucide-react-native';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { Moment } from '../../types';
import { useMomentsViewModel } from './useMomentsViewModel';
import ListHeader from '../../components/ListHeader';
import { Label, Caption } from '../../components/Typography';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';
import CreateMomentSheet from '../CreateMoment/CreateMomentSheet';

// ── Design constants ──────────────────────────────────────────────────────────

const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const TIMELINE_LEFT_W = 56;
const MINI_CARD_W = 100;
const MINI_CARD_H = 120;
const MINI_CARD_PHOTO_H = 75;
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function MomentsLoadingSkeleton() {
  return (
    <ScrollView scrollEnabled={false} className="flex-1">
      <View className="bg-white border-b border-borderSoft px-4 py-3">
        <View className="flex-row justify-between items-center mb-3">
          <Skeleton className="w-8 h-8 rounded-xl" />
          <Skeleton className="w-28 h-4 rounded-md" />
          <Skeleton className="w-8 h-8 rounded-xl" />
        </View>
        <View className="flex-row mb-1">
          {Array(7).fill(null).map((_, i) => (
            <View key={i} className="flex-1 items-center">
              <Skeleton className="w-4 h-2.5 rounded-sm" />
            </View>
          ))}
        </View>
        {[0, 1, 2, 3].map(row => (
          <View key={row} className="flex-row mb-1">
            {Array(7).fill(null).map((_, i) => (
              <View key={i} className="flex-1 items-center py-0.5">
                <Skeleton className="w-7 h-7 rounded-full" />
              </View>
            ))}
          </View>
        ))}
      </View>
      <View className="px-4 pt-4">
        {[0, 1].map(i => (
          <View key={i} className="flex-row mb-5">
            <View style={{ width: TIMELINE_LEFT_W }} className="items-center">
              <Skeleton className="w-3 h-3 rounded-full mb-1" />
              <Skeleton className="w-8 h-2.5 rounded-sm" />
            </View>
            <View className="flex-row gap-2">
              <View style={{ width: MINI_CARD_W, height: MINI_CARD_H }}>
                <Skeleton className="w-full h-full rounded-2xl" />
              </View>
              <View style={{ width: MINI_CARD_W, height: MINI_CARD_H }}>
                <Skeleton className="w-full h-full rounded-2xl" />
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Month Calendar ────────────────────────────────────────────────────────────

function MonthCalendar({
  cells,
  daysWithMoments,
  selectedDay,
  selectedMonth,
  todayStr,
  onDayPress,
  onPrevMonth,
  onNextMonth,
  onLayout,
}: {
  cells: (number | null)[];
  daysWithMoments: Set<string>;
  selectedDay: string | null;
  selectedMonth: { year: number; month: number };
  todayStr: string;
  onDayPress: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onLayout: (height: number) => void;
}) {
  const colors = useAppColors();
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <View
      className="bg-white border-b border-borderSoft px-4 py-3"
      onLayout={e => onLayout(e.nativeEvent.layout.height)}>

      {/* Month nav row */}
      <View className="flex-row justify-between items-center mb-3">
        <Pressable
          onPress={onPrevMonth}
          className="w-8 h-8 rounded-xl items-center justify-center"
          style={{ backgroundColor: colors.textDark + '0F' }}>
          <ChevronLeft size={16} color={colors.textDark} strokeWidth={1.5} />
        </Pressable>
        <Label className="text-[15px] text-textDark">
          {MONTH_NAMES[selectedMonth.month]} {selectedMonth.year}
        </Label>
        <Pressable
          onPress={onNextMonth}
          className="w-8 h-8 rounded-xl items-center justify-center"
          style={{ backgroundColor: colors.textDark + '0F' }}>
          <ChevronRight size={16} color={colors.textDark} strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Day headers */}
      <View className="flex-row mb-1">
        {DAY_HEADERS.map(h => (
          <View key={h} className="flex-1 items-center">
            <Caption className="text-textLight font-body" style={{ letterSpacing: 0.5 }}>
              {h}
            </Caption>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {rows.map((row, ri) => (
        <View key={ri} className="flex-row">
          {row.map((day, ci) => {
            if (!day) return <View key={ci} className="flex-1" />;
            const dateStr = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasM = daysWithMoments.has(dateStr);
            const isToday = dateStr === todayStr;
            const isSel = dateStr === selectedDay;

            const cellBg = isSel
              ? colors.primary
              : isToday
              ? colors.primary + '1A'
              : 'transparent';
            const textColor = isSel ? '#fff' : isToday ? colors.primary : colors.textDark;

            return (
              <Pressable key={ci} onPress={() => onDayPress(day)} className="flex-1 items-center py-0.5">
                <View
                  className="w-7 h-7 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: cellBg,
                    shadowColor: isSel ? colors.primary : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isSel ? 0.3 : 0,
                    shadowRadius: 4,
                  }}>
                  <Caption
                    className="font-body"
                    style={{ color: textColor, fontWeight: isToday || isSel ? '600' : '500', fontSize: 13 }}>
                    {day}
                  </Caption>
                </View>
                {/* Moment heart indicator */}
                {hasM ? (
                  <Heart size={7} color={colors.primary} fill={colors.primary} strokeWidth={0} style={{ marginTop: 2 }} />
                ) : (
                  <View style={{ width: 7, height: 7, marginTop: 2 }} />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ── Moment Mini Card ──────────────────────────────────────────────────────────

function MomentMiniCard({ moment, onPress }: { moment: Moment; onPress: () => void }) {
  const colors = useAppColors();
  const cover = moment.photos[0];

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl overflow-hidden border border-borderSoft bg-white"
      style={{ width: MINI_CARD_W, height: MINI_CARD_H }}>
      {cover ? (
        <FastImage
          source={{ uri: cover.url, priority: FastImage.priority.normal }}
          style={{ width: MINI_CARD_W, height: MINI_CARD_PHOTO_H }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View
          className="items-center justify-center"
          style={{ width: MINI_CARD_W, height: MINI_CARD_PHOTO_H, backgroundColor: colors.primary + '1A' }}>
          <ImageIcon size={16} color={colors.primary} strokeWidth={1.5} />
        </View>
      )}
      <View className="px-2 py-1.5" style={{ height: MINI_CARD_H - MINI_CARD_PHOTO_H }}>
        <Caption
          className="text-textDark"
          style={{ fontWeight: '600', lineHeight: 15, fontSize: 11 }}
          numberOfLines={2}>
          {moment.title}
        </Caption>
      </View>
    </Pressable>
  );
}

// ── Timeline Day Group ────────────────────────────────────────────────────────

function TimelineDayGroup({
  group,
  onMomentPress,
}: {
  group: { dateStr: string; label: string; moments: Moment[] };
  isLast?: boolean;
  onMomentPress: (id: string) => void;
}) {
  const colors = useAppColors();

  return (
    <View className="flex-row py-3" style={{ paddingLeft: 16 }}>
      {/* Left: vertical spine + dot + date label */}
      <View style={{ width: TIMELINE_LEFT_W }} className="items-center">
        {/* Spine: stops at dot (height = marginTop(2) + dot height(10)) */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: TIMELINE_LEFT_W / 2 - 1,
            width: 1,
            height: 12,
            backgroundColor: colors.border,
          }}
        />
        {/* Dot */}
        <View
          className="rounded-full"
          style={{ width: 10, height: 10, backgroundColor: colors.primary, marginTop: 2, zIndex: 1 }}
        />
        {/* Date — below dot, not crossed by spine */}
        <Caption className="text-textLight font-body mt-1 text-center" style={{ letterSpacing: 0.3 }}>
          {group.label}
        </Caption>
      </View>

      {/* Right: horizontal moment card row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16, gap: 6 }}
        style={{ flex: 1 }}>
        {group.moments.map(m => (
          <MomentMiniCard key={m.id} moment={m} onPress={() => onMomentPress(m.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MomentsScreen() {
  const colors = useAppColors();
  const navigation = useAppNavigation();
  const vm = useMomentsViewModel();

  const timelineScrollRef = useRef<ScrollView>(null);
  const dayOffsets = useRef<Record<string, number>>({});
  const calendarHeight = useRef(0);

  const openCreateForm = () => navigation.showBottomSheet(CreateMomentSheet);

  // Scroll to selected day in timeline
  useEffect(() => {
    if (!vm.selectedDay) return;
    const offset = dayOffsets.current[vm.selectedDay];
    if (offset !== undefined) {
      timelineScrollRef.current?.scrollTo({
        y: calendarHeight.current + offset,
        animated: true,
      });
    }
  }, [vm.selectedDay]);

  return (
    <View className="flex-1 bg-baseBg">
      <ListHeader
        title={t.moments.title}
        subtitle={t.moments.subtitle}
        right={
          <TouchableOpacity
            onPress={openCreateForm}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}>
            <Plus size={22} color="#fff" strokeWidth={1.5} />
          </TouchableOpacity>
        }
      />

      {vm.isLoading ? (
        <MomentsLoadingSkeleton />
      ) : (
        <ScrollView
          ref={timelineScrollRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.handleRefresh}
              tintColor={colors.primary}
            />
          }>

          {/* Calendar — scrolls with content */}
          <MonthCalendar
            cells={vm.calendarCells}
            daysWithMoments={vm.daysWithMoments}
            selectedDay={vm.selectedDay}
            selectedMonth={vm.selectedMonth}
            todayStr={vm.todayStr}
            onDayPress={vm.handleDayPress}
            onPrevMonth={vm.goToPrevMonth}
            onNextMonth={vm.goToNextMonth}
            onLayout={h => { calendarHeight.current = h; }}
          />

          {/* Timeline or empty */}
          {vm.isEmpty ? (
            <View className="pt-10 pb-[100px]">
              <EmptyState
                icon={Heart}
                title={t.moments.emptyTitle}
                subtitle={t.moments.emptySubtitle}
                actionLabel={t.moments.emptyAction}
                onAction={openCreateForm}
              />
            </View>
          ) : (
            <View className="pb-[100px] pt-2">
              {vm.timelineGroups.map((group, idx) => (
                <View
                  key={group.dateStr}
                  onLayout={e => { dayOffsets.current[group.dateStr] = e.nativeEvent.layout.y; }}>
                  <TimelineDayGroup
                    group={group}
                    isLast={idx === vm.timelineGroups.length - 1}
                    onMomentPress={vm.handleMomentPress}
                  />
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      )}
    </View>
  );
}
