import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

const GOOGLE_MAPS_HOSTS = [
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

/** Decode destination coords from the `geocode` query param (protobuf, base64-encoded).
 *  Format: "source_b64;dest_b64" — each chunk has field 2 = lat (E6), field 3 = lng (E6). */
function extractCoordsFromGeocode(url: string): { lat: number; lng: number } | null {
  try {
    const parsed = new URL(url);
    const geocode = parsed.searchParams.get('geocode');
    if (!geocode) return null;

    // Split by ";" — last part is the destination
    const parts = geocode.split(';');
    const destB64 = parts[parts.length - 1]?.trim();
    if (!destB64) return null;

    // URL-safe base64 → standard base64
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
        // fixed32 — read as uint32 LE, divide by 1e6
        const val = buf.readUInt32LE(i);
        i += 4;
        if (fieldNum === 2) lat = val / 1e6;
        else if (fieldNum === 3) lng = val / 1e6;
      } else if (wireType === 1 && i + 8 <= buf.length) {
        i += 8; // skip fixed64 fields
      } else {
        break; // unknown wire type — stop
      }
    }

    if (lat != null && lng != null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  } catch { /* ignore decode errors */ }
  return null;
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

    // Priority: geocode protobuf (exact pin) > URL patterns > name-only fallback
    const coords = extractCoordsFromGeocode(finalUrl) ?? extractCoords(finalUrl);
    const name = extractPlaceName(finalUrl);

    if (coords) {
      res.json({ latitude: coords.lat, longitude: coords.lng, name: name ?? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` });
    } else if (name) {
      // No coords in URL — return name only, frontend will Mapbox-geocode it
      res.json({ name });
    } else {
      res.status(422).json({ error: 'Could not extract coordinates or place name from URL' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve URL' });
  }
});

export { router as resolveLocationRoute };
