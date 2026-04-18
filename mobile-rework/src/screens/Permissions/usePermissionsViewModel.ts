import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { apiClient } from '@/lib/apiClient';

// Sprint 60 T286 — Permissions. PO-confirmed deviation from prototype
// (pairing.jsx:373): 2 cards (notif + photos) with explicit Allow/Skip per
// card, NOT prototype's pre-set toggles. Skip = mark "decided" without prompting
// the OS dialog. Allow = trigger native dialog; on grant, side-effect.
//   - notif: POST /api/push/mobile-subscribe {token, deviceType}
//   - photos: no BE call — perm cached at OS level, image-picker reuses it
//
// All API calls best-effort: failures don't block the user from advancing.
// Onboarding can still complete with denied perms — the user retries later
// via Profile → Settings.

type CardKey = 'notif' | 'photos';
type CardState = 'pending' | 'granted' | 'denied' | 'requesting';

export type CardStatus = Record<CardKey, CardState>;

const INITIAL: CardStatus = {
  notif: 'pending',
  photos: 'pending',
};

async function registerPushToken(): Promise<void> {
  try {
    // Native device token (APNS hex on iOS, FCM token on Android via FCM SDK).
    // Wrapped in try/catch so a missing APNS entitlement on dev builds doesn't
    // crash onboarding — perm itself is what we care about right now.
    const tokenRes = await Notifications.getDevicePushTokenAsync();
    const token = typeof tokenRes.data === 'string' ? tokenRes.data : null;
    if (!token) return;
    await apiClient.post('/api/push/mobile-subscribe', {
      token,
      deviceType: Platform.OS,
    });
  } catch {
    // Swallow — registration is best-effort, retried on next launch.
  }
}

export function usePermissionsViewModel() {
  const router = useRouter();
  const [status, setStatus] = useState<CardStatus>(INITIAL);

  const setCard = useCallback((key: CardKey, value: CardState) => {
    setStatus((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onAllow = useCallback(
    async (key: CardKey) => {
      if (status[key] === 'requesting' || status[key] === 'granted') return;
      setCard(key, 'requesting');
      if (key === 'notif') {
        try {
          const res = await Notifications.requestPermissionsAsync({
            ios: { allowAlert: true, allowBadge: true, allowSound: true },
          });
          const granted =
            res.granted ||
            res.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
            res.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
          if (granted) {
            setCard('notif', 'granted');
            await registerPushToken();
          } else {
            setCard('notif', 'denied');
          }
        } catch {
          setCard('notif', 'denied');
        }
      } else {
        try {
          const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (res.granted || res.status === 'granted') setCard('photos', 'granted');
          else setCard('photos', 'denied');
        } catch {
          setCard('photos', 'denied');
        }
      }
    },
    [status, setCard],
  );

  const onSkip = useCallback(
    (key: CardKey) => {
      if (status[key] === 'requesting' || status[key] === 'granted') return;
      setCard(key, 'denied');
    },
    [status, setCard],
  );

  const onContinue = useCallback(() => {
    router.replace('/(auth)/onboarding-done');
  }, [router]);

  return {
    status,
    onAllow,
    onSkip,
    onContinue,
  };
}
