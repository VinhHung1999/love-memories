import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { Heart, Utensils, Filter } from 'lucide-react';
import { mapApi } from '../lib/api';
import type { MapPin } from '../types';

// You can set your Mapbox token here or via env
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'moment' | 'foodspot'>('all');

  const { data: pins = [] } = useQuery({
    queryKey: ['map-pins'],
    queryFn: mapApi.pins,
  });

  const validPins = pins.filter((p) =>
    p.latitude >= -90 && p.latitude <= 90 && p.longitude >= -180 && p.longitude <= 180
  );
  const filteredPins = filter === 'all' ? validPins : validPins.filter((p) => p.type === filter);

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
      const el = document.createElement('div');
      el.className = 'map-marker';
      el.style.cssText = `
        width: 36px; height: 36px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        background: ${pin.type === 'moment' ? '#E8788A' : '#F4A261'};
        color: white; font-size: 16px;
      `;
      el.innerHTML = pin.type === 'moment' ? '&hearts;' : '&#127860;';

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="padding: 12px; min-width: 150px;">
          ${pin.thumbnail ? `<img src="${pin.thumbnail}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />` : ''}
          <div style="font-weight:600;font-size:14px;">${pin.title}</div>
          ${pin.location ? `<div style="font-size:12px;color:#6B7280;margin-top:2px;">${pin.location}</div>` : ''}
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.longitude, pin.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);

      el.addEventListener('click', () => {
        const path = pin.type === 'moment' ? `/moments/${pin.id}` : `/foodspots/${pin.id}`;
        // Double click navigates
        el.addEventListener('dblclick', () => navigate(path));
      });

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
          {pins.length} pins available ({pins.filter(p => p.type === 'moment').length} moments, {pins.filter(p => p.type === 'foodspot').length} food spots)
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] md:h-[calc(100vh-3rem)] relative">
      {/* Filter Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 bg-white rounded-xl shadow-lg p-1.5">
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

      <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden" />
    </div>
  );
}
