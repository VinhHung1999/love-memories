import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { Search, MapPin, X, LocateFixed } from 'lucide-react';

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
  onChange: (data: { latitude: number; longitude: number; location: string }) => void;
  onClear?: () => void;
}

interface GeoResult {
  place_name: string;
  center: [number, number]; // [lng, lat]
}

export default function LocationPicker({ latitude, longitude, location, onChange, onClear }: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const token = mapboxgl.accessToken;

  // Get current location via browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        updateMarker(lng, lat);
        // Reverse geocode
        if (token) {
          try {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1&language=vi&country=vn`
            );
            const data = await res.json();
            const placeName = data.features?.[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            onChange({ latitude: lat, longitude: lng, location: placeName });
            setQuery(placeName);
          } catch {
            onChange({ latitude: lat, longitude: lng, location: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
          }
        } else {
          onChange({ latitude: lat, longitude: lng, location: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
        }
        setGettingLocation(false);
      },
      () => { setGettingLocation(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Search geocoding API
  const searchLocation = useCallback(async (q: string) => {
    if (!q.trim() || !token) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&limit=5&language=vi&country=vn`
      );
      const data = await res.json();
      setResults(data.features || []);
    } catch {
      setResults([]);
    }
    setSearching(false);
  }, [token]);

  // Debounced search
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocation(value), 400);
  };

  // Select a geocoding result
  const selectResult = (result: GeoResult) => {
    const [lng, lat] = result.center;
    onChange({ latitude: lat, longitude: lng, location: result.place_name });
    setQuery(result.place_name);
    setResults([]);
    updateMarker(lng, lat);
  };

  // Update marker on map
  const updateMarker = (lng: number, lat: number) => {
    if (!mapRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
      markerRef.current = new mapboxgl.Marker({ color: '#E8788A' })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    }
    mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
  };

  // Init map
  useEffect(() => {
    if (!showMap || !mapContainer.current || mapRef.current || !token) return;

    const center: [number, number] = longitude && latitude ? [longitude, latitude] : [106.6297, 10.8231];

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: latitude ? 15 : 12,
    });

    // Click to place marker
    mapRef.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      updateMarker(lng, lat);

      // Reverse geocode
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1&language=vi&country=vn`
        );
        const data = await res.json();
        const placeName = data.features?.[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onChange({ latitude: lat, longitude: lng, location: placeName });
        setQuery(placeName);
      } catch {
        onChange({ latitude: lat, longitude: lng, location: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
      }
    });

    // If there's already a position, add marker
    if (latitude && longitude) {
      markerRef.current = new mapboxgl.Marker({ color: '#E8788A' })
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [showMap]);

  const hasLocation = latitude && longitude;

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search for a place..."
          className="w-full border border-border rounded-xl pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-3.5 h-3.5 text-text-light" />
          </button>
        )}

        {/* Search results dropdown */}
        {results.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectResult(r)}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary/5 flex items-start gap-2 border-b border-border last:border-0"
              >
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{r.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current location display */}
      {hasLocation && (
        <div className="flex items-center gap-2 text-xs text-text-light bg-primary/5 px-3 py-2 rounded-lg">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="flex-1 truncate">{location || `${latitude}, ${longitude}`}</span>
          {onClear && (
            <button type="button" onClick={onClear} className="text-red-400 hover:text-red-500">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <LocateFixed className="w-3 h-3" />
          {gettingLocation ? 'Đang lấy...' : 'Vị trí hiện tại'}
        </button>
        <span className="text-border">|</span>
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="text-xs text-primary hover:underline"
        >
          {showMap ? 'Ẩn bản đồ' : 'Chọn trên bản đồ'}
        </button>
      </div>

      {/* Mini map */}
      {showMap && token && (
        <div
          ref={mapContainer}
          className="w-full h-48 rounded-xl overflow-hidden border border-border"
        />
      )}
    </div>
  );
}
