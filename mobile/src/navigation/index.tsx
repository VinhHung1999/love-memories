import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useAuth } from '../lib/auth';
import { LoginScreen, DashboardScreen, ProfileScreen } from '../screens';
import { AppTheme } from './theme';
import { LoadingOverlay } from '../components/LoadingOverlay';
import type { MomentPhoto, FoodSpotPhoto } from '../types';

// ---------------------------------------------------------------------------
// Stack param types
// ---------------------------------------------------------------------------

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  MomentsTab: undefined;
  FoodSpotsTab: undefined;
  MapTab: undefined;
  Profile: undefined;
};

export type MomentsStackParamList = {
  MomentsList: undefined;
  MomentDetail: { momentId: string };
  PhotoGallery: { photos: MomentPhoto[]; initialIndex: number };
};

export type FoodSpotsStackParamList = {
  FoodSpotsList: undefined;
  FoodSpotDetail: { foodSpotId: string };
  // Uses MomentPhoto[] so PhotoGalleryScreen can be reused (structurally compatible)
  FoodSpotGallery: { photos: MomentPhoto[]; initialIndex: number };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const MomentsStack = createNativeStackNavigator<MomentsStackParamList>();
const FoodSpotsStack = createNativeStackNavigator<FoodSpotsStackParamList>();

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
// Moments stack navigator
// ---------------------------------------------------------------------------

import MomentsScreen from '../screens/Moments/MomentsScreen';
import MomentDetailScreen from '../screens/MomentDetail/MomentDetailScreen';
import PhotoGalleryScreen from '../screens/PhotoGallery/PhotoGalleryScreen';
import FoodSpotsScreen from '../screens/FoodSpots/FoodSpotsScreen';
import FoodSpotDetailScreen from '../screens/FoodSpotDetail/FoodSpotDetailScreen';
import MapScreen from '../screens/Map/MapScreen';

function MomentsNavigator() {
  return (
    <MomentsStack.Navigator screenOptions={{ headerShown: false }}>
      <MomentsStack.Screen name="MomentsList" component={MomentsScreen} />
      <MomentsStack.Screen name="MomentDetail" component={MomentDetailScreen} />
      <MomentsStack.Screen
        name="PhotoGallery"
        component={PhotoGalleryScreen}
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
    </MomentsStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Food Spots stack navigator
// ---------------------------------------------------------------------------

function FoodSpotsNavigator() {
  return (
    <FoodSpotsStack.Navigator screenOptions={{ headerShown: false }}>
      <FoodSpotsStack.Screen name="FoodSpotsList" component={FoodSpotsScreen} />
      <FoodSpotsStack.Screen name="FoodSpotDetail" component={FoodSpotDetailScreen} />
      <FoodSpotsStack.Screen
        name="FoodSpotGallery"
        component={PhotoGalleryScreen}
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
    </FoodSpotsStack.Navigator>
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
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Icon name="home-heart" size={size} color={color} />,
        }}
      />
      <MainTab.Screen
        name="MomentsTab"
        component={MomentsNavigator}
        options={{
          tabBarLabel: 'Moments',
          tabBarIcon: ({ color, size }) => <Icon name="heart-multiple-outline" size={size} color={color} />,
        }}
      />
      <MainTab.Screen
        name="FoodSpotsTab"
        component={FoodSpotsNavigator}
        options={{
          tabBarLabel: 'Food',
          tabBarIcon: ({ color, size }) => <Icon name="food-fork-drink" size={size} color={color} />,
        }}
      />
      <MainTab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, size }) => <Icon name="map-outline" size={size} color={color} />,
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <Icon name="account-circle-outline" size={size} color={color} />,
        }}
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
      {/* BottomSheetModalProvider inside NavigationContainer so portals have theme access */}
      <BottomSheetModalProvider>
        {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
        {/* Global overlay — inside NavigationContainer for useAppColors() access */}
        <LoadingOverlay />
      </BottomSheetModalProvider>
    </NavigationContainer>
  );
}
