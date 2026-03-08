import { Router } from 'express';
import type { Request, Response } from 'express';

const CDN_BASE_URL = process.env.CDN_BASE_URL!;

// ─── Image proxy (protected via requireAuth at mount point) ───────────────────
const imageRouter = Router();

imageRouter.get('/', async (req: Request, res: Response) => {
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
    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch {
    res.status(502).json({ error: 'CDN proxy error' });
  }
});

// ─── Audio proxy (public — <audio src> can't send Authorization headers) ─────
// Solves: (1) CDN lacks CORS headers; (2) CDN serves .mp4 audio as video/mp4 on iOS
const audioRouter = Router();

audioRouter.get('/', async (req: Request, res: Response) => {
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

export { imageRouter as proxyImageRoute, audioRouter as proxyAudioRoute };
