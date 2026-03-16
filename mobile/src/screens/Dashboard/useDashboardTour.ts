import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tabBarRefs } from '../../lib/tabBarRefs';
import { useTranslation } from 'react-i18next';
const TOUR_KEY = '@love-scrum:tour_dashboard_v2_done';

export interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TourStepDef {
  title: string;
  body: string;
  rect: SpotlightRect;
}

function measureRef(ref: React.RefObject<View | null>): Promise<SpotlightRect> {
  return new Promise(resolve => {
    ref.current?.measureInWindow((x, y, width, height) => {
      resolve({ x, y, width, height });
    });
  });
}

export function useDashboardTour() {
  const { t } = useTranslation();
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [steps, setSteps] = useState<TourStepDef[]>([]);

  // Ref for the RelationshipTimer card (passed to DashboardScreen)
  const timerRef = useRef<View>(null);

  useEffect(() => {
    AsyncStorage.getItem(TOUR_KEY).then(val => {
      if (val === null) {
        // Delay 1500ms to ensure layout is complete before measuring
        const timer = setTimeout(async () => {
          const [moments, camera, letters, timer_] = await Promise.all([
            measureRef(tabBarRefs.momentsTab),
            measureRef(tabBarRefs.cameraButton),
            measureRef(tabBarRefs.lettersTab),
            measureRef(timerRef),
          ]);

          setSteps([
            {
              title: t('dashboard.tour.moments.title'),
              body: t('dashboard.tour.moments.body'),
              rect: moments,
            },
            {
              title: t('dashboard.tour.camera.title'),
              body: t('dashboard.tour.camera.body'),
              rect: camera,
            },
            {
              title: t('dashboard.tour.letters.title'),
              body: t('dashboard.tour.letters.body'),
              rect: letters,
            },
            {
              title: t('dashboard.tour.timer.title'),
              body: t('dashboard.tour.timer.body'),
              rect: timer_,
            },
          ]);
          setTourStep(0);
        }, 1500);

        return () => clearTimeout(timer);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissTour = async () => {
    await AsyncStorage.setItem(TOUR_KEY, 'true');
    setTourStep(null);
  };

  const advanceTour = () => {
    if (tourStep === null) return;
    if (tourStep >= steps.length - 1) {
      dismissTour();
    } else {
      setTourStep(tourStep + 1);
    }
  };

  return { tourStep, steps, timerRef, advanceTour, dismissTour };
}
