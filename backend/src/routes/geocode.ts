import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || process.env.VITE_MAPBOX_TOKEN || '';

// GET /api/geocode/forward?q={query}&proximity={lng,lat}&limit={5}
router.get('/forward', async (req: Request, res: Response) => {
  const { q, proximity, limit = '5' } = req.query as Record<string, string>;
  if (!q) { res.status(400).json({ error: 'q is required', features: [] }); return; }
  if (!MAPBOX_TOKEN) { res.status(500).json({ error: 'Mapbox token not configured', features: [] }); return; }

  try {
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      limit: limit ?? '5',
      language: 'vi',
      country: 'vn',
    });
    if (proximity) params.set('proximity', proximity);

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?${params}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
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

  try {
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      limit: '1',
      language: 'vi',
      country: 'vn',
    });
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(lng)},${encodeURIComponent(lat)}.json?${params}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Reverse geocoding failed', features: [] });
  }
});

export { router as geocodeRoutes };
