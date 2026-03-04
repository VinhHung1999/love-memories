import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, MomentsStackParamList, FoodSpotsStackParamList } from '../../navigation';
import { mapApi } from '../../lib/api';
import type { MapPin } from '../../types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'MapTab'>,
  CompositeNavigationProp<
    NativeStackNavigationProp<MomentsStackParamList>,
    NativeStackNavigationProp<FoodSpotsStackParamList>
  >
>;

export type PinTypeFilter = 'all' | 'moment' | 'foodspot';

export function useMapViewModel() {
  const navigation = useNavigation<Nav>();

  const [typeFilter, setTypeFilter] = useState<PinTypeFilter>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: pins = [], isLoading, refetch } = useQuery({
    queryKey: ['map-pins'],
    queryFn: mapApi.pins,
    staleTime: 60_000,
  });

  // ── Derived: all tags across all pins ─────────────────────────────────────

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    pins.forEach(p => p.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [pins]);

  // ── Derived: filtered pins ────────────────────────────────────────────────

  const filteredPins = useMemo<MapPin[]>(() => {
    return pins.filter(p => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (activeTag && !p.tags.includes(activeTag)) return false;
      return true;
    });
  }, [pins, typeFilter, activeTag]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handlePinPress = (pin: MapPin) => {
    setSelectedPin(pin);
  };

  const handleCalloutPress = (pin: MapPin) => {
    setSelectedPin(null);
    if (pin.type === 'moment') {
      (navigation as any).navigate('MomentsTab', {
        screen: 'MomentDetail',
        params: { momentId: pin.id },
      });
    } else {
      (navigation as any).navigate('FoodSpotsTab', {
        screen: 'FoodSpotDetail',
        params: { foodSpotId: pin.id },
      });
    }
  };

  const handleDismissCallout = () => setSelectedPin(null);

  const handleTypeFilter = (f: PinTypeFilter) => setTypeFilter(f);

  const handleTagFilter = (tag: string | null) => setActiveTag(tag);

  return {
    isLoading,
    pins: filteredPins,
    allTags,
    typeFilter,
    activeTag,
    selectedPin,
    refetch,
    handlePinPress,
    handleCalloutPress,
    handleDismissCallout,
    handleTypeFilter,
    handleTagFilter,
  };
}
