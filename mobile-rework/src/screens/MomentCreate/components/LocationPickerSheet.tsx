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
// Sprint 55 bug). snapPoint 75% gives the keyboard room without covering
// the top status bar.
//
// Flow: debounced (400ms) forward geocode as the user types; separate "use
// current location" button triggers expo-location permission + GPS fix →
// reverse geocode → apply the first feature's place_name. Results list is
// capped at 5 (backend clamps limit to 10 but 5 is enough for the row copy).
//
// Clear option: rendered as its own destructive-styled row at the top of
// the list when a value is already set, per spec §4.

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
    }
  }, [visible]);

  // Debounced forward geocode — 400ms per spec. Bails on empty string and
  // also on an "unchanged" query (Strict Mode double-invoke safe).
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setSearching(false);
      setSearchError(false);
      return;
    }
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
  const snapPoints = useMemo(() => ['75%'], []);

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
      onPick(feature.place_name);
    },
    [onPick],
  );

  const onClearPress = useCallback(() => {
    onClear();
  }, [onClear]);

  const containerComponent = Platform.OS === 'ios' ? iOSContainer : undefined;

  const hasValue = !!value && value.trim().length > 0;
  const showInitialState = query.trim().length < 1 && !searchError;
  const showEmptyResults =
    query.trim().length >= 1 && !searching && !searchError && results.length === 0;

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

          {!searching && results.length > 0
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
