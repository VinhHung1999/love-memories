// Note: Notification — Push notification setup for mobile (iOS + Android).
// This module handles:
// 1. Requesting notification permission from the user
// 2. Getting the FCM device token
// 3. Registering the token with our backend
// 4. Listening for incoming notifications (foreground + background)
// 5. Handling notification taps (navigating to the relevant screen)
//
// CONFIGURATION REQUIRED (Boss handles later):
// - iOS: Add GoogleService-Info.plist to ios/ folder + configure APNs key in Firebase Console
// - Android: Add google-services.json to android/app/ folder
// - Both: Create a Firebase project at https://console.firebase.google.com

import { useEffect, useRef } from 'react';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';
import { apiFetch } from './api';

// Note: Notification — Register the device's FCM token with our backend.
// Called on every app launch and whenever the token refreshes.
// The backend upserts: if token exists, it updates userId; if new, it creates.
async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    await apiFetch('/api/push/mobile-subscribe', {
      method: 'POST',
      body: JSON.stringify({
        token,
        deviceType: Platform.OS, // "ios" or "android"
      }),
    });
  } catch {
    // Non-blocking — token registration failure shouldn't crash the app
  }
}

// Note: Notification — Unregister the device's FCM token from our backend.
// Called on logout so the user stops receiving push notifications on this device.
export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await messaging().getToken();
    if (token) {
      await apiFetch('/api/push/mobile-unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    }
  } catch {
    // Non-blocking
  }
}

// Note: Notification — Request notification permission from the user.
// On iOS: messaging().requestPermission() shows the system dialog.
// On Android 13+ (API 33): Must use PermissionsAndroid.request() because
// Firebase's requestPermission() only works for iOS — Android needs the
// native POST_NOTIFICATIONS permission request to show the system dialog.
// On Android <13: permission is auto-granted, no dialog needed.
async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Note: Notification — Android 13+ requires explicit permission request
    if (Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      console.log('[Push] Android permission dialog result:', result);
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    // Android <13: auto-granted
    return true;
  }
  // iOS: use Firebase messaging permission
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

// Note: Notification — Navigate to the relevant screen based on notification data.
// The backend sends a `link` field (e.g. "/moments/abc-123") which we parse
// into React Navigation route params.
function handleNotificationNavigation(
  navigation: any,
  data: Record<string, string> | undefined,
): void {
  if (!data?.link) return;

  const link = data.link;
  const momentMatch = link.match(/^\/moments\/(.+)$/);
  const foodSpotMatch = link.match(/^\/foodspots\/(.+)$/);
  const recipeMatch = link.match(/^\/recipes\/(.+)$/);

  if (momentMatch) {
    navigation.navigate('MomentsTab', {
      screen: 'MomentDetail',
      params: { momentId: momentMatch[1] },
    });
  } else if (foodSpotMatch) {
    navigation.navigate('FoodSpotsTab', {
      screen: 'FoodSpotDetail',
      params: { foodSpotId: foodSpotMatch[1] },
    });
  } else if (recipeMatch) {
    navigation.navigate('RecipesTab', {
      screen: 'RecipeDetail',
      params: { recipeId: recipeMatch[1] },
    });
  } else if (link === '/what-to-eat') {
    navigation.navigate('RecipesTab', { screen: 'WhatToEat' });
  } else if (link === '/notifications') {
    navigation.navigate('NotificationsTab');
  }
}

// Note: Notification — Main hook to initialize push notifications.
// Call this ONCE in the root navigator (after user is authenticated).
// It does the following:
// 1. Requests permission (iOS shows dialog, Android auto-grants on <13)
// 2. Gets the FCM token and registers it with the backend
// 3. Subscribes to token refresh events (token can change periodically)
// 4. Listens for foreground notifications (shows an Alert)
// 5. Listens for notification taps when app was in background
// 6. Checks if app was opened from a killed state by a notification tap
export function usePushNotifications(): void {
  const navigation = useNavigation<any>();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function setup() {
      console.log('[Push] setup() started');
      // Note: Notification — Step 1: Request permission
      try {
        const hasPermission = await requestPermission();
        console.log('[Push] permission result:', hasPermission);
        if (!hasPermission) return;
      } catch (e) {
        console.log('[Push] permission ERROR:', e);
        return;
      }

      // Note: Notification — Step 2: Get FCM token and register with backend.
      // The FCM token is a unique identifier for this device+app combination.
      // It's what the backend uses to target push messages to this specific device.
      try {
        const token = await messaging().getToken();
        console.log('[Push] FCM token:', token ? token.substring(0, 30) + '...' : 'null');
        if (token) {
          await registerTokenWithBackend(token);
          console.log('[Push] token registered with backend');
        }
      } catch (e) {
        console.log('[Push] token ERROR:', e);
      }

      // Note: Notification — Step 3: Listen for token refresh.
      // FCM tokens can be rotated by the system. When that happens,
      // we need to send the new token to our backend.
      const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
        await registerTokenWithBackend(newToken);
      });

      // Note: Notification — Step 4: Handle foreground notifications.
      // When the app is open and a push arrives, the OS does NOT show a banner.
      // We show a simple Alert instead so the user knows something happened.
      const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
        const { title, body } = remoteMessage.notification ?? {};
        if (title) {
          Alert.alert(title, body ?? '', [
            { text: 'OK', style: 'cancel' },
            {
              text: 'View',
              onPress: () =>
                handleNotificationNavigation(navigation, remoteMessage.data as Record<string, string>),
            },
          ]);
        }
      });

      // Note: Notification — Step 5: Handle notification tap when app is in background.
      // When user taps a notification banner while the app is backgrounded,
      // this callback fires with the notification data so we can navigate.
      const unsubscribeBackground = messaging().onNotificationOpenedApp((remoteMessage) => {
        handleNotificationNavigation(navigation, remoteMessage.data as Record<string, string>);
      });

      // Note: Notification — Step 6: Handle cold start from notification.
      // If the app was completely killed and the user taps a notification,
      // this retrieves the notification that launched the app.
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        // Small delay to let navigation initialize
        setTimeout(() => {
          handleNotificationNavigation(navigation, initialNotification.data as Record<string, string>);
        }, 1000);
      }

      // Cleanup on unmount
      return () => {
        unsubscribeTokenRefresh();
        unsubscribeForeground();
        unsubscribeBackground();
      };
    }

    setup();
  }, [navigation]);
}
