import { Router } from 'express';
import type { Request, Response } from 'express';

const CDN_BASE_URL = process.env.CDN_BASE_URL!;

const router = Router();

// GET /api/proxy-image?url=<encoded-cdn-url>
// Proxies CDN images server-side so the browser never makes a cross-origin fetch.
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

    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch {
    res.status(502).json({ error: 'CDN proxy error' });
  }
});

export { router as proxyImageRoute };
