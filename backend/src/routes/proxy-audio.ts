import { Router } from 'express';
import type { Request, Response } from 'express';

const CDN_BASE_URL = process.env.CDN_BASE_URL!;

const router = Router();

// GET /api/proxy-audio?url=<encoded-cdn-url>
// Proxies CDN audio server-side, forcing audio/* content-type.
// Solves two problems:
//   1. CDN lacks CORS headers → Web Audio API fetch() is blocked cross-origin
//   2. CDN serves .mp4 audio as video/mp4 → HTMLAudioElement rejects it on iOS
// Protected by requireAuth (applied at mount point in index.ts).
router.get('/', async (req: Request, res: Response) => {
  const { url } = req.query;

  if (typeof url !== 'string' || !url.startsWith(CDN_BASE_URL)) {
    res.status(400).json({ error: 'Invalid or disallowed url' });
    return;
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'CDN fetch failed' });
      return;
    }

    // Force audio content-type regardless of what CDN sends (video/mp4 → audio/mp4)
    const cdnType = upstream.headers.get('content-type') ?? 'audio/mp4';
    const audioContentType = cdnType.replace(/^video\//, 'audio/');

    res.setHeader('Content-Type', audioContentType);
    res.setHeader('Cache-Control', 'private, max-age=86400');

    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch {
    res.status(502).json({ error: 'CDN proxy error' });
  }
});

export { router as proxyAudioRoute };
