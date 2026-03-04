import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, MomentsStackParamList, FoodSpotsStackParamList } from '../../navigation';
import { mapApi, tagsApi } from '../../lib/api';
import type { MapPin, TagMetadata } from '../../types';

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
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState<PinTypeFilter>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [selectedTagForEmoji, setSelectedTagForEmoji] = useState<string | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: pins = [], isLoading, refetch } = useQuery({
    queryKey: ['map-pins'],
    queryFn: mapApi.pins,
    staleTime: 60_000,
  });

  const { data: tagMetadata = [] } = useQuery<TagMetadata[]>({
    queryKey: ['tags'],
    queryFn: tagsApi.list,
    staleTime: 300_000,
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

  // ── Emoji mutation ────────────────────────────────────────────────────────

  const { mutate: saveEmoji, isPending: isSavingEmoji } = useMutation({
    mutationFn: ({ name, emoji }: { name: string; emoji: string }) =>
      tagsApi.upsert(name, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['map-pins'] });
      setSelectedTagForEmoji(null);
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handlePinPress = (pin: MapPin) => setSelectedPin(pin);

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
  const handleTagLongPress = (tag: string) => setSelectedTagForEmoji(tag);
  const handleEmojiSelect = (emoji: string) => {
    if (!selectedTagForEmoji) return;
    saveEmoji({ name: selectedTagForEmoji, emoji });
  };
  const handleCloseEmojiPicker = () => setSelectedTagForEmoji(null);

  return {
    isLoading,
    pins: filteredPins,
    allTags,
    tagMetadata,
    typeFilter,
    activeTag,
    selectedPin,
    selectedTagForEmoji,
    isSavingEmoji,
    refetch,
    handlePinPress,
    handleCalloutPress,
    handleDismissCallout,
    handleTypeFilter,
    handleTagFilter,
    handleTagLongPress,
    handleEmojiSelect,
    handleCloseEmojiPicker,
  };
}
