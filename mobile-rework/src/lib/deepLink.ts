import * as Linking from 'expo-linking';

export type DeepLinkRoute =
  | { name: 'pair-join'; params: { code?: string } };

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT for adding a new accepted deep-link path (/letter/:id, /moment/:id…)
// ─────────────────────────────────────────────────────────────────────────────
// Both halves are MANDATORY. Skipping either reproduces the Build 21 "unknown
// route" white-screen bug (T312) on cold-start Universal Links.
//
//   (a) FILE-ROUTE — create `app/<path>/[param].tsx` that does the navigation
//       in a useEffect (sanitize → optional setPending* stash for unauthed →
//       router.replace to the destination). Expo Router's file-tree routing
//       runs synchronously at mount and renders the not-found screen BEFORE
//       Linking's URL listener can fire on cold-start, so the file-route is
//       the only authoritative handler for first-paint.
//
//   (b) LISTENER SHORT-CIRCUIT — extend `useDeepLink` in `app/_layout.tsx` so
//       the warm-start branch detects URLs already owned by a file-route and
//       returns BEFORE the router.push, avoiding two stacked entries when
//       the file-route + the listener both fire (e.g. user re-opens app from
//       a share while it's still alive in memory).
//
// The legacy `/pair?code=…` shape below has no file-route — it's the one
// exception, kept only so old shares that pre-date T312 still resolve via
// the listener push. Don't add new exceptions; ship a file-route every time.
// ─────────────────────────────────────────────────────────────────────────────
//
// Recognised inbound URL shapes (T289 Universal Link migration):
//   - `https://memoura.app/join/<8hex>` — Universal Link (canonical share format)
//   - `memoura://join/<8hex>`           — custom-scheme equivalent (in-process)
//   - `https://memoura.app/pair?code=…` — legacy path kept for older shares
//   - `memoura://pair?code=…`           — legacy custom-scheme equivalent
// Any other shape returns null and the caller treats it as "not a deep link".
export function parseMemouraUrl(url: string | null | undefined): DeepLinkRoute | null {
  if (!url) return null;
  let parsed: ReturnType<typeof Linking.parse>;
  try {
    parsed = Linking.parse(url);
  } catch {
    return null;
  }

  // For a custom-scheme URL like `memoura://join/ABC12345`, expo-linking
  // returns hostname=`join` and path=`ABC12345`. For the universal-link
  // `https://memoura.app/join/ABC12345` it puts hostname=`memoura.app` and
  // path=`join/ABC12345`. Normalise to a `[head, ...rest]` segment array.
  //
  // T311 fix: accept any `*.memoura.app` subdomain (dev.memoura.app,
  // staging.memoura.app, …). Previously we hard-coded `memoura.app`, so
  // scanning a dev QR ran the else-branch that prepended `dev.memoura.app`
  // to segments → head="dev.memoura.app" → null. The caller's fallback
  // `sanitize(raw)` then scraped hex from the full URL, yielding garbage
  // like "DEAAABCD" (the hex-only slice of "dev.memoura.app/j…").
  const hostname = (parsed.hostname ?? '').toLowerCase();
  const path = (parsed.path ?? '').replace(/^\/+/, '').toLowerCase();
  const isMemouraHost =
    hostname === '' || hostname === 'memoura.app' || hostname.endsWith('.memoura.app');
  const segments = isMemouraHost
    ? path.split('/').filter(Boolean)
    : [hostname, ...path.split('/').filter(Boolean)];

  if (segments.length === 0) return null;
  const [head, ...rest] = segments;

  // /join/<code> — canonical T289 format.
  if (head === 'join') {
    const code = rest[0] ? sanitizeHex(rest[0]) : undefined;
    return { name: 'pair-join', params: code ? { code } : {} };
  }

  // Legacy /pair?code=… — kept so old shares (and the in-flight share message
  // text from previous app versions) still route correctly.
  if (head === 'pair') {
    const code = readString(parsed.queryParams, 'code');
    return { name: 'pair-join', params: code ? { code: sanitizeHex(code) } : {} };
  }

  return null;
}

// Strip non-hex (handles share-link query params with stray punctuation),
// uppercase, cap at 8. Caller still validates length downstream.
function sanitizeHex(raw: string): string {
  const out: string[] = [];
  for (const ch of raw) {
    if (/[0-9a-f]/i.test(ch)) out.push(ch);
    if (out.length >= 8) break;
  }
  return out.join('').toUpperCase();
}

function readString(
  q: Record<string, string | string[] | undefined> | null | undefined,
  key: string,
): string | undefined {
  const v = q?.[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return undefined;
}
