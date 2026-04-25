import { apiClient } from '@/lib/apiClient';

// D69 (Sprint 65 Build 93 hot-fix) — typed wrappers for the mobile push
// register / unregister endpoints. BE controller (PushController.
// mobileSubscribe L25) takes { token: string, deviceType: string } and
// delegates to PushService.mobileSubscribe which writes to the
// MobilePushToken table.

export type DeviceType = 'ios' | 'android';

export function registerMobilePushToken(input: {
  token: string;
  deviceType: DeviceType;
}) {
  return apiClient.post<{ ok: true }>('/api/push/mobile-subscribe', input);
}

export function unregisterMobilePushToken(token: string) {
  return apiClient.post<{ ok: true }>('/api/push/mobile-unsubscribe', {
    token,
  });
}
