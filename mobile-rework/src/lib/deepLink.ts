import * as Linking from 'expo-linking';

export type DeepLinkRoute =
  | { name: 'pair-join'; params: { code?: string } };

// Accepts both the custom scheme (`memoura://pair?code=123456`) and the
// universal-link form (`https://memoura.app/pair?code=...`). Universal-links
// proper (Associated Domains + AASA) land in Sprint 65 — this function only
// PARSES; the OS hands us the URL via `expo-linking` once that ships.
export function parseMemouraUrl(url: string | null | undefined): DeepLinkRoute | null {
  if (!url) return null;
  let parsed: ReturnType<typeof Linking.parse>;
  try {
    parsed = Linking.parse(url);
  } catch {
    return null;
  }

  // For a custom scheme like `memoura://pair?code=…`, expo-linking puts
  // `pair` in `hostname` and leaves `path` empty. For `https://memoura.app/pair?…`
  // it puts `pair` in `path`. Coalesce both into one segment.
  const segment = (parsed.path && parsed.path !== '' ? parsed.path : parsed.hostname ?? '')
    .replace(/^\/+/, '')
    .toLowerCase();

  if (segment === 'pair') {
    const code = readString(parsed.queryParams, 'code');
    return { name: 'pair-join', params: code ? { code } : {} };
  }

  return null;
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
