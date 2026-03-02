import React from 'react';
import { StatusBar } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AuthProvider } from './src/lib/auth';
import RootNavigator from './src/navigation';
import './src/global.css';

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
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
