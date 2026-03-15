import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOUR_KEY = '@love-scrum:tour_dashboard_done';

export interface TourStep {
  title: string;
  body: string;
  // Approximate position of the spotlight target
  targetX: number;  // center X of highlight box
  targetY: number;  // center Y of highlight box
  targetW: number;
  targetH: number;
}

export function useDashboardTour() {
  const [tourStep, setTourStep] = useState<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(TOUR_KEY).then(val => {
      if (val === null) {
        // 1500ms — wait for Dashboard to fully mount before showing overlay
        const timer = setTimeout(() => setTourStep(0), 1500);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  const dismissTour = async () => {
    await AsyncStorage.setItem(TOUR_KEY, 'true');
    setTourStep(null);
  };

  const advanceTour = () => {
    if (tourStep === null) return;
    if (tourStep >= 3) {
      dismissTour(); // saves AsyncStorage + sets null
    } else {
      setTourStep(tourStep + 1);
    }
  };

  return { tourStep, advanceTour, dismissTour };
}
