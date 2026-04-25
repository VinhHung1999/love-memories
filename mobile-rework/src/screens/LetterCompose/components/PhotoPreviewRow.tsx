import { X } from 'lucide-react-native';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import type { LetterPhoto } from '@/api/letters';

// T423 (Sprint 65) — 80×80 thumbnail row under the attachment chips. Each
// photo has a small X corner button that fires DELETE /:id/photos/:photoId.
// Counter pill on the right shows current/max so the user knows when they
// hit the 5-photo cap.

type Props = {
  photos: readonly LetterPhoto[];
  remaining: number;
  max: number;
  counterLabel: string;
  onRemove: (photoId: string) => void;
};

export function PhotoPreviewRow({
  photos,
  max,
  counterLabel,
  onRemove,
}: Props) {
  if (photos.length === 0) return null;

  return (
    <View className="mt-3">
      <View className="flex-row items-center justify-between mb-2 pl-1">
        <Text className="font-bodyBold text-ink-mute text-[11px] tracking-[0.8px] uppercase">
          {counterLabel} {photos.length}/{max}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
      >
        {photos.map((p) => (
          <View key={p.id} className="w-20 h-20 rounded-xl overflow-hidden">
            <Image
              source={{ uri: p.url }}
              resizeMode="cover"
              className="w-full h-full"
            />
            <Pressable
              onPress={() => onRemove(p.id)}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              className="absolute top-1 right-1 w-6 h-6 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
            >
              <X size={12} strokeWidth={2.6} color="#ffffff" />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
