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
  return `${env.apiUrl}/api/proxy-audio?url=${encodeURIComponent(cdnUrl)}`;
}
