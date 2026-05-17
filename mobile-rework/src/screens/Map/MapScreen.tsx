// T472 (Sprint 70) — Memory Map. VIEW ONLY (Hard Rule #1 MVVM). All state +
// fetch orchestration lives in `useMapScreenViewModel`. This file:
//   1. Mounts Mapbox <MapView> with the locked style URL.
//   2. Renders one <MarkerView> per pin, each containing a <PinView>.
//   3. Wires the empty-state CTA to the existing camera-sheet flow.
//   4. Mounts <MomentPreviewCard> (Slice 3) for `selectedPin`.
//
// MarkerView vs SymbolLayer choice: MarkerView. PinView needs React
// composition (Image + Text + tint) which SymbolLayer can't express without
// pre-baked raster atlases we don't have. The Reanimated v4 / Mapbox iOS 26
// crash documented in memory is on `<UserLocation animated />` — we render
// neither. Spec says fall back to SymbolLayer if MarkerView itself crashes;
// the spike (PinView alone, no Reanimated) compiles + relies only on
// transform: rotate which Mapbox already supports inside MarkerView children.

import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import Mapbox from '@rnmapbox/maps';

import { env } from '@/config/env';
import { useCameraSheetStore } from '@/stores/cameraSheetStore';
import type { MapMomentPin } from '@/screens/Map/types';
import { useAppColors } from '@/theme/ThemeProvider';

import { MomentPreviewCard } from './components/MomentPreviewCard';
import { PinView } from './components/PinView';
import { useMapScreenViewModel } from './useMapScreenViewModel';

// Initial camera centered on Vietnam — `[lng, lat]` per Mapbox convention.
const INITIAL_CENTER: [number, number] = [107.5, 16.0];
const INITIAL_ZOOM = 4.5;

// Clamp pan to the country bounding box (`[lng, lat]`). NE = north-east,
// SW = south-west — Camera maxBounds shape.
const VN_BOUNDS = {
  ne: [110, 23] as [number, number],
  sw: [102, 8] as [number, number],
};

// Hard Rule #2 carve-out: Mapbox MapView's `style` is a native prop, not
// stylable via className. The ONLY use of style= here, minimal as required.
const MAP_STYLE = { flex: 1 } as const;

export function MapScreen() {
  const { t } = useTranslation();
  const colors = useAppColors();
  const vm = useMapScreenViewModel();

  const handleOpenFull = () => {
    if (!vm.selectedPin) return;
    // Reuse the existing MomentDetail route (`app/moment-detail.tsx`). T386.7
    // pulled it out of the (modal) group so it pushes as a standard card.
    router.push({ pathname: '/moment-detail', params: { id: vm.selectedPin.id } });
  };

  const handleAddMoment = () => {
    // Same affordance as the PillTabBar camera pill — see app/(tabs)/_layout.tsx.
    useCameraSheetStore.getState().open();
  };

  const isEmpty =
    vm.hasFetchedOnce && vm.pins.length === 0 && vm.selectedPin === null;

  return (
    // SafeScreen would inset top/bottom which the map should bleed under, so
    // we use a plain bg-bg container and let MapView consume the full frame.
    // The PillTabBar already floats above with its own home-indicator inset.
    <View className="flex-1 bg-bg">
      {vm.isMapReady ? (
        <Mapbox.MapView
          style={MAP_STYLE}
          styleURL={env.mapboxStyleUrl}
          onCameraChanged={vm.onCameraChanged}
          // Defer-Q2: do NOT mount <UserLocation> — Reanimated v4 + iOS 26
          // crash documented in mobile-rework.md.
          attributionEnabled
          logoEnabled
          compassEnabled={false}
          scaleBarEnabled={false}
        >
          <Mapbox.Camera
            defaultSettings={{
              centerCoordinate: INITIAL_CENTER,
              zoomLevel: INITIAL_ZOOM,
            }}
            maxBounds={VN_BOUNDS}
          />
          {vm.pins.map((pin: MapMomentPin) => (
            <Mapbox.MarkerView
              key={pin.id}
              coordinate={[pin.longitude, pin.latitude]}
              anchor={{ x: 0.5, y: 1 }}
              allowOverlap
            >
              <PinView
                moment={pin}
                isActive={vm.selectedPin?.id === pin.id}
                onPress={() => vm.selectPin(pin)}
              />
            </Mapbox.MarkerView>
          ))}
        </Mapbox.MapView>
      ) : null}

      {/* Token-missing dev banner. Reachable when env.mapboxToken === '' so
          designers can still QA the empty-state UI without a real token. */}
      {vm.isTokenMissing ? (
        <View className="absolute top-12 left-4 right-4 rounded-xl bg-ink/85 px-4 py-3">
          <Text className="text-bg font-body text-[12px]">
            {t('map.tokenMissing')}
          </Text>
        </View>
      ) : null}

      {/* Top-right "loading pins…" pill. Idle = hidden. */}
      {vm.isLoadingPins ? (
        <View className="absolute top-12 right-4 flex-row items-center rounded-full bg-surface px-3 py-1.5 shadow-sm">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text className="ml-2 text-[12px] font-body text-ink">
            {t('map.loadingPins')}
          </Text>
        </View>
      ) : null}

      {/* Empty state — Scenario 5. Only when we've successfully fetched at
          least once and nothing came back. Avoids flashing the prompt during
          the initial pre-fetch frame. */}
      {isEmpty ? (
        <View
          pointerEvents="box-none"
          className="absolute inset-0 items-center justify-center px-8"
        >
          <View className="rounded-2xl bg-surface/95 px-6 py-6 items-center max-w-[340px] shadow-sm">
            <Text className="text-lg font-displayMedium text-ink text-center">
              {t('map.empty.title')}
            </Text>
            <Text className="mt-2 text-[13px] font-body text-ink/70 text-center">
              {t('map.empty.body')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleAddMoment}
              className="mt-4 rounded-full bg-primary py-3 px-5 active:opacity-90"
            >
              <Text className="text-bg font-bodyMedium">{t('map.empty.cta')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <MomentPreviewCard
        moment={vm.selectedPin}
        onOpenFull={handleOpenFull}
        onClose={() => vm.selectPin(null)}
      />
    </View>
  );
}
