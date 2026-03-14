import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Body, Caption, Heading } from '../../components/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, LocateFixed, MapPin as MapPinIcon, Utensils, X } from 'lucide-react-native';
import Mapbox from '@rnmapbox/maps';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useMapViewModel } from './useMapViewModel';
import type { PinTypeFilter } from './useMapViewModel';
import TagBadge from '../../components/TagBadge';
import type { MapPin, TagMetadata } from '../../types';
// Mapbox token initialized in App.tsx before NavigationContainer mounts

// ── Emoji categories ──────────────────────────────────────────────────────────

const EMOJI_CATEGORIES = [
  {
    label: t.map.emojiCategoryFood,
    emojis: ['🍜', '🍕', '☕', '🍣', '🍔', '🍱', '🍷', '🍰', '🥗', '🍲', '🥘', '🍛', '🧁', '🍦', '🍺', '🍵'],
  },
  {
    label: t.map.emojiCategoryPlaces,
    emojis: ['🏖️', '🏔️', '🏛️', '🌴', '🏡', '🌅', '⛩️', '🗼', '🏰', '🌃', '🎡', '🛶', '🏕️', '⛺', '🌉', '🗺️'],
  },
  {
    label: t.map.emojiCategoryActivities,
    emojis: ['🎭', '🎪', '🎨', '🎮', '🎯', '🎸', '🚀', '💪', '🎬', '🎤', '🎲', '⚽', '🎻', '🧘', '🏄', '🎳'],
  },
  {
    label: t.map.emojiCategoryNature,
    emojis: ['🌸', '🌿', '🌊', '🌙', '☀️', '⭐', '🌈', '🦋', '🌻', '🍁', '🐚', '🦜', '🌺', '🍃', '🌾', '🦚'],
  },
];

// ── Type filter chips data ─────────────────────────────────────────────────────

const TYPE_FILTERS: { key: PinTypeFilter; label: string; icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }> }[] = [
  { key: 'all', label: t.map.filterAll, icon: MapPinIcon },
  { key: 'moment', label: t.map.filterMoments, icon: Heart },
  { key: 'foodspot', label: t.map.filterFoodSpots, icon: Utensils },
];

// ── Emoji picker modal ────────────────────────────────────────────────────────

function EmojiPickerModal({
  tagName,
  colors,
  onSelect,
  onClose,
  isSaving,
}: {
  tagName: string;
  colors: ReturnType<typeof useAppColors>;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [customEmoji, setCustomEmoji] = useState('');

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="flex-1 bg-black/40" onPress={onClose} />
        <View className="bg-white rounded-t-3xl">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
            <Heading size="sm" className="text-textDark">
              {t.map.emojiPickerTitle} "{tagName}"
            </Heading>
            <TouchableOpacity onPress={onClose} className="w-7 h-7 items-center justify-center">
              <X size={20} color={colors.textLight} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          {/* Category tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3">
            <View className="flex-row gap-2">
              {EMOJI_CATEGORIES.map((cat, i) => (
                <Pressable
                  key={cat.label}
                  onPress={() => setActiveCategory(i)}
                  className="px-3 py-1.5 rounded-xl border"
                  style={{ backgroundColor: i === activeCategory ? colors.primary : 'transparent', borderColor: i === activeCategory ? colors.primary : colors.border }}>
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: i === activeCategory ? '#fff' : colors.textMid }}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Emoji grid */}
          <View className="flex-row flex-wrap px-3 pb-2">
            {EMOJI_CATEGORIES[activeCategory].emojis.map(emoji => (
              <Pressable
                key={emoji}
                onPress={() => onSelect(emoji)}
                disabled={isSaving}
                className="w-[12.5%] h-12 items-center justify-center rounded-xl">
                <Text className="text-2xl">{emoji}</Text>
              </Pressable>
            ))}
          </View>

          {/* Custom input */}
          <View className="flex-row items-center gap-2 px-4 pt-1 pb-8">
            <TextInput
              value={customEmoji}
              onChangeText={setCustomEmoji}
              placeholder={t.map.emojiPickerCustomPlaceholder}
              placeholderTextColor={colors.textLight}
              className="flex-1 border border-border rounded-xl px-3 py-2.5 text-base text-textDark"
              maxLength={2}
            />
            <TouchableOpacity
              onPress={() => customEmoji.trim() && onSelect(customEmoji.trim())}
              disabled={!customEmoji.trim() || isSaving}
              className="px-4 py-2.5 rounded-xl"
              style={{ backgroundColor: customEmoji.trim() ? colors.primary : colors.border }}>
              <Text className="text-white text-sm font-semibold">{t.common.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Floating callout card ─────────────────────────────────────────────────────

function PinCallout({
  pin,
  colors,
  tagMetadata,
  onViewDetails,
  onDismiss,
}: {
  pin: MapPin;
  colors: ReturnType<typeof useAppColors>;
  tagMetadata: TagMetadata[];
  onViewDetails: () => void;
  onDismiss: () => void;
}) {
  const isFood = pin.type === 'foodspot';
  return (
    <View className="absolute bottom-6 left-4 right-4 bg-white rounded-3xl overflow-hidden shadow-lg">
      <View className="flex-row">
        {pin.thumbnail ? (
          <Image
            source={{ uri: pin.thumbnail }}
            className="w-20 h-20 rounded-xl m-3"
            resizeMode="cover"
          />
        ) : (
          <View
            className="w-20 h-20 m-3 rounded-xl items-center justify-center"
            style={{ backgroundColor: isFood ? colors.secondaryMuted : colors.primaryMuted }}>
            {pin.tagIcon ? (
              <Text className="text-3xl">{pin.tagIcon}</Text>
            ) : isFood ? (
              <Utensils size={28} color={colors.secondary} strokeWidth={1.5} />
            ) : (
              <Heart size={28} color={colors.primary} strokeWidth={1.5} />
            )}
          </View>
        )}
        <View className="flex-1 py-3 pr-3">
          <View className="flex-row items-start justify-between">
            <Text className="text-sm font-bold text-textDark flex-1 mr-2" numberOfLines={1}>
              {pin.title}
            </Text>
            <TouchableOpacity onPress={onDismiss} className="w-6 h-6 items-center justify-center">
              <X size={16} color={colors.textLight} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
          {pin.location ? (
            <View className="flex-row items-center gap-1 mt-0.5">
              <MapPinIcon size={11} color={colors.textLight} strokeWidth={1.5} />
              <Caption className="text-textLight flex-1" numberOfLines={1}>
                {pin.location}
              </Caption>
            </View>
          ) : null}
          {pin.tags.length > 0 ? (
            <View className="flex-row flex-wrap gap-1 mt-1.5">
              {pin.tags.slice(0, 2).map(tag => {
                const meta = tagMetadata.find(m => m.name === tag);
                return (
                  <TagBadge
                    key={tag}
                    label={meta?.icon ? `${meta.icon} ${tag}` : tag}
                    variant="display"
                  />
                );
              })}
            </View>
          ) : null}
          <TouchableOpacity
            onPress={onViewDetails}
            className="mt-2 px-3 py-1.5 rounded-xl self-start"
            style={{ backgroundColor: isFood ? colors.secondary : colors.primary }}>
            <Text className="text-white text-[11px] font-semibold">{t.map.viewDetails}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MapScreen() {
  const colors = useAppColors();
  const vm = useMapViewModel();
  const cameraRef = useRef<any>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const hasInitialFitRef = useRef(false);

  // ── Fit bounds helper ──────────────────────────────────────────────────────

  const fitPinBounds = useCallback((pins: MapPin[]) => {
    if (pins.length === 0) return;
    if (pins.length === 1) {
      cameraRef.current?.setCamera({
        centerCoordinate: [pins[0].longitude, pins[0].latitude],
        zoomLevel: 14,
        animationDuration: 800,
      });
      return;
    }
    const lngs = pins.map(p => p.longitude);
    const lats = pins.map(p => p.latitude);
    cameraRef.current?.setCamera({
      bounds: {
        ne: [Math.max(...lngs), Math.max(...lats)],
        sw: [Math.min(...lngs), Math.min(...lats)],
        paddingTop: 80,
        paddingBottom: 120,
        paddingLeft: 40,
        paddingRight: 40,
      },
      animationDuration: 800,
    });
  }, []);

  // ── #3: Auto-fit when filtered pins change ─────────────────────────────────

  useEffect(() => {
    if (vm.isLoading || vm.pins.length === 0) return;
    const delay = hasInitialFitRef.current ? 0 : 400;
    const timer = setTimeout(() => {
      fitPinBounds(vm.pins);
      hasInitialFitRef.current = true;
    }, delay);
    return () => clearTimeout(timer);
  }, [vm.pins, vm.isLoading, fitPinBounds]);

  // ── #1: Auto-fly to user location when no pins ─────────────────────────────

  useEffect(() => {
    if (hasInitialFitRef.current || vm.isLoading || vm.pins.length > 0 || !userCoords) return;
    const timer = setTimeout(() => {
      cameraRef.current?.setCamera({
        centerCoordinate: userCoords,
        zoomLevel: 13,
        animationDuration: 800,
      });
      hasInitialFitRef.current = true;
    }, 400);
    return () => clearTimeout(timer);
  }, [userCoords, vm.isLoading, vm.pins.length]);

  // ── My Location handler ────────────────────────────────────────────────────

  const handleMyLocation = () => {
    if (userCoords) {
      cameraRef.current?.setCamera({
        centerCoordinate: userCoords,
        zoomLevel: 14,
        animationDuration: 600,
      });
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="bg-white">
        {/* Header */}
        <View className="px-5 pt-3 pb-2">
          <Heading size="xl" className="text-textDark">{t.map.title}</Heading>
          <Body size="sm" className="text-textLight mt-0.5">{t.map.subtitle}</Body>
        </View>

        {/* Type filter chips */}
        <View className="px-5 pb-3 flex-row gap-2">
          {TYPE_FILTERS.map(f => {
            const active = vm.typeFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => vm.handleTypeFilter(f.key)}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border"
                style={{ backgroundColor: active ? colors.primary : 'transparent', borderColor: active ? colors.primary : colors.border }}>
                <f.icon size={13} color={active ? '#fff' : colors.textMid} strokeWidth={1.5} />
                <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : colors.textMid }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tag filter bar — long press to edit emoji */}
        {vm.allTags.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-5 pb-3">
            <View className="flex-row gap-2 pr-5">
              <TagBadge
                label={t.foodSpots.allFilter}
                active={!vm.activeTag}
                onPress={() => vm.handleTagFilter(null)}
              />
              {vm.allTags.map(tag => {
                const meta = vm.tagMetadata.find(m => m.name === tag);
                return (
                  <TagBadge
                    key={tag}
                    label={meta?.icon ? `${meta.icon} ${tag}` : tag}
                    active={vm.activeTag === tag}
                    onPress={() => vm.handleTagFilter(tag)}
                    onLongPress={() => vm.handleTagLongPress(tag)}
                  />
                );
              })}
            </View>
          </ScrollView>
        ) : null}
      </SafeAreaView>

      {/* Map + overlays */}
      <View className="flex-1">
        {/* style exception: Mapbox.MapView is a native view requiring flex layout style */}
        {/* eslint-disable-next-line react-native/no-inline-styles */}
        <Mapbox.MapView style={{ flex: 1 }} styleURL={Mapbox.StyleURL.Street}>
          <Mapbox.Camera
            ref={cameraRef}
            defaultSettings={{ centerCoordinate: [106.66, 10.78], zoomLevel: 11 }}
          />
          <Mapbox.UserLocation
            visible
            animated
            onUpdate={location => {
              setUserCoords([location.coords.longitude, location.coords.latitude]);
            }}
          />
          {/* eslint-disable react-native/no-inline-styles */}
          {vm.pins.map(pin => (
            <Mapbox.PointAnnotation
              key={pin.id}
              id={pin.id}
              coordinate={[pin.longitude, pin.latitude]}
              onSelected={() => vm.handlePinPress(pin)}>
              {/* style required: Mapbox.PointAnnotation children are native views — NativeWind CssInterop cannot wrap them */}
              {pin.tagIcon ? (
                <View style={{
                  width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#fff',
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: pin.type === 'foodspot' ? colors.secondary + '33' : colors.primary + '33',
                }}>
                  <Text style={{ fontSize: 16 }}>{pin.tagIcon}</Text>
                </View>
              ) : (
                <View style={{
                  width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#fff',
                  backgroundColor: pin.type === 'foodspot' ? colors.secondary : colors.primary,
                }} />
              )}
            </Mapbox.PointAnnotation>
          ))}
          {/* eslint-enable react-native/no-inline-styles */}
        </Mapbox.MapView>

        {/* Callout overlay */}
        {vm.selectedPin ? (
          <PinCallout
            pin={vm.selectedPin}
            colors={colors}
            tagMetadata={vm.tagMetadata}
            onViewDetails={() => vm.handleCalloutPress(vm.selectedPin!)}
            onDismiss={vm.handleDismissCallout}
          />
        ) : null}

        {/* My Location button */}
        <TouchableOpacity
          onPress={handleMyLocation}
          className="absolute bottom-20 right-4 w-10 h-10 rounded-full bg-white shadow-md items-center justify-center">
          <LocateFixed size={20} color={colors.primary} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Emoji picker modal */}
      {vm.selectedTagForEmoji ? (
        <EmojiPickerModal
          tagName={vm.selectedTagForEmoji}
          colors={colors}
          onSelect={vm.handleEmojiSelect}
          onClose={vm.handleCloseEmojiPicker}
          isSaving={vm.isSavingEmoji}
        />
      ) : null}
    </View>
  );
}
