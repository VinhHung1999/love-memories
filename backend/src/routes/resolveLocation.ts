import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

const GOOGLE_MAPS_HOSTS = [
  'share.google',
  'maps.app.goo.gl',
  'goo.gl',
  'maps.google.com',
  'www.google.com',
];

function isGoogleMapsUrl(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    if (GOOGLE_MAPS_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
      // goo.gl only for /maps/* paths
      if (hostname === 'goo.gl') return pathname.startsWith('/maps');
      // www.google.com only for /maps/* paths
      if (hostname === 'www.google.com') return pathname.startsWith('/maps');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function extractCoords(url: string): { lat: number; lng: number } | null {
  // Pattern: /@lat,lng or /@lat,lng,zoom
  let m = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // Pattern: ?q=lat,lng or &q=lat,lng
  m = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // Pattern: daddr=lat,lng (Google Maps directions destination)
  m = url.match(/[?&]daddr=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // Pattern: destination=lat,lng
  m = url.match(/destination=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // Pattern: !2d{lng}!3d{lat} (embedded map data)
  const d2 = url.match(/!2d(-?\d+\.?\d*)/);
  const d3 = url.match(/!3d(-?\d+\.?\d*)/);
  if (d2 && d3) {
    const lng = parseFloat(d2[1]);
    const lat = parseFloat(d3[1]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  return null;
}

function extractPlaceName(url: string): string | null {
  try {
    const parsed = new URL(url);
    // /maps/place/{name}/ or /maps/place/{name}/@...
    const m = parsed.pathname.match(/\/maps\/place\/([^/@?&]+)/);
    if (m) {
      return decodeURIComponent(m[1].replace(/\+/g, ' '));
    }
    // Fallback: extract daddr= (directions destination) or q= (search/share)
    // Skip if daddr is just coordinates (e.g. "10.8050,106.6966")
    const daddr = parsed.searchParams.get('daddr');
    if (daddr && !/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(daddr.trim())) return daddr;
    const q = parsed.searchParams.get('q');
    if (q) return q;
  } catch {
    // ignore
  }
  return null;
}

// POST /api/resolve-location — follow Google Maps short/share links, extract coords
router.post('/', async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'url is required' });
    return;
  }

  if (!isGoogleMapsUrl(url)) {
    res.status(400).json({ error: 'Not a recognized Google Maps URL' });
    return;
  }

  try {
    // Follow redirects to reach the final Google Maps URL
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
      signal: AbortSignal.timeout(10_000),
    });

    const finalUrl = response.url;

    const coords = extractCoords(finalUrl);
    const name = extractPlaceName(finalUrl);

    if (coords) {
      res.json({ latitude: coords.lat, longitude: coords.lng, name: name ?? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` });
    } else if (name) {
      // No coords from URL — try fetching Google Maps search page to scrape coords from HTML
      try {
        const mapsRes = await fetch(`https://www.google.com/maps?q=${encodeURIComponent(name)}`, {
          method: 'GET', redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
          signal: AbortSignal.timeout(10_000),
        });
        const html = await mapsRes.text();
        // Pattern in Google Maps HTML: ,lng,lat] where lng~106.x and lat~10.x (Vietnam)
        const coordMatch = html.match(/,(-?\d{1,3}\.\d{4,}),(-?\d{1,3}\.\d{4,})\]/);
        if (coordMatch) {
          const v1 = parseFloat(coordMatch[1]);
          const v2 = parseFloat(coordMatch[2]);
          // Determine which is lat and which is lng (lat: -90..90, lng: -180..180 & |lng|>90)
          const [lat, lng] = Math.abs(v1) > 90 ? [v2, v1] : [v1, v2];
          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            res.json({ latitude: lat, longitude: lng, name });
            return;
          }
        }
      } catch { /* fallback to name-only */ }
      res.json({ name });
    } else {
      res.status(422).json({ error: 'Could not extract coordinates or place name from URL' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve URL' });
  }
});

export { router as resolveLocationRoute };
