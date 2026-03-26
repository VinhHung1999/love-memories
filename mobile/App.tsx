import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AuthProvider } from './src/lib/auth';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { LoadingProvider } from './src/contexts/LoadingContext';
import { UploadProgressProvider } from './src/contexts/UploadProgressContext';
import Mapbox from '@rnmapbox/maps';
import { warmupConnection } from './src/lib/api';
import { initPurchases } from './src/lib/purchasesService';
import { MAPBOX_ACCESS_TOKEN, GOOGLE_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from './src/config/env';
import { initI18n } from './src/lib/i18n';
import RootNavigator from './src/navigation';
import ErrorBoundary from './src/components/ErrorBoundary';
import './src/global.css';

// Pre-warm DNS + TLS to Cloudflare Tunnel so first API call isn't slow
warmupConnection();

// Initialize RevenueCat SDK at app launch (before any component mounts)
initPurchases();

// Initialize Mapbox/MapLibre — token needed for geocoding API
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

// Configure Google Sign-In once at app startup.
// webClientId = your Google OAuth Web Client ID (same GOOGLE_CLIENT_ID used on backend).
// Set this in a .env file or native env config before building.
GoogleSignin.configure({
  webClientId: GOOGLE_CLIENT_ID,
  // iosClientId triggers native iOS OAuth flow (separate from webClientId).
  // Reversed client ID URL scheme must match CFBundleURLSchemes in Info.plist.
  // Boss: set GOOGLE_IOS_CLIENT_ID in .env.dev + .env.prod once iOS OAuth client is created.
  ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
  offlineAccess: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  if (!i18nReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      {/* NativeWind dark-mode root — 'dark' class activates dark: variants */}
      <View className={isDark ? 'dark flex-1' : 'flex-1'}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
            <UploadProgressProvider>
              <LoadingProvider>
                <AuthProvider>
                  <SubscriptionProvider>
                    <ErrorBoundary>
                      <RootNavigator />
                    </ErrorBoundary>
                  </SubscriptionProvider>
                </AuthProvider>
              </LoadingProvider>
            </UploadProgressProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
      </View>
    </GestureHandlerRootView>
  );
}
