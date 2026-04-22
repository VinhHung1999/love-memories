import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { Crosshair, MapPin, Trash2, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type PlaceFeature, reverseGeocode, searchPlaces } from '@/api/location';
import { useAppColors } from '@/theme/ThemeProvider';

// T399 (Sprint 63) — BottomSheet picker for the Compose location pill.
// Presentation: fullScreenModal parent needs FullWindowOverlay on iOS or
// touches get intercepted (documented in mobile-rework rules, burned by
// Sprint 55 bug).
//
// T404 (Build 55 fix): snapPoint bumped 75% → 90% — Boss had to drag up
// on every open to reach the search input + result list. 90% leaves just
// enough top gap to show we're in a sheet without cropping the results.
//
// Flow: debounced (400ms) forward geocode as the user types; separate "use
// current location" button triggers expo-location permission + GPS fix →
// reverse geocode → apply the first feature's place_name. Results list is
// capped at 5 (backend clamps limit to 10 but 5 is enough for the row copy).
//
// T404 (Build 55 fix): if the input matches a Google Maps share URL
// (maps.app.goo.gl / google.com/maps / maps.google.com), skip the places
// API (would 400 on a URL anyway) and try to extract a place name:
//   - maps.app.goo.gl short URLs are expanded via `fetch().url` which
//     reads the final URL after redirects.
//   - /maps/place/NAME/ path segment or ?q=NAME query param is
//     URL-decoded into a readable name.
//   - Fallback: paste the raw URL as location text. BE column is string
//     max 120, so onPick trims before submit.
// Result renders as a single tappable "Maps link" row instead of the
// normal search results list.
//
// Clear option: rendered as its own destructive-styled row at the top of
// the list when a value is already set, per spec §4.

const MAPS_URL_RE =
  /^https?:\/\/(?:maps\.app\.goo\.gl|(?:www\.)?google\.com\/maps|maps\.google\.com)/i;
const LOCATION_MAX_CHARS = 120;

function isMapsUrl(s: string): boolean {
  return MAPS_URL_RE.test(s.trim());
}

// Extract a readable place name from an expanded Google Maps URL. Returns
// null if the URL only carries coordinates (e.g. "?q=10.77,106.70") or if
// no recognisable name pattern is present. Pure regex so no URL polyfill
// dependency.
function parsePlaceNameFromMapsUrl(url: string): string | null {
  const trimmed = url.trim();
  const isCoords = (s: string) => /^[-+]?\d[\d., +-]*$/.test(s);

  const pathMatch = trimmed.match(/\/maps\/place\/([^/?#]+)/i);
  if (pathMatch) {
    try {
      const decoded = decodeURIComponent(pathMatch[1].replace(/\+/g, ' '));
      if (decoded && !isCoords(decoded)) return decoded;
    } catch {
      /* fall through */
    }
  }

  const qMatch = trimmed.match(/[?&](?:q|query|destination)=([^&#]+)/i);
  if (qMatch) {
    try {
      const decoded = decodeURIComponent(qMatch[1].replace(/\+/g, ' '));
      if (decoded && !isCoords(decoded)) return decoded;
    } catch {
      /* fall through */
    }
  }

  return null;
}

// Expand a maps.app.goo.gl short URL to its final form via fetch redirect.
// `res.url` on iOS/Android reflects the post-redirect URL. Non-short URLs
// pass through. Network failure falls back to the input URL.
async function resolveMapsUrl(url: string): Promise<string> {
  const trimmed = url.trim();
  if (!/maps\.app\.goo\.gl/i.test(trimmed)) return trimmed;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(trimmed, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    return res.url && res.url !== trimmed ? res.url : trimmed;
  } catch {
    return trimmed;
  }
}

type Props = {
  visible: boolean;
  value: string | null;
  onPick: (placeName: string) => void;
  onClear: () => void;
  onClose: () => void;
};

function iOSContainer(props: { children?: React.ReactNode }) {
  return <FullWindowOverlay>{props.children}</FullWindowOverlay>;
}

export function LocationPickerSheet({
  visible,
  value,
  onPick,
  onClear,
  onClose,
}: Props) {
  const ref = useRef<BottomSheetModal>(null);
  const { t } = useTranslation();
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceFeature[]>([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [gpsError, setGpsError] = useState<
    null | 'permission' | 'unavailable' | 'network'
  >(null);

  // T404 — holds the parsed place name (or raw URL fallback) when the
  // user has pasted a Google Maps share link. Non-null → render a single
  // "Maps link" row instead of the normal places result list.
  const [urlFallback, setUrlFallback] = useState<string | null>(null);
  const [urlResolving, setUrlResolving] = useState(false);

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  // Reset transient state on every open — a stale query/results set from a
  // previous session bleeds visually for a frame before the first keystroke
  // clears it.
  useEffect(() => {
    if (visible) {
      setQuery('');
      setResults([]);
      setSearching(false);
      setSearchError(false);
      setGpsError(null);
      setUrlFallback(null);
      setUrlResolving(false);
    }
  }, [visible]);

  // Debounced forward geocode — 400ms per spec. Bails on empty string and
  // also on an "unchanged" query (Strict Mode double-invoke safe).
  //
  // T404: short-circuit when the query looks like a Google Maps share URL.
  // Calling searchPlaces with a URL would 400 at the Mapbox layer; instead
  // expand the short URL (if any), parse a place name from /maps/place/
  // or ?q=, and surface it as a single "Maps link" row. If parsing fails,
  // fall back to the raw URL as the location string (BE stores string 120).
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setSearching(false);
      setSearchError(false);
      setUrlFallback(null);
      setUrlResolving(false);
      return;
    }

    if (isMapsUrl(trimmed)) {
      setResults([]);
      setSearching(false);
      setSearchError(false);
      setUrlFallback(null);
      setUrlResolving(true);
      let cancelled = false;
      (async () => {
        const expanded = await resolveMapsUrl(trimmed);
        if (cancelled) return;
        const parsed = parsePlaceNameFromMapsUrl(expanded);
        setUrlFallback(parsed ?? trimmed);
        setUrlResolving(false);
      })();
      return () => {
        cancelled = true;
      };
    }

    setUrlFallback(null);
    setUrlResolving(false);
    setSearching(true);
    setSearchError(false);
    let cancelled = false;
    const tid = setTimeout(async () => {
      try {
        const features = await searchPlaces(trimmed, { limit: 5 });
        if (cancelled) return;
        setResults(features);
        setSearching(false);
      } catch {
        if (cancelled) return;
        setResults([]);
        setSearching(false);
        setSearchError(true);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(tid);
    };
  }, [query]);

  const renderBackdrop = useCallback(
    (p: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...p}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.45}
      />
    ),
    [],
  );

  // @gorhom/bottom-sheet carve-out: native-only props can't take className.
  const backgroundStyle = { backgroundColor: c.bg };
  const handleIndicatorStyle = { backgroundColor: c.line };
  const snapPoints = useMemo(() => ['90%'], []);

  const onUseGps = useCallback(async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setGpsError('permission');
        setGpsLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const feature = await reverseGeocode(
        pos.coords.latitude,
        pos.coords.longitude,
      );
      if (!feature?.place_name) {
        setGpsError('unavailable');
        setGpsLoading(false);
        return;
      }
      onPick(feature.place_name);
      setGpsLoading(false);
    } catch {
      setGpsError('network');
      setGpsLoading(false);
    }
  }, [onPick]);

  const onPickFeature = useCallback(
    (feature: PlaceFeature) => {
      onPick(feature.place_name.slice(0, LOCATION_MAX_CHARS));
    },
    [onPick],
  );

  // T404 — picking a Maps-link result. Trim to 120 char BE limit so a
  // very long google.com/maps/place/... URL doesn't reject on submit.
  const onPickUrlFallback = useCallback(() => {
    if (!urlFallback) return;
    onPick(urlFallback.slice(0, LOCATION_MAX_CHARS));
  }, [onPick, urlFallback]);

  const onClearPress = useCallback(() => {
    onClear();
  }, [onClear]);

  const containerComponent = Platform.OS === 'ios' ? iOSContainer : undefined;

  const hasValue = !!value && value.trim().length > 0;
  const showUrlRow = urlFallback !== null;
  const showInitialState =
    query.trim().length < 1 && !searchError && !urlResolving && !showUrlRow;
  const showEmptyResults =
    query.trim().length >= 1 &&
    !searching &&
    !searchError &&
    !urlResolving &&
    !showUrlRow &&
    results.length === 0;

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      containerComponent={containerComponent}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onDismiss={onClose}
    >
      <BottomSheetView
        className="flex-1"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
          <Text className="font-displayMedium text-ink text-[20px] leading-[24px]">
            {t('compose.momentCreate.location.sheetTitle')}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('compose.momentCreate.close')}
            hitSlop={8}
            className="w-9 h-9 rounded-full bg-surface border border-line-on-surface items-center justify-center active:opacity-80"
          >
            <X size={16} strokeWidth={2.3} color={c.ink} />
          </Pressable>
        </View>

        {/* Search input */}
        <View className="px-5">
          <View
            className="flex-row items-center gap-2 px-3.5 h-11 rounded-2xl border"
            style={{ backgroundColor: c.surface, borderColor: c.lineOnSurface }}
          >
            <MapPin size={15} strokeWidth={2} color={c.inkMute} />
            <BottomSheetTextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('compose.momentCreate.location.searchPlaceholder')}
              placeholderTextColor={c.inkMute}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              className="flex-1 font-body text-ink text-[15px] p-0"
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery('')}
                accessibilityRole="button"
                accessibilityLabel={t('compose.momentCreate.location.clearQuery')}
                hitSlop={6}
              >
                <X size={14} strokeWidth={2.3} color={c.inkMute} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* GPS button */}
        <View className="px-5 pt-3">
          <Pressable
            onPress={onUseGps}
            accessibilityRole="button"
            disabled={gpsLoading}
            className="flex-row items-center gap-2 px-4 h-11 rounded-2xl border active:opacity-80"
            style={{
              backgroundColor: c.primarySoft,
              borderColor: c.primarySoft,
              opacity: gpsLoading ? 0.6 : 1,
            }}
          >
            {gpsLoading ? (
              <ActivityIndicator size="small" color={c.primaryDeep} />
            ) : (
              <Crosshair size={15} strokeWidth={2} color={c.primaryDeep} />
            )}
            <Text
              className="font-bodySemibold text-[14px]"
              style={{ color: c.primaryDeep }}
            >
              {t('compose.momentCreate.location.useGps')}
            </Text>
          </Pressable>
          {gpsError ? (
            <Text className="mt-2 font-body text-ink-mute text-[12px] leading-[16px]">
              {t(`compose.momentCreate.location.gpsError.${gpsError}`)}
            </Text>
          ) : null}
        </View>

        {/* Clear row (only when a value already set) */}
        {hasValue ? (
          <View className="px-5 pt-3">
            <Pressable
              onPress={onClearPress}
              accessibilityRole="button"
              className="flex-row items-center gap-2 px-4 h-11 rounded-2xl border border-line-on-surface active:opacity-80"
            >
              <Trash2 size={15} strokeWidth={2} color={c.primary} />
              <Text
                className="font-bodySemibold text-[14px]"
                style={{ color: c.primary }}
              >
                {t('compose.momentCreate.location.clear')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Results */}
        <BottomSheetScrollView
          className="flex-1 mt-3"
          contentContainerClassName="px-5 pb-6"
          keyboardShouldPersistTaps="handled"
        >
          {urlResolving ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color={c.primary} />
            </View>
          ) : null}

          {showUrlRow && urlFallback ? (
            <MapsLinkRow
              value={urlFallback}
              hint={t('compose.momentCreate.location.mapLinkHint')}
              onPress={onPickUrlFallback}
            />
          ) : null}

          {searching ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color={c.primary} />
            </View>
          ) : null}

          {searchError ? (
            <Text className="py-6 text-center font-body text-ink-mute text-[13px]">
              {t('compose.momentCreate.location.searchError')}
            </Text>
          ) : null}

          {showEmptyResults ? (
            <Text className="py-6 text-center font-body text-ink-mute text-[13px]">
              {t('compose.momentCreate.location.noResults')}
            </Text>
          ) : null}

          {showInitialState && !hasValue ? (
            <Text className="py-6 text-center font-body text-ink-mute text-[13px]">
              {t('compose.momentCreate.location.initialHint')}
            </Text>
          ) : null}

          {!searching && !showUrlRow && results.length > 0
            ? results.map((feature) => (
                <ResultRow
                  key={feature.id}
                  feature={feature}
                  onPress={() => onPickFeature(feature)}
                />
              ))
            : null}
        </BottomSheetScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

type ResultRowProps = {
  feature: PlaceFeature;
  onPress: () => void;
};

type MapsLinkRowProps = {
  value: string;
  hint: string;
  onPress: () => void;
};

// T404 — renders the Google-Maps-link "tap to use" row. Primary line shows
// the parsed place name (or truncated URL if parsing failed); subtitle is
// a localised hint. Matches ResultRow layout so the list reads uniform.
function MapsLinkRow({ value, hint, onPress }: MapsLinkRowProps) {
  const c = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-start gap-3 py-3 active:opacity-70"
    >
      <View
        className="w-8 h-8 rounded-full items-center justify-center mt-0.5"
        style={{ backgroundColor: c.primarySoft }}
      >
        <MapPin size={14} strokeWidth={2} color={c.primaryDeep} />
      </View>
      <View className="flex-1">
        <Text
          className="font-bodySemibold text-ink text-[14px] leading-[20px]"
          numberOfLines={1}
        >
          {value}
        </Text>
        <Text
          className="font-body text-ink-mute text-[12px] leading-[16px]"
          numberOfLines={1}
        >
          {hint}
        </Text>
      </View>
    </Pressable>
  );
}

function ResultRow({ feature, onPress }: ResultRowProps) {
  const c = useAppColors();
  // Mapbox place_name is comma-joined hierarchy. Split for a two-line row:
  // first segment is the primary label, the remainder is the subtitle.
  const parts = feature.place_name.split(', ');
  const primary = parts[0] ?? feature.place_name;
  const subtitle = parts.slice(1).join(', ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-start gap-3 py-3 active:opacity-70"
    >
      <View
        className="w-8 h-8 rounded-full items-center justify-center mt-0.5"
        style={{ backgroundColor: c.surfaceAlt }}
      >
        <MapPin size={14} strokeWidth={2} color={c.inkMute} />
      </View>
      <View className="flex-1">
        <Text
          className="font-bodySemibold text-ink text-[14px] leading-[20px]"
          numberOfLines={1}
        >
          {primary}
        </Text>
        {subtitle.length > 0 ? (
          <Text
            className="font-body text-ink-mute text-[12px] leading-[16px]"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
