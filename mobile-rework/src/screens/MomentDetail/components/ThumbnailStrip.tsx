import { Image, Pressable, ScrollView, View } from 'react-native';

type Photo = { id: string; url: string };

type Props = {
  photos: Photo[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

// T396 (Sprint 63) — Floating thumbnail strip overlapping the bottom of the
// hero (-28px) per prototype moments.jsx L514-532. Horizontal scroll, 56x56
// thumbs with rounded-xl. Active thumb gets a 2.5px white ring; idle thumbs
// a softer 2px white/40 ring. Border widths flip at runtime → stay on the
// `style` prop (NativeWind v4 conditional-className rule, see
// .claude/rules/mobile-rework.md).
export function ThumbnailStrip({ photos, activeIndex, onSelect }: Props) {
  if (photos.length <= 1) return null;
  return (
    <View
      className="absolute left-0 right-0 z-10"
      style={{ bottom: -28 }}
      pointerEvents="box-none"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}
      >
        {photos.map((photo, i) => {
          const isActive = i === activeIndex;
          return (
            <Pressable
              key={photo.id}
              onPress={() => onSelect(i)}
              accessibilityRole="imagebutton"
              className="w-14 h-14 rounded-xl overflow-hidden active:opacity-90"
              style={{
                borderWidth: isActive ? 2.5 : 2,
                borderColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 12,
                shadowOpacity: 0.25,
              }}
            >
              <Image
                source={{ uri: photo.url }}
                resizeMode="cover"
                className="w-full h-full"
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
