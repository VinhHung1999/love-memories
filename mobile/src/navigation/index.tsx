import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { LoginScreen, DashboardScreen, ProfileScreen } from '../screens';
import { AppTheme } from './theme';
import { LoadingOverlay } from '../components/LoadingOverlay';

// ---------------------------------------------------------------------------
// Stack param types
// ---------------------------------------------------------------------------

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Profile: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// ---------------------------------------------------------------------------
// Auth stack (unauthenticated)
// ---------------------------------------------------------------------------

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Main tabs (authenticated)
// ---------------------------------------------------------------------------

function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: AppTheme.colors.primary,
        tabBarInactiveTintColor: AppTheme.colors.textMid,
        tabBarStyle: { borderTopColor: AppTheme.colors.border },
        headerShown: false,
      }}>
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </MainTab.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Root navigator — switches based on auth state
// ---------------------------------------------------------------------------

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={AppTheme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={AppTheme}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
      {/* Global overlay — inside NavigationContainer for useAppColors() access */}
      <LoadingOverlay />
    </NavigationContainer>
  );
}
