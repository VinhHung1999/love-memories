import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { LocateFixed, MapPin, XCircle } from 'lucide-react-native';
import { useAppColors } from '../navigation/theme';
import FieldLabel from './FieldLabel';
import { geocodeApi, resolveLocation as resolveLocationApi } from '../lib/api';
import t from '../locales/en';

// ── Constants ─────────────────────────────────────────────────────────────────

const HCMC_LNG = 106.6297;
const HCMC_LAT = 10.8231;

const GOOGLE_MAPS_RE =
  /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.com|www\.google\.com\/maps)/;

type GeoResult = { place_name: string; center: [number, number] };

/** Strip Vietnamese postal codes (e.g. ", 70000") from Mapbox place_name */
const cleanPlaceName = (name: string) =>
  name.replace(/,\s*\d{5,6}(?=\s*,|\s*$)/g, '').trim();

// ── Props ─────────────────────────────────────────────────────────────────────

export interface LocationPickerProps {
  location: string;
  latitude?: number;
  longitude?: number;
  onLocationChange: (location: string, lat?: number, lng?: number) => void;
  label?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LocationPicker({
  location,
  latitude,
  longitude,
  onLocationChange,
  label,
}: LocationPickerProps) {
  const colors = useAppColors();
  const [query, setQuery] = useState(location);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sync query when location prop changes from outside (e.g. edit mode load)
  useEffect(() => {
    setQuery(location);
  }, [location]);

  // ── Mapbox forward geocode ──────────────────────────────────────────────────

  const searchLocation = useCallback(
    async (q: string) => {
      if (!q.trim()) { setResults([]); return; }
      setIsSearching(true);
      const proxLng = longitude ?? HCMC_LNG;
      const proxLat = latitude ?? HCMC_LAT;
      const data = await geocodeApi.forward(q, `${proxLng},${proxLat}`);
      setResults(data.features ?? []);
      setIsSearching(false);
    },
    [latitude, longitude],
  );

  // ── Google Maps URL resolver ────────────────────────────────────────────────

  const resolveGoogleUrl = useCallback(
    async (url: string) => {
      setIsResolvingUrl(true);
      setResults([]);
      try {
        const data = await resolveLocationApi(url);
        const { latitude: lat, longitude: lng, name } = data;

        if (lat != null && lng != null) {
          // Got full coords — use directly
          onLocationChange(name, lat, lng);
          setQuery(name);
        } else {
          // Name only — forward geocode via backend proxy, pick first result
          const isCoords = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(name.trim());
          const businessName = isCoords ? '' : (name.split(',')[0] ?? name).trim();
          const geoData = await geocodeApi.forward(name, `${HCMC_LNG},${HCMC_LAT}`, 1);
          const first = geoData.features?.[0];
          if (first) {
            const [fLng, fLat] = first.center;
            const addr = cleanPlaceName(first.place_name);
            const placeName =
              businessName && !addr.includes(businessName)
                ? `${businessName}, ${addr}`
                : addr;
            onLocationChange(placeName, fLat, fLng);
            setQuery(placeName);
          } else {
            setQuery(name);
            onLocationChange(name, undefined, undefined);
          }
        }
      } catch {
        // silent — user can still search manually
      }
      setIsResolvingUrl(false);
    },
    [onLocationChange],
  );

  // ── Text input handler with debounce ───────────────────────────────────────

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!text.trim()) {
        setResults([]);
        onLocationChange('', undefined, undefined);
        return;
      }
      if (GOOGLE_MAPS_RE.test(text.trim())) {
        resolveGoogleUrl(text.trim());
        return;
      }
      debounceRef.current = setTimeout(() => searchLocation(text), 400);
    },
    [searchLocation, resolveGoogleUrl, onLocationChange],
  );

  // ── Select autocomplete result ─────────────────────────────────────────────

  const selectResult = (result: GeoResult) => {
    const [lng, lat] = result.center;
    const name = cleanPlaceName(result.place_name);
    onLocationChange(name, lat, lng);
    setQuery(name);
    setResults([]);
  };

  // ── Clear ──────────────────────────────────────────────────────────────────

  const handleClear = () => {
    setQuery('');
    setResults([]);
    onLocationChange('', undefined, undefined);
  };

  // ── GPS current location ───────────────────────────────────────────────────

  const handleGetGps = async () => {
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Allow access to your location to tag this moment',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        if (result !== PermissionsAndroid.RESULTS.GRANTED) return;
      } catch { return; }
    }
    setIsGettingLocation(true);
    Geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const data = await geocodeApi.reverse(lat, lng);
          const raw = data.features?.[0]?.place_name ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          const name = cleanPlaceName(raw);
          onLocationChange(name, lat, lng);
          setQuery(name);
        } catch {
          const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          onLocationChange(fallback, lat, lng);
          setQuery(fallback);
        }
        setIsGettingLocation(false);
      },
      () => setIsGettingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const isBusy = isResolvingUrl || isGettingLocation;
  const hasLocation = !!location.trim();

  return (
    <View className="mb-4">
      {label ? <FieldLabel>{label}</FieldLabel> : null}

      {/* Input row */}
      <View
        className="flex-row items-center rounded-2xl border-[1.5px] px-[14px] h-[50px] bg-inputBg"
        style={{ borderColor: isResolvingUrl ? colors.primaryShadow : colors.border }}>
        {isResolvingUrl ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
        ) : (
          <MapPin size={18} color={colors.textLight} strokeWidth={1.5} style={{ marginRight: 8 }} />
        )}

        <TextInput
          className="flex-1 text-base text-textDark"
          placeholder={
            isGettingLocation
              ? t.moments.create.gettingLocation
              : t.moments.create.addLocation
          }
          placeholderTextColor={colors.textLight}
          value={query}
          onChangeText={handleQueryChange}
          editable={!isBusy}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {/* Searching spinner */}
        {isSearching ? (
          <ActivityIndicator size="small" color={colors.textLight} style={{ marginLeft: 4 }} />
        ) : null}

        {/* GPS button — shown when no location selected */}
        {!hasLocation && !isResolvingUrl ? (
          <TouchableOpacity
            onPress={handleGetGps}
            disabled={isGettingLocation}
            className="w-8 h-8 rounded-full items-center justify-center ml-1"
            style={{ backgroundColor: isGettingLocation ? 'transparent' : colors.primaryMuted }}>
            {isGettingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <LocateFixed size={16} color={colors.primary} strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        ) : null}

        {/* Clear button — shown when location is set */}
        {hasLocation && !isBusy ? (
          <TouchableOpacity
            onPress={handleClear}
            className="w-8 h-8 rounded-full items-center justify-center ml-1">
            <XCircle size={18} color={colors.textLight} strokeWidth={1.5} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Autocomplete results */}
      {results.length > 0 ? (
        <View className="mt-1 rounded-2xl border border-border/60 overflow-hidden bg-white">
          {results.map((r, i) => (
            <Pressable
              key={i}
              onPress={() => selectResult(r)}
              className="flex-row items-start gap-3 px-4 py-3"
              style={{ borderBottomWidth: i < results.length - 1 ? 1 : 0, borderBottomColor: colors.border + '66' }}>
              <MapPin size={15} color={colors.primary} strokeWidth={1.5} style={{ marginTop: 2 }} />
              <Text className="flex-1 text-sm text-textDark" numberOfLines={2}>
                {cleanPlaceName(r.place_name)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
