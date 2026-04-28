// Sprint 67 T454 — Places preview for section 05.
//
// Prototype `recap.jsx` L801-885 PlacesMap renders a faux map with SVG
// topography + animated pins. mobile-rework doesn't have react-native-maps
// wired in (drop list — Map module dropped per the rework spec). Ship a
// clean LIST view of places instead: each row = pin icon + name + count
// chip. Clean, theme-aware, ships fast. Carry-over backlog item
// `B-recap-places-map` (P3) tracks the actual map render once
// react-native-maps lands in the rework.
//
// Per Boss directive: layout consistency with prototype scroll matters,
// so the section still ships under kicker "05" with a caption row.

import { MapPin } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { RecapPlace } from '../types';

type Props = {
  places: RecapPlace[];
  caption: string;             // e.g. "6 địa điểm mới, 1 chuyến xa nhà 3 ngày"
  emptyTitle: string;          // empty-state heading when places=0
  emptyBody: string;           // empty-state subtext
  countLabel: string;          // singular form, e.g. "lần" / "visit"
};

export function PlacesList({
  places,
  caption,
  emptyTitle,
  emptyBody,
  countLabel,
}: Props) {
  if (places.length === 0) {
    return (
      <View className="mt-3.5 rounded-[20px] border border-dashed border-line bg-surface px-5 py-6">
        <Text className="font-displayMedium text-[16px] leading-[20px] text-ink">
          {emptyTitle}
        </Text>
        <Text className="mt-2 font-body text-[13px] leading-[19px] text-ink-soft">
          {emptyBody}
        </Text>
      </View>
    );
  }

  // Show top 6 — keeps card height bounded; extras still represented in the
  // total count caption.
  const visible = places.slice(0, 6);

  return (
    <View className="mt-3.5 overflow-hidden rounded-[20px] border border-line bg-surface">
      <View>
        {visible.map((p, i) => (
          <View
            key={p.name}
            className={
              i < visible.length - 1
                ? 'flex-row items-center gap-3 border-b border-line-soft-on-surface px-4 py-3.5'
                : 'flex-row items-center gap-3 px-4 py-3.5'
            }
          >
            <View className="h-9 w-9 items-center justify-center rounded-2xl bg-primary-soft">
              <MapPin size={16} color="#C23B4E" strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="font-bodySemibold text-[14px] text-ink" numberOfLines={1}>
                {p.name}
              </Text>
            </View>
            <View className="rounded-full bg-surface-alt px-2.5 py-0.5">
              <Text className="font-bodyBold text-[11px] text-ink-soft">
                {p.count} {countLabel}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View className="flex-row items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3">
        <Text className="flex-1 font-body text-[12px] leading-[17px] text-ink-soft">
          {caption}
        </Text>
        <Text className="font-displayBold text-[28px] tracking-tight text-primary">
          {places.length}
        </Text>
      </View>
    </View>
  );
}
