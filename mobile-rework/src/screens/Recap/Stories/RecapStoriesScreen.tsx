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
  LetterSlide,
  PhotoReelSlide,
  PlacesSlide,
  StatSlide,
  TopMomentSlide,
  TopQuestionSlide,
} from './components/slides';
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
  // overlay swallowing the touch. Pause is keyed off the active slide;
  // navigating away resumes automatically.
  const isActionsSlide = active?.kind === 'actionsTray';
  useEffect(() => {
    if (isActionsSlide) controller.pause();
    else controller.resume();
  }, [isActionsSlide, controller]);

  return (
    <View className="flex-1 bg-black">
      <StoriesShell
        controller={controller}
        onClose={onClose}
        closeAccessibilityLabel={t('recap.weekly.closeLabel')}
        interactive={isActionsSlide}
      >
        {active ? <SlideRouter slide={active} /> : null}
      </StoriesShell>
    </View>
  );
}

function SlideRouter({ slide }: { slide: Slide }) {
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
    case 'letter':
      return <LetterSlide slide={slide} />;
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
