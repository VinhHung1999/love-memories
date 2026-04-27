// Sprint 67 T459 — Cover slide. Optional photo full-bleed (Ken Burns) +
// dark gradient. Display title 56px (smaller than the editorial cover
// to leave room for chrome). Couple avatars + Dancing Script names line.

import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import { KenBurnsBackground } from '../KenBurnsBackground';
import type { Slide, StoriesPerson } from '../../types';

type CoverSlide = Extract<Slide, { kind: 'cover' }>;

type Props = { slide: CoverSlide };

export function CoverSlide({ slide }: Props) {
  const c = useAppColors();
  return (
    <View className="flex-1">
      {slide.bgPhotoUrl ? (
        <KenBurnsBackground uri={slide.bgPhotoUrl} dim={0.5} />
      ) : (
        <LinearGradient
          colors={[c.heroA, c.heroB, c.heroC]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      )}
      <View className="flex-1 justify-end px-7 pb-20">
        <Text className="font-bodyBold text-[11px] uppercase tracking-[1.5px] text-white/85">
          {slide.kicker}
        </Text>
        <Text className="mt-3 font-displayMedium text-[56px] leading-[56px] text-white">
          {slide.titleLine1}
        </Text>
        <Text className="font-displayMedium text-[56px] leading-[56px] text-white">
          {slide.titleLine2}
        </Text>
        <View className="mt-6 flex-row items-center gap-3">
          <CoupleAvatars people={slide.people} />
          <Text className="font-script text-[24px] text-white/95">
            {slide.coupleNamesScript}
          </Text>
        </View>
        {slide.scrollHint ? (
          <Text className="mt-8 font-bodySemibold text-[11px] uppercase tracking-[1.5px] text-white/70">
            {slide.scrollHint}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function CoupleAvatars({ people }: { people: [StoriesPerson, StoriesPerson] }) {
  const c = useAppColors();
  return (
    <View className="h-9 w-[52px]">
      {people.map((p, i) => {
        const colors: readonly [string, string] =
          p.gradientKey === 'A' ? [c.heroA, c.secondary] : [c.secondary, c.primary];
        return (
          <View
            key={i}
            className="absolute h-9 w-9 overflow-hidden rounded-full border-2 border-white/70"
            style={{ left: i * 16, top: i * 2 }}
          >
            <LinearGradient
              colors={colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text className="font-bodyBold text-[14px] text-white">{p.initial}</Text>
            </LinearGradient>
          </View>
        );
      })}
    </View>
  );
}
