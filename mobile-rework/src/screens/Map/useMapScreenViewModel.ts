// T472 (Sprint 70) — Memory Map. ViewModel holds:
//   - Mapbox access-token bootstrap (idempotent — module-level guard so a tab
//     remount doesn't re-call the native bridge).
//   - Pin set + last-fetched bounds + in-flight indicator.
//   - 300ms debounced viewport refetch hook (`onCameraChange`) — debounce
//     resets on every camera tick during a continuous pan, fires once when
//     the user holds still. Stale closures avoided with refs.
//   - `selectedPin` state for the preview card overlay.
//
// View (MapScreen.tsx) consumes only the surface returned by the hook — no
// fetch / setAccessToken / debounce logic leaks into the View per Hard Rule
// #1 (MVVM).

import { useCallback, useEffect, useRef, useState } from 'react';

import Mapbox from '@rnmapbox/maps';

import { fetchMomentPins } from '@/api/map';
import { env } from '@/config/env';
import type { MapBounds, MapMomentPin } from '@/screens/Map/types';

// Module-level guard so multiple ViewModel mounts (tab focus/blur cycle) don't
// re-issue `setAccessToken`. The native bridge is patient about it, but the
// call returns a Promise we'd otherwise leak — cheaper to just fire once.
let mapboxTokenInitialized = false;

// Spec Q1 verdict: defer toast on fetch failure. We log + keep last-known set.
function logFetchError(err: unknown) {
  // eslint-disable-next-line no-console
  console.warn('[MapScreen] fetch pins failed (silent fallback):', err);
}

export type MapScreenVM = {
  // Bootstrap surface — true once `setAccessToken` has been issued (or skipped
  // because the token is empty). View uses this to decide whether to mount
  // <MapView> at all.
  isMapReady: boolean;
  isTokenMissing: boolean;

  // Data surface.
  pins: MapMomentPin[];
  isLoadingPins: boolean;
  hasFetchedOnce: boolean;

  // Selection surface (for MomentPreviewCard).
  selectedPin: MapMomentPin | null;
  selectPin: (pin: MapMomentPin | null) => void;

  // Camera event → debounced fetch. Wire to <MapView onCameraChanged>.
  onCameraChanged: (state: {
    properties: { bounds: { ne: [number, number]; sw: [number, number] } };
  }) => void;
};

const DEBOUNCE_MS = 300;

export function useMapScreenViewModel(): MapScreenVM {
  const [isMapReady, setIsMapReady] = useState<boolean>(mapboxTokenInitialized);
  const [pins, setPins] = useState<MapMomentPin[]>([]);
  const [isLoadingPins, setIsLoadingPins] = useState<boolean>(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState<boolean>(false);
  const [selectedPin, setSelectedPin] = useState<MapMomentPin | null>(null);

  const isTokenMissing = env.mapboxToken.length === 0;

  // Bootstrap the token once. Empty-token case still marks "ready" so the
  // empty-state UI (with dev banner) is reachable — Q2 verdict from spec.
  useEffect(() => {
    if (mapboxTokenInitialized) {
      setIsMapReady(true);
      return;
    }
    if (isTokenMissing) {
      mapboxTokenInitialized = true;
      setIsMapReady(true);
      return;
    }
    Mapbox.setAccessToken(env.mapboxToken)
      .then(() => {
        mapboxTokenInitialized = true;
        setIsMapReady(true);
      })
      .catch((err) => {
        // Same silent-fail policy as fetch — log + still mark ready so the
        // UI doesn't deadlock.
        logFetchError(err);
        mapboxTokenInitialized = true;
        setIsMapReady(true);
      });
  }, [isTokenMissing]);

  // Debounce primitive. Single timer ref + latest-bounds ref so callbacks
  // captured by the MapView don't go stale across renders.
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestBoundsRef = useRef<MapBounds | null>(null);
  const inFlightRef = useRef<boolean>(false);

  const flushFetch = useCallback(async () => {
    const bounds = latestBoundsRef.current;
    if (!bounds) return;
    // Drop the call if SW > NE (degenerate map states during initial layout
    // emit zero-area boxes — BE would reject them anyway).
    if (bounds.south > bounds.north || bounds.west > bounds.east) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsLoadingPins(true);
    try {
      const fresh = await fetchMomentPins(bounds);
      setPins(fresh);
    } catch (err) {
      logFetchError(err);
      // Keep last-known set — do not blank the map on transient errors.
    } finally {
      inFlightRef.current = false;
      setIsLoadingPins(false);
      setHasFetchedOnce(true);
    }
  }, []);

  const onCameraChanged = useCallback<MapScreenVM['onCameraChanged']>(
    (state) => {
      const ne = state.properties?.bounds?.ne;
      const sw = state.properties?.bounds?.sw;
      if (!ne || !sw) return;
      // Mapbox conventions: Position is `[lng, lat]`.
      const bounds: MapBounds = {
        south: sw[1],
        west: sw[0],
        north: ne[1],
        east: ne[0],
      };
      latestBoundsRef.current = bounds;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null;
        void flushFetch();
      }, DEBOUNCE_MS);
    },
    [flushFetch],
  );

  // Cleanup any pending timer if the screen unmounts mid-debounce.
  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    [],
  );

  const selectPin = useCallback((pin: MapMomentPin | null) => {
    setSelectedPin(pin);
  }, []);

  return {
    isMapReady,
    isTokenMissing,
    pins,
    isLoadingPins,
    hasFetchedOnce,
    selectedPin,
    selectPin,
    onCameraChanged,
  };
}
