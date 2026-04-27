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
  LettersDeckSlide,
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
  // overlay swallowing the touch.
  // D7 → D9 — same treatment for the LettersDeck slide: each card
  // hosts a vertical ScrollView for long letter bodies AND a Pan
  // gesture for horizontal swipe-flip between cards. Tap zones would
  // intercept the swipe; auto-advance would yank cards out from under
  // the reader. The deck calls `controller.next()` itself when the
  // last card is swiped (see SlideRouter `onAdvance` wiring below).
  const isInteractiveSlide =
    active?.kind === 'actionsTray' || active?.kind === 'lettersDeck';
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
        {active ? (
          <SlideRouter slide={active} onAdvance={controller.next} />
        ) : null}
      </StoriesShell>
    </View>
  );
}

function SlideRouter({
  slide,
  onAdvance,
}: {
  slide: Slide;
  /** Stories controller's `next()` — handed down so the LettersDeck
   *  can fold the last card-swipe into the global advance. */
  onAdvance: () => void;
}) {
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
    case 'lettersDeck':
      return <LettersDeckSlide slide={slide} onAdvance={onAdvance} />;
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
