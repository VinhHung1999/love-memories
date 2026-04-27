// Sprint 67 D1 — Photo collage background. Switches layout based on
// photo count:
//   • 0 — caller renders gradient fallback
//   • 1 — single full-bleed Image
//   • 2-3 — tilted stacked polaroid pile (each rotated ±6°, dropped
//     center-aligned with depth offset)
//   • 4+ — 2x2 grid (top-left primary larger when 4)
//
// All variants are full-bleed; a dark gradient overlay (configurable
// dim) sits above so any text on top stays readable.

import { LinearGradient } from 'expo-linear-gradient';
import { Image, View } from 'react-native';

type Props = {
  photos: string[];
  dim?: number;          // 0..1, default 0.4
};

export function CollageBackground({ photos, dim = 0.4 }: Props) {
  if (photos.length === 0) return null;
  return (
    <View className="absolute left-0 right-0 top-0 bottom-0 overflow-hidden">
      {photos.length === 1 ? (
        <Image
          source={{ uri: photos[0] }}
          resizeMode="cover"
          className="h-full w-full"
        />
      ) : photos.length <= 3 ? (
        <StackedPolaroids photos={photos} />
      ) : (
        <Grid2x2 photos={photos.slice(0, 4)} />
      )}
      <LinearGradient
        colors={[
          'rgba(0,0,0,0)',
          `rgba(0,0,0,${dim})`,
          `rgba(0,0,0,${Math.min(1, dim + 0.3)})`,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
    </View>
  );
}

function Grid2x2({ photos }: { photos: string[] }) {
  // Render 4 quadrants. Photos < 4 are padded with the same image so
  // every cell renders something (caller passes >= 4 for the 4+ branch
  // but be defensive).
  const safe = [
    photos[0],
    photos[1] ?? photos[0],
    photos[2] ?? photos[0],
    photos[3] ?? photos[1] ?? photos[0],
  ];
  return (
    <View className="h-full w-full flex-row flex-wrap">
      {safe.map((uri, i) => (
        <Image
          key={i}
          source={{ uri }}
          resizeMode="cover"
          style={{ width: '50%', height: '50%' }}
        />
      ))}
    </View>
  );
}

function StackedPolaroids({ photos }: { photos: string[] }) {
  // Center the stack; subsequent photos rotate slightly + offset so the
  // edges peek out behind the front photo. Front (index 0) is upright
  // and largest visually due to top stacking order.
  return (
    <View className="h-full w-full items-center justify-center bg-bg-elev">
      {photos.map((uri, i) => {
        const rot = (i % 2 === 0 ? -1 : 1) * (i + 1) * 4;
        const offsetY = i * 14;
        const offsetX = (i % 2 === 0 ? -1 : 1) * (i * 8);
        return (
          <View
            key={i}
            className="absolute overflow-hidden rounded-[6px] border-4 border-white shadow-elevated"
            style={{
              width: '70%',
              aspectRatio: 0.78,
              transform: [
                { translateX: offsetX },
                { translateY: offsetY },
                { rotate: `${rot}deg` },
              ],
              zIndex: photos.length - i,
            }}
          >
            <Image
              source={{ uri }}
              resizeMode="cover"
              className="h-full w-full"
            />
          </View>
        );
      })}
    </View>
  );
}
