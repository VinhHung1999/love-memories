import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || process.env.VITE_MAPBOX_TOKEN || '';
// Mapbox public tokens have URL restrictions — backend requests must send Referer
const MAPBOX_REFERER = process.env.MAPBOX_REFERER || 'https://love-scrum-api.hungphu.work';

// GET /api/geocode/forward?q={query}&proximity={lng,lat}&limit={5}
router.get('/forward', async (req: Request, res: Response) => {
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
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      limit: String(limitNum),
      language: 'vi',
      country: 'vn',
    });
    if (proximity) params.set('proximity', proximity);

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?${params}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Referer: MAPBOX_REFERER } });
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Geocoding request failed', features: [] });
  }
});

// GET /api/geocode/reverse?lat={lat}&lng={lng}
router.get('/reverse', async (req: Request, res: Response) => {
  const { lat, lng } = req.query as Record<string, string>;
  if (!lat || !lng) { res.status(400).json({ error: 'lat and lng are required', features: [] }); return; }
  if (!MAPBOX_TOKEN) { res.status(500).json({ error: 'Mapbox token not configured', features: [] }); return; }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    res.status(400).json({ error: 'Invalid lat/lng values', features: [] }); return;
  }

  try {
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      limit: '1',
      language: 'vi',
      country: 'vn',
    });
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngNum},${latNum}.json?${params}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Referer: MAPBOX_REFERER } });
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Reverse geocoding failed', features: [] });
  }
});

export { router as geocodeRoutes };
