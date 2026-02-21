import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { Heart, Utensils, Filter, Check } from 'lucide-react';
import { mapApi, tagsApi } from '../lib/api';
import type { MapPin } from '../types';

// You can set your Mapbox token here or via env
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'moment' | 'foodspot'>('all');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [emojiInput, setEmojiInput] = useState('');

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
      setEditingTag(null);
      setEmojiInput('');
    },
  });

  const openEmojiEditor = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmojiInput(tagMap[tag]?.icon || '');
    setEditingTag(tag);
  };

  const saveEmoji = (tag: string) => {
    if (!emojiInput.trim()) return;
    upsertTagMutation.mutate({ name: tag, icon: emojiInput.trim() });
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
      center: [106.6297, 10.8231], // Ho Chi Minh City default
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

    // Clear existing markers
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

    // Fit bounds if pins exist
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

        {/* Tag filter chips with emoji + inline editor */}
        {allTags.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 max-w-full hide-scrollbar">
              {allTags.map((tag) => {
                const meta = tagMap[tag];
                const emoji = meta?.icon || '🏷️';
                return (
                  <div key={tag} className="flex-shrink-0 flex items-center gap-0.5">
                    <button
                      onClick={() => toggleTag(tag)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shadow transition-colors ${
                        selectedTags.has(tag)
                          ? 'bg-accent text-white'
                          : 'bg-white text-text-light hover:bg-gray-50'
                      }`}
                    >
                      <span>{emoji}</span>
                      <span>#{tag}</span>
                    </button>
                    {/* Emoji edit button */}
                    <button
                      onClick={(e) => openEmojiEditor(tag, e)}
                      className="w-5 h-5 flex items-center justify-center rounded-full bg-white/80 text-text-light hover:text-primary shadow text-[10px] transition-colors md:opacity-0 md:hover:opacity-100"
                      title="Set icon"
                    >
                      ✏️
                    </button>
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

            {/* Inline emoji editor */}
            {editingTag && (
              <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg px-3 py-2 w-fit">
                <span className="text-xs text-text-light font-medium">#{editingTag}</span>
                <input
                  value={emojiInput}
                  onChange={(e) => setEmojiInput(e.target.value)}
                  placeholder="emoji"
                  className="w-14 border border-border rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent/30"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEmoji(editingTag);
                    if (e.key === 'Escape') { setEditingTag(null); setEmojiInput(''); }
                  }}
                />
                <button
                  onClick={() => saveEmoji(editingTag)}
                  disabled={!emojiInput.trim() || upsertTagMutation.isPending}
                  className="p-1 bg-accent text-white rounded-lg hover:bg-accent-dark disabled:opacity-40 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setEditingTag(null); setEmojiInput(''); }}
                  className="text-xs text-text-light hover:text-text transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden" />
    </div>
  );
}
