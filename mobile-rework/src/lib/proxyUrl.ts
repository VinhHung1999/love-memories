import { env } from '@/config/env';

// D56 (Sprint 65 Build 81 hot-fix) — wraps a CDN audio URL with the BE's
// public audio proxy so iOS expo-audio can decode the stream.
//
// Why the proxy is needed:
//   • CDN serves `.mp4` audio with Content-Type `video/mp4` (an iOS-known
//     misclassification — see backend/src/routes/proxy.ts L34 audio
//     proxy comment).
//   • CDN serves `.m4a` audio with Content-Type `audio/x-m4a` (the legacy
//     non-RFC variant; matches D55 BE whitelist additions).
//   • iOS AVPlayer / expo-audio's underlying AVAudioPlayer fails to load
//     either header for AAC streaming, so the player surfaces no error
//     and the play button silently no-ops.
// The BE proxy at `/api/proxy-audio?url=…` fetches the upstream CDN then
// rewrites the Content-Type to `audio/mp4`. Public route — `<audio src>`
// (and the iOS streaming layer) can't send Authorization headers.
//
// Reusable pattern: any future feature needing audio playback (T425
// Notifications audio-kind preview, recap voice memos, etc.) should
// route through this helper.

export function proxyAudio(cdnUrl: string | null | undefined): string {
  if (!cdnUrl) return '';
  // Defensive: don't double-wrap if the URL is already a proxy URL or a
  // non-CDN absolute path the caller built themselves.
  if (cdnUrl.includes('/api/proxy-audio')) return cdnUrl;
  // D59 (Sprint 65 Build 83 hot-fix): use the `/audio.m4a` alias path so
  // iOS AVPlayer / expo-audio's URL-sniff sees an audio extension and
  // proceeds to load the AAC stream. The querystring `url=…` is the actual
  // CDN path the BE fetches; the filename is ignored server-side. See
  // backend/src/routes/proxy.ts for the dual-mount.
  return `${env.apiUrl}/api/proxy-audio/audio.m4a?url=${encodeURIComponent(cdnUrl)}`;
}
