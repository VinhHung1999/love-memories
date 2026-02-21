import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { Heart, Utensils, Filter } from 'lucide-react';
import { mapApi, tagsApi } from '../lib/api';
import type { MapPin } from '../types';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const EMOJI_PRESETS = [
  { label: 'Food',       emojis: ['🍜','🍕','🍣','🍰','☕','🍺','🧋','🍝'] },
  { label: 'Places',     emojis: ['🏖️','🏔️','🎬','🏠','🛒','🏥','✈️','🏨'] },
  { label: 'Activities', emojis: ['🎵','💪','🎮','📸','🎂','💕','🛍️','📚'] },
  { label: 'Nature',     emojis: ['🌸','🌊','🌅','🌴','🌙','⭐','🌿','🦋'] },
];

function EmojiPickerPopup({
  tag,
  currentEmoji,
  onSelect,
  onClose,
}: {
  tag: string;
  currentEmoji: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const [custom, setCustom] = useState('');
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // animate in
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  // click-outside
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 z-30 mt-1.5 bg-white rounded-2xl shadow-2xl border border-black/5 p-3 w-64"
      style={{
        top: '100%',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.97)',
        transformOrigin: 'top left',
      }}
    >
      <div className="text-[10px] font-semibold text-text-light uppercase tracking-wider mb-2.5">
        Icon cho <span className="text-text">#{tag}</span>
      </div>

      {EMOJI_PRESETS.map((cat) => (
        <div key={cat.label} className="mb-2.5">
          <div className="text-[9px] text-text-light/50 font-medium uppercase tracking-wide mb-1">
            {cat.label}
          </div>
          <div className="grid grid-cols-8 gap-0.5">
            {cat.emojis.map((em) => (
              <button
                key={em}
                onClick={() => onSelect(em)}
                className={`h-8 rounded-lg text-base flex items-center justify-center transition-all active:scale-90 ${
                  currentEmoji === em
                    ? 'bg-accent/15 ring-1 ring-accent/50 scale-110'
                    : 'hover:bg-gray-100'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="border-t border-black/5 pt-2.5 mt-0.5">
        <div className="text-[9px] text-text-light/50 font-medium uppercase tracking-wide mb-1">
          Custom
        </div>
        <div className="flex gap-1.5 items-center">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Paste emoji…"
            className="flex-1 text-sm border border-border rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/30 text-center"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && custom.trim()) onSelect(custom.trim());
              if (e.key === 'Escape') onClose();
            }}
          />
          {custom.trim() && (
            <button
              onClick={() => onSelect(custom.trim())}
              className="px-2.5 py-1.5 bg-accent text-white text-xs rounded-xl font-semibold transition-colors hover:bg-accent/90"
            >
              ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'moment' | 'foodspot'>('all');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [pickerTag, setPickerTag] = useState<string | null>(null);

  const { data: pins = [] } = useQuery({
    queryKey: ['map-pins'],
    queryFn: mapApi.pins,
  });

  const { data: tagMetaList = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.list,
  });

  const tagMap = Object.fromEntries(tagMetaList.map((t) => [t.name, t]));

  const upsertTagMutation = useMutation({
    mutationFn: ({ name, icon }: { name: string; icon: string }) => tagsApi.upsert(name, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['map-pins'] });
      setPickerTag(null);
    },
  });

  const closePicker = useCallback(() => setPickerTag(null), []);

  const handleEmojiSelect = (tag: string, emoji: string) => {
    upsertTagMutation.mutate({ name: tag, icon: emoji });
  };

  const validPins = pins.filter((p) =>
    p.latitude >= -90 && p.latitude <= 90 && p.longitude >= -180 && p.longitude <= 180
  );

  const allTags = Array.from(new Set(validPins.flatMap((p) => p.tags))).sort();

  const filteredPins = validPins.filter((p) => {
    const typeOk = filter === 'all' || p.type === filter;
    const tagOk = selectedTags.size === 0 || p.tags.some((t) => selectedTags.has(t));
    return typeOk && tagOk;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  };

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    if (!mapboxgl.accessToken) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [106.6297, 10.8231],
      zoom: 12,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });
    mapRef.current.addControl(geolocate, 'bottom-right');
    mapRef.current.on('load', () => geolocate.trigger());

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredPins.forEach((pin) => {
      const defaultIcon = pin.type === 'moment' ? '❤️' : '🍴';
      const icon = pin.tagIcon || defaultIcon;

      const el = document.createElement('div');
      el.className = 'map-marker';
      el.style.cssText = `
        width: 36px; height: 36px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        background: ${pin.type === 'moment' ? '#E8788A' : '#F4A261'};
        font-size: 18px; line-height: 1;
      `;
      el.textContent = icon;

      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pin.latitude},${pin.longitude}`;
      const detailPath = pin.type === 'moment' ? `/moments/${pin.id}` : `/foodspots/${pin.id}`;
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="padding: 12px; min-width: 160px;">
          ${pin.thumbnail ? `<img src="${pin.thumbnail}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />` : ''}
          <div style="font-weight:600;font-size:14px;">${pin.title}</div>
          ${pin.location ? `<div style="font-size:12px;color:#6B7280;margin-top:2px;">${pin.location}</div>` : ''}
          <div style="display:flex;gap:6px;margin-top:8px;">
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#E8788A1A;color:#E8788A;border-radius:999px;font-size:11px;font-weight:600;text-decoration:none;">
              ↗ Chỉ đường
            </a>
            <button data-detail-path="${detailPath}" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#7EC8B51A;color:#7EC8B5;border:none;border-radius:999px;font-size:11px;font-weight:600;cursor:pointer;">
              ◉ Chi tiết
            </button>
          </div>
        </div>
      `);

      popup.on('open', () => {
        setTimeout(() => {
          const el2 = popup.getElement();
          const btn = el2?.querySelector('[data-detail-path]') as HTMLElement | null;
          if (btn) {
            btn.addEventListener('click', () => navigate(btn.dataset.detailPath!));
          }
        }, 0);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.longitude, pin.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    if (filteredPins.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredPins.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    }
  }, [filteredPins, navigate]);

  if (!mapboxgl.accessToken) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h2 className="font-heading text-2xl font-bold mb-2">Map View</h2>
        <p className="text-text-light max-w-md">
          To enable the map, set your Mapbox token in <code className="bg-gray-100 px-2 py-0.5 rounded">frontend/.env</code> as <code className="bg-gray-100 px-2 py-0.5 rounded">VITE_MAPBOX_TOKEN</code>
        </p>
        <p className="text-text-light text-sm mt-2">
          {pins.length} pins available ({pins.filter((p: MapPin) => p.type === 'moment').length} moments, {pins.filter((p: MapPin) => p.type === 'foodspot').length} food spots)
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] md:h-[calc(100vh-3rem)] relative">
      {/* Filter Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-[calc(100%-2rem)]">
        {/* Type filter */}
        <div className="flex gap-2 bg-white rounded-xl shadow-lg p-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              filter === 'all' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
            }`}
          >
            <Filter className="w-3 h-3" /> All
          </button>
          <button
            onClick={() => setFilter('moment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              filter === 'moment' ? 'bg-primary text-white' : 'hover:bg-gray-100'
            }`}
          >
            <Heart className="w-3 h-3" /> Moments
          </button>
          <button
            onClick={() => setFilter('foodspot')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              filter === 'foodspot' ? 'bg-secondary text-white' : 'hover:bg-gray-100'
            }`}
          >
            <Utensils className="w-3 h-3" /> Food
          </button>
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="relative">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 max-w-full hide-scrollbar">
              {allTags.map((tag) => {
                const meta = tagMap[tag];
                const emoji = meta?.icon || '🏷️';
                const isActive = selectedTags.has(tag);
                const isPickerOpen = pickerTag === tag;
                return (
                  <div key={tag} className="flex-shrink-0">
                    <div
                      className={`flex items-center rounded-full shadow transition-all ${
                        isActive ? 'bg-accent text-white' : 'bg-white text-text-light'
                      } ${isPickerOpen ? 'ring-2 ring-accent/50' : ''}`}
                    >
                      {/* Emoji — tap to open picker */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPickerTag(isPickerOpen ? null : tag);
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-transform active:scale-90 ${
                          isPickerOpen ? 'bg-accent/20' : 'hover:bg-black/5'
                        }`}
                        title="Set icon"
                      >
                        {emoji}
                      </button>
                      {/* Tag name — tap to toggle filter */}
                      <button
                        onClick={() => toggleTag(tag)}
                        className="pr-2.5 text-xs font-medium"
                      >
                        #{tag}
                      </button>
                    </div>
                  </div>
                );
              })}
              {selectedTags.size > 0 && (
                <button
                  onClick={() => setSelectedTags(new Set())}
                  className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-text-light hover:bg-gray-200 shadow transition-colors"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Emoji Picker Popup */}
            {pickerTag && (
              <EmojiPickerPopup
                tag={pickerTag}
                currentEmoji={tagMap[pickerTag]?.icon || '🏷️'}
                onSelect={(emoji) => handleEmojiSelect(pickerTag, emoji)}
                onClose={closePicker}
              />
            )}
          </div>
        )}
      </div>

      <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden" />
    </div>
  );
}
