import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LetterPhoto } from '@/api/letters';
import { PhotoLightbox } from '@/screens/MomentDetail/PhotoLightbox';

// T422 (Sprint 65) — overlapping polaroid stack at the bottom of the paper
// card. Prototype `letters.jsx` L378-393 — width 80, height 100, 4px white
// border, rotate `(i - count/2) * 4°`, translateY abs(i-1).
//
// Direct import of PhotoLightbox from MomentDetail (Lu Q-B approved — KISS,
// rule of 3 means lift only when a 3rd consumer appears; LetterRead is
// consumer #2). Lightbox already handles multi-photo swipe + Reanimated v4
// pinch + dismiss + Photos download.

type Props = {
  photos: readonly LetterPhoto[];
};

export function PhotoStackPreview({ photos }: Props) {
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <View className="flex-row mt-6 ml-1">
        {photos.map((p, i) => {
          const rotate = (i - photos.length / 2) * 4;
          const translateY = Math.abs(i - 1);
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              onPress={() => setOpenIndex(i)}
              className="w-20 h-[100px] rounded-[4px] overflow-hidden border-[4px] border-white shadow-card -mr-3"
              style={{
                transform: [
                  { rotate: `${rotate}deg` },
                  { translateY },
                ],
              }}
            >
              <Image
                source={{ uri: p.url }}
                resizeMode="cover"
                className="w-full h-full"
              />
            </Pressable>
          );
        })}
      </View>
      <PhotoLightbox
        visible={openIndex !== null}
        photos={photos.map((p) => ({
          id: p.id,
          url: p.url,
          filename: p.filename,
        }))}
        initialIndex={openIndex ?? 0}
        onClose={() => setOpenIndex(null)}
        topInset={insets.top}
      />
    </>
  );
}
