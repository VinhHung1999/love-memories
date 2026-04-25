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
// Solves: (1) CDN lacks CORS headers; (2) CDN serves .mp4 audio as video/mp4 on
// iOS and .m4a audio as audio/x-m4a (the legacy Apple variant); (3) iOS
// AVPlayer / expo-audio's underlying engine sniff URL path extension before
// honouring Content-Type for AAC streams, so the BE exposes a `/audio.m4a`
// alias path so the URL ends in `.m4a` and the player recognises the kind.
//
// D59 (Sprint 65 Build 83 hot-fix): force the response Content-Type to
// `audio/mp4` (not just `video/` → `audio/` rewrite) so the legacy
// `audio/x-m4a` variant is normalised too. Same handler mounted on `/` (for
// historical web callers) and `/:filename` (for iOS AVPlayer URL-sniff).
const audioRouter = Router();

const proxyAudioHandler = async (req: Request, res: Response) => {
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
    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch {
    res.status(502).json({ error: 'CDN proxy error' });
  }
};

audioRouter.get('/', proxyAudioHandler);
// Alias: `/audio.m4a?url=…` — iOS AVPlayer infers audio kind from the path
// extension before AAC streams will load. Filename is ignored server-side;
// any path is accepted so future clients can construct stable URLs.
audioRouter.get('/:filename', proxyAudioHandler);

export { imageRouter as proxyImageRoute, audioRouter as proxyAudioRoute };
