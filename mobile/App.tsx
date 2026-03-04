import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AuthProvider } from './src/lib/auth';
import { LoadingProvider } from './src/contexts/LoadingContext';
import { UploadProgressProvider } from './src/contexts/UploadProgressContext';
import Mapbox from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN } from './src/config/tokens';
import { warmupConnection } from './src/lib/api';
import RootNavigator from './src/navigation';
import './src/global.css';

// Pre-warm DNS + TLS to Cloudflare Tunnel so first API call isn't slow
warmupConnection();

// Initialize Mapbox once at app startup, before NavigationContainer mounts
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

// Configure Google Sign-In once at app startup.
// webClientId = your Google OAuth Web Client ID (same GOOGLE_CLIENT_ID used on backend).
// Set this in a .env file or native env config before building.
GoogleSignin.configure({
  webClientId: '', // TODO: replace with actual GOOGLE_CLIENT_ID
  offlineAccess: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <GestureHandlerRootView className="flex-1">
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <UploadProgressProvider>
              <LoadingProvider>
                <AuthProvider>
                  <RootNavigator />
                </AuthProvider>
              </LoadingProvider>
            </UploadProgressProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
