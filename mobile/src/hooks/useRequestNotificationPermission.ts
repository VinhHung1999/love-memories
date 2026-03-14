import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { apiFetch } from '../lib/api';

const PUSH_PERMISSION_ASKED_KEY = 'push_permission_asked';

export function useRequestNotificationPermission() {
  useEffect(() => {
    async function requestAndRegisterPushToken() {
      // Run only once — avoid re-asking on every app open
      const alreadyAsked = await AsyncStorage.getItem(PUSH_PERMISSION_ASKED_KEY);
      if (alreadyAsked) return;

      await AsyncStorage.setItem(PUSH_PERMISSION_ASKED_KEY, 'true');

      // 1. Request permission (iOS shows system dialog)
      const authStatus = await messaging().requestPermission();
      const granted =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (!granted) return; // User declined — respect, don't retry

      // 2. Get FCM token
      const token = await messaging().getToken();
      if (!token) return;

      // 3. Register with backend
      await apiFetch('/api/push/mobile-subscribe', {
        method: 'POST',
        body: JSON.stringify({ token, deviceType: Platform.OS }),
      });
    }

    requestAndRegisterPushToken().catch(() => {
      // Silently ignore — push is non-critical
    });
  }, []);
}
