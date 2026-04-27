// Sprint 67 T459 — Stories screen. Renders an externally-supplied list
// of `Slide` objects through the StoriesShell.
//
// The shell handles navigation + animation; the screen body just maps
// `slides[index]` to its slide variant component. Composer logic
// (T460) builds the slide list from BE recap data.

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { StoriesShell } from './components/StoriesShell';
import {
  ActionsTraySlide,
  ClosingSlide,
  CoverSlide,
  FirstsSlide,
  LettersCollectionSlide,
  PhotoReelSlide,
  PlacesSlide,
  StatSlide,
  TopMomentSlide,
  TopQuestionSlide,
} from './components/slides';
import { useRouter } from 'expo-router';
import type { Slide } from './types';
import { useStoriesController } from './useStoriesController';

type Props = {
  slides: Slide[];
  onClose: () => void;
};

export function RecapStoriesScreen({ slides, onClose }: Props) {
  const { t } = useTranslation();
  const controller = useStoriesController(slides.length, onClose);
  const active = slides[controller.index] ?? null;
  // D2 — actions slide disables tap zones + auto-advance so the user
  // can tap Save / Share / Detail buttons without the tap-to-advance
  // overlay swallowing the touch.
  // D7 → D8 — same treatment for the consolidated LettersCollection
  // slide: full body content for every letter lives inside a stacked
  // ScrollView (read-screen style), so tap zones would intercept
  // drag-to-scroll AND the 6-second auto-advance would cut Boss off
  // mid-letter. Reader-controlled pacing matches Boss's "kiểu read"
  // expectation.
  const isInteractiveSlide =
    active?.kind === 'actionsTray' || active?.kind === 'lettersCollection';
  useEffect(() => {
    if (isInteractiveSlide) controller.pause();
    else controller.resume();
  }, [isInteractiveSlide, controller]);

  return (
    <View className="flex-1 bg-black">
      <StoriesShell
        controller={controller}
        onClose={onClose}
        closeAccessibilityLabel={t('recap.weekly.closeLabel')}
        interactive={isInteractiveSlide}
      >
        {active ? <SlideRouter slide={active} /> : null}
      </StoriesShell>
    </View>
  );
}

function SlideRouter({ slide }: { slide: Slide }) {
  const router = useRouter();
  switch (slide.kind) {
    case 'cover':
      return <CoverSlide slide={slide} />;
    case 'stat':
      return <StatSlide slide={slide} />;
    case 'topMoment':
      return <TopMomentSlide slide={slide} />;
    case 'places':
      return <PlacesSlide slide={slide} />;
    case 'firsts':
      return <FirstsSlide slide={slide} />;
    case 'lettersCollection':
      return (
        <LettersCollectionSlide
          slide={slide}
          // D8 — CTA bounces to the Letters tab inbox where the user
          // can re-open + reply. Stories session stays alive (push
          // not replace) so swipe-back returns to the slide.
          onOpen={() => router.push('/(tabs)/letters')}
        />
      );
    case 'topQuestion':
      return <TopQuestionSlide slide={slide} />;
    case 'photoReel':
      return <PhotoReelSlide slide={slide} />;
    case 'closing':
      return <ClosingSlide slide={slide} />;
    case 'actionsTray':
      return <ActionsTraySlide slide={slide} />;
  }
}
