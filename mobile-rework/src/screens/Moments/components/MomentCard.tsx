import { useMemo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import type { MomentRow } from '../useMomentsViewModel';

// T376 — timeline card for the Moments tab. Cover layout reacts to photo count:
//   1  → single 4:3 cover
//   2  → two side-by-side squares
//   3+ → first 4 in a 2×2 grid; "+N" badge on the last cell when >4
// Title + 2-line caption truncate + Vi-formatted long date underneath.

type Props = {
  moment: MomentRow;
  locale: string;
  onPress: (id: string) => void;
  morePhotosLabel: (count: number) => string;
};

export function MomentCard({ moment, locale, onPress, morePhotosLabel }: Props) {
  const dateLabel = useMemo(
    () => formatLongDate(new Date(moment.date), locale),
    [moment.date, locale],
  );

  return (
    <Pressable
      onPress={() => onPress(moment.id)}
      accessibilityRole="button"
      className="active:opacity-90"
    >
      <MomentCover
        photos={moment.photos}
        morePhotosLabel={morePhotosLabel}
      />
      <View className="px-1 pt-3 pb-1">
        <Text
          numberOfLines={1}
          className="font-displayMedium text-ink text-[18px] leading-[22px]"
        >
          {moment.title}
        </Text>
        {moment.caption ? (
          <Text
            numberOfLines={2}
            className="font-body text-ink-soft text-[13px] leading-[19px] mt-1"
          >
            {moment.caption}
          </Text>
        ) : null}
        <Text className="font-body text-ink-mute text-[11px] uppercase tracking-wider mt-2">
          {dateLabel}
        </Text>
      </View>
    </Pressable>
  );
}

type CoverProps = {
  photos: MomentRow['photos'];
  morePhotosLabel: (count: number) => string;
};

function MomentCover({ photos, morePhotosLabel }: CoverProps) {
  if (photos.length === 0) {
    return (
      <View className="rounded-2xl overflow-hidden bg-surface-alt aspect-[4/3] items-center justify-center">
        <Text className="text-[36px]">📷</Text>
      </View>
    );
  }

  if (photos.length === 1) {
    return (
      <View className="rounded-2xl overflow-hidden bg-surface-alt aspect-[4/3]">
        <Image
          source={{ uri: photos[0].url }}
          resizeMode="cover"
          className="w-full h-full"
        />
      </View>
    );
  }

  if (photos.length === 2) {
    return (
      <View className="flex-row gap-1">
        {photos.map((p) => (
          <View
            key={p.id}
            className="flex-1 aspect-square rounded-2xl overflow-hidden bg-surface-alt"
          >
            <Image source={{ uri: p.url }} resizeMode="cover" className="w-full h-full" />
          </View>
        ))}
      </View>
    );
  }

  const cells = photos.slice(0, 4);
  const overflow = photos.length - 4;

  return (
    <View className="flex-row flex-wrap gap-1">
      {cells.map((p, idx) => {
        const isLast = idx === cells.length - 1 && overflow > 0;
        return (
          <View
            key={p.id}
            className="basis-[49.2%] aspect-square rounded-2xl overflow-hidden bg-surface-alt"
          >
            <Image source={{ uri: p.url }} resizeMode="cover" className="w-full h-full" />
            {isLast ? (
              <View className="absolute inset-0 bg-ink/50 items-center justify-center">
                <Text className="font-displayMedium text-white text-[22px]">
                  {morePhotosLabel(overflow)}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function formatLongDate(date: Date, locale: string): string {
  const lang = locale.startsWith('vi') ? 'vi-VN' : 'en-US';
  try {
    return new Intl.DateTimeFormat(lang, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  } catch {
    return date.toDateString();
  }
}
