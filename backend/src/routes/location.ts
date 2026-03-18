import { Router } from 'express';
import type { Request, Response } from 'express';

// ─── Geocode routes (Mapbox forward + reverse geocoding) ──────────────────────

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || process.env.VITE_MAPBOX_TOKEN || '';
const MAPBOX_REFERER = process.env.MAPBOX_REFERER || 'https://api.memoura.app';

const geocodeRouter = Router();

geocodeRouter.get('/forward', async (req: Request, res: Response) => {
  const { q, proximity, limit = '5' } = req.query as Record<string, string>;
  if (!q) { res.status(400).json({ error: 'q is required', features: [] }); return; }
  if (!MAPBOX_TOKEN) { res.status(500).json({ error: 'Mapbox token not configured', features: [] }); return; }

  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 10);

  if (proximity) {
    const [pLng, pLat] = proximity.split(',').map(Number);
    if (isNaN(pLng) || isNaN(pLat) || pLat < -90 || pLat > 90 || pLng < -180 || pLng > 180) {
      res.status(400).json({ error: 'Invalid proximity', features: [] }); return;
    }
  }

  try {
    const params = new URLSearchParams({ access_token: MAPBOX_TOKEN, limit: String(limitNum), language: 'vi', country: 'vn' });
    if (proximity) params.set('proximity', proximity);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?${params}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Referer: MAPBOX_REFERER } });
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Geocoding request failed', features: [] });
  }
});

geocodeRouter.get('/reverse', async (req: Request, res: Response) => {
  const { lat, lng } = req.query as Record<string, string>;
  if (!lat || !lng) { res.status(400).json({ error: 'lat and lng are required', features: [] }); return; }
  if (!MAPBOX_TOKEN) { res.status(500).json({ error: 'Mapbox token not configured', features: [] }); return; }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    res.status(400).json({ error: 'Invalid lat/lng values', features: [] }); return;
  }

  try {
    const params = new URLSearchParams({ access_token: MAPBOX_TOKEN, limit: '1', language: 'vi', country: 'vn' });
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngNum},${latNum}.json?${params}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Referer: MAPBOX_REFERER } });
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Reverse geocoding failed', features: [] });
  }
});

// ─── Resolve-location route (Google Maps URL → coords) ────────────────────────

const GOOGLE_MAPS_HOSTS = ['maps.app.goo.gl', 'goo.gl', 'maps.google.com', 'www.google.com'];

function isGoogleMapsUrl(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    if (GOOGLE_MAPS_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
      if (hostname === 'goo.gl') return pathname.startsWith('/maps');
      if (hostname === 'www.google.com') return pathname.startsWith('/maps');
      return true;
    }
    return false;
  } catch { return false; }
}

function extractCoordsFromGeocode(url: string): { lat: number; lng: number } | null {
  try {
    const parsed = new URL(url);
    const geocode = parsed.searchParams.get('geocode');
    if (!geocode) return null;
    const parts = geocode.split(';');
    const destB64 = parts[parts.length - 1]?.trim();
    if (!destB64) return null;
    const std = destB64.replace(/-/g, '+').replace(/_/g, '/');
    const buf = Buffer.from(std, 'base64');
    let lat: number | null = null;
    let lng: number | null = null;
    let i = 0;
    while (i < buf.length) {
      const tag = buf[i];
      const fieldNum = tag >> 3;
      const wireType = tag & 0x7;
      i++;
      if (wireType === 5 && i + 4 <= buf.length) {
        const val = buf.readUInt32LE(i); i += 4;
        if (fieldNum === 2) lat = val / 1e6;
        else if (fieldNum === 3) lng = val / 1e6;
      } else if (wireType === 1 && i + 8 <= buf.length) {
        i += 8;
      } else { break; }
    }
    if (lat != null && lng != null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  } catch { /* ignore */ }
  return null;
}

function extractCoords(url: string): { lat: number; lng: number } | null {
  let m = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) { const lat = parseFloat(m[1]), lng = parseFloat(m[2]); if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng }; }
  m = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) { const lat = parseFloat(m[1]), lng = parseFloat(m[2]); if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng }; }
  m = url.match(/[?&]daddr=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) { const lat = parseFloat(m[1]), lng = parseFloat(m[2]); if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng }; }
  m = url.match(/destination=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) { const lat = parseFloat(m[1]), lng = parseFloat(m[2]); if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng }; }
  const d2 = url.match(/!2d(-?\d+\.?\d*)/), d3 = url.match(/!3d(-?\d+\.?\d*)/);
  if (d2 && d3) { const lng = parseFloat(d2[1]), lat = parseFloat(d3[1]); if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng }; }
  return null;
}

function extractPlaceName(url: string): string | null {
  try {
    const parsed = new URL(url);
    const m = parsed.pathname.match(/\/maps\/place\/([^/@?&]+)/);
    if (m) return decodeURIComponent(m[1].replace(/\+/g, ' '));
    const daddr = parsed.searchParams.get('daddr');
    if (daddr && !/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(daddr.trim())) return daddr;
    const q = parsed.searchParams.get('q');
    if (q) return q;
  } catch { /* ignore */ }
  return null;
}

const resolveLocationRouter = Router();

resolveLocationRouter.post('/', async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };
  if (!url || typeof url !== 'string') { res.status(400).json({ error: 'url is required' }); return; }
  if (!isGoogleMapsUrl(url)) { res.status(400).json({ error: 'Not a recognized Google Maps URL' }); return; }

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
      signal: AbortSignal.timeout(10_000),
    });
    const finalUrl = response.url;
    const coords = extractCoordsFromGeocode(finalUrl) ?? extractCoords(finalUrl);
    const name = extractPlaceName(finalUrl);
    if (coords) {
      res.json({ latitude: coords.lat, longitude: coords.lng, name: name ?? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` });
    } else if (name) {
      res.json({ name });
    } else {
      res.status(422).json({ error: 'Could not extract coordinates or place name from URL' });
    }
  } catch {
    res.status(500).json({ error: 'Failed to resolve URL' });
  }
});

export { geocodeRouter as geocodeRoutes, resolveLocationRouter as resolveLocationRoute };
