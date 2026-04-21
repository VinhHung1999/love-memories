import { ImagePlus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import type { MomentRow } from '@/screens/Moments/useMomentsViewModel';
import { useAppColors } from '@/theme/ThemeProvider';

// T375 — Dashboard has-data block. Eyebrow + one "latest moment" hero card.
// Tap → /moment-detail?id=<id>. Deliberately simpler than MomentCard in the
// Moments list (T376) — Dashboard shows ONE card, no multi-photo grid; the
// cover is the first photo, photo count badge hints at "3 ảnh" if multi.
// Caption truncates at 2 lines; missing-caption collapses the row. Prototype
// ref: dashboard.jsx `PartnerMomentCard`.

type Props = {
  moment: MomentRow;
  eyebrow: string;
  relativeLabel: string;
  onPress: (id: string) => void;
};

export function LatestMomentCard({
  moment,
  eyebrow,
  relativeLabel,
  onPress,
}: Props) {
  const c = useAppColors();
  const photoCount = moment.photos.length;
  const cover = moment.photos[0] ?? null;

  return (
    <View className="mx-5 mt-4">
      <Text className="font-body text-ink-mute text-[11px] uppercase tracking-widest mb-3">
        {eyebrow}
      </Text>

      <Pressable
        onPress={() => onPress(moment.id)}
        accessibilityRole="button"
        accessibilityLabel={moment.title}
        className="rounded-2xl overflow-hidden bg-surface border border-line-on-surface shadow-card active:opacity-90"
      >
        {/* Cover — falls back to a soft gradient placeholder when a moment
            was just created and photos haven't finished uploading yet. */}
        <View className="h-[190px] bg-surface-alt">
          {cover ? (
            <Image
              source={{ uri: cover.url }}
              resizeMode="cover"
              className="w-full h-full"
            />
          ) : (
            <View className="w-full h-full items-center justify-center bg-primary-soft">
              <ImagePlus size={36} strokeWidth={1.6} color={c.primary} />
            </View>
          )}

          {photoCount > 1 ? (
            <View className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-ink/60">
              <Text className="font-bodyMedium text-white text-[11px]">
                1 / {photoCount}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Copy */}
        <View className="px-4 pt-4 pb-4">
          <Text
            numberOfLines={1}
            className="font-displayMedium text-ink text-[20px] leading-[26px]"
          >
            {moment.title}
          </Text>
          {moment.caption ? (
            <Text
              numberOfLines={2}
              className="font-body text-ink-soft text-[13.5px] leading-[20px] mt-1.5"
            >
              {moment.caption}
            </Text>
          ) : null}
          <Text className="mt-3 font-body text-ink-mute text-[11px] uppercase tracking-wider">
            {relativeLabel}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

// Relative-time formatter lifted from MomentDetailScreen (T379). Kept local
// to avoid touching T379 code mid-sprint; Sprint 63 should extract both call
// sites into src/lib/relativeTime.ts when we add Edit/Delete.
export function formatRelative(
  date: Date,
  locale: string,
  justNow: string,
): string {
  const lang = locale.startsWith('vi') ? 'vi-VN' : 'en-US';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);

  if (diffMin < 1) return justNow;
  try {
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    if (diffMin < 60) return rtf.format(-diffMin, 'minute');
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return rtf.format(-diffHr, 'hour');
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 30) return rtf.format(-diffDay, 'day');
    const diffMonth = Math.round(diffDay / 30);
    if (diffMonth < 12) return rtf.format(-diffMonth, 'month');
    return rtf.format(-Math.round(diffMonth / 12), 'year');
  } catch {
    return date.toLocaleDateString(lang);
  }
}

// Separate hook consumer for memoized relative string.
export function useRelativeLabel(
  iso: string,
  locale: string,
  justNow: string,
): string {
  return useMemo(() => formatRelative(new Date(iso), locale, justNow), [iso, locale, justNow]);
}
