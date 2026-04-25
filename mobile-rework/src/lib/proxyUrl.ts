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
  // D60 (Sprint 65 Build 84 hot-fix): proxy is now a pass-through. Lu
  // verified the CDN serves `.m4a` files with `Content-Type: audio/mp4`
  // directly, and the legacy `mobile/screens/LetterRead/useLetterReadView
  // Model.ts:41` ships in prod by passing the raw CDN URL straight into
  // react-native-audio-recorder-player.startPlayer(url). The proxy
  // (D56→D59) was over-engineering: it adds a network hop, removes the
  // `.m4a` extension iOS AVPlayer wants to URL-sniff (D59 alias), and
  // hands AVPlayer an HTTPS URL with a querystring which expo-audio
  // sometimes refuses to load for AAC streaming.
  //
  // Helper retained as a no-op so we can rewire it if a future caller
  // (T425 Notifications audio kind, recap voice memos) needs the proxy
  // for a non-.m4a CDN path. Today every audio is .m4a → direct works.
  // The BE `/api/proxy-audio[/:filename]` route stays mounted; only the
  // mobile callsites stop wrapping.
  return cdnUrl;
}
