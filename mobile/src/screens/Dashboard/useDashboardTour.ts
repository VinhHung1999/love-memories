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
        const timer = setTimeout(() => setTourStep(0), 800);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  const advanceTour = () => {
    setTourStep(prev => {
      if (prev === null) return null;
      if (prev >= 3) return null; // done — dismissed naturally
      return prev + 1;
    });
  };

  const dismissTour = async () => {
    await AsyncStorage.setItem(TOUR_KEY, 'true');
    setTourStep(null);
  };

  return { tourStep, advanceTour, dismissTour };
}
