import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUnreadCount } from '../screens/Notifications/useNotificationsViewModel';
// Note: Notification — Import push notification hook for FCM setup
import { usePushNotifications } from '../lib/pushNotifications';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useAuth } from '../lib/auth';
import { LoginScreen, DashboardScreen, ProfileScreen } from '../screens';
import { AppTheme } from './theme';
import { LoadingOverlay } from '../components/LoadingOverlay';
import UploadProgressFloat from '../components/UploadProgressFloat';
import type { BottomSheetParams, AlertParams } from './useAppNavigation';
import type { MomentPhoto } from '../types';

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
  RecipesTab: undefined;
  MapTab: undefined;
  NotificationsTab: undefined;
  ExpensesTab: undefined;
  ProfileTab: undefined;
};

export type NotificationsStackParamList = {
  NotificationsList: undefined;
  BottomSheet: BottomSheetParams;
  Alert: AlertParams;
};

export type ExpensesStackParamList = {
  ExpensesList: undefined;
  BottomSheet: BottomSheetParams;
  Alert: AlertParams;
};

export type MomentsStackParamList = {
  MomentsList: undefined;
  MomentDetail: { momentId: string };
  PhotoGallery: { photos: MomentPhoto[]; initialIndex: number };
  BottomSheet: BottomSheetParams;
  Alert: AlertParams;
};

export type FoodSpotsStackParamList = {
  FoodSpotsList: undefined;
  FoodSpotDetail: { foodSpotId: string };
  FoodSpotGallery: { photos: MomentPhoto[]; initialIndex: number };
  BottomSheet: BottomSheetParams;
  Alert: AlertParams;
};

export type RecipesStackParamList = {
  RecipesList: undefined;
  RecipeDetail: { recipeId: string };
  RecipeGallery: { photos: MomentPhoto[]; initialIndex: number };
  WhatToEat: undefined;
  CookingSession: { sessionId: string };
  CookingHistory: undefined;
  BottomSheet: BottomSheetParams;
  Alert: AlertParams;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  BottomSheet: BottomSheetParams;
  Alert: AlertParams;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const MomentsStack = createNativeStackNavigator<MomentsStackParamList>();
const FoodSpotsStack = createNativeStackNavigator<FoodSpotsStackParamList>();
const RecipesStack = createNativeStackNavigator<RecipesStackParamList>();
const NotificationsStack = createNativeStackNavigator<NotificationsStackParamList>();
const ExpensesStack = createNativeStackNavigator<ExpensesStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

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
// Imports (after type declarations to avoid hoisting issues)
// ---------------------------------------------------------------------------

import MomentsScreen from '../screens/Moments/MomentsScreen';
import MomentDetailScreen from '../screens/MomentDetail/MomentDetailScreen';
import PhotoGalleryScreen from '../screens/PhotoGallery/PhotoGalleryScreen';
import FoodSpotsScreen from '../screens/FoodSpots/FoodSpotsScreen';
import FoodSpotDetailScreen from '../screens/FoodSpotDetail/FoodSpotDetailScreen';
import MapScreen from '../screens/Map/MapScreen';
import RecipesScreen from '../screens/Recipes/RecipesScreen';
import RecipeDetailScreen from '../screens/RecipeDetail/RecipeDetailScreen';
import WhatToEatScreen from '../screens/WhatToEat/WhatToEatScreen';
import CookingSessionScreen from '../screens/CookingSession/CookingSessionScreen';
import CookingHistoryScreen from '../screens/CookingHistory/CookingHistoryScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ExpensesScreen from '../screens/Expenses/ExpensesScreen';
import BottomSheetRoute from '../screens/BottomSheetRoute';
import AlertRoute from '../screens/AlertRoute';

// ---------------------------------------------------------------------------
// Shared screen options for modal routes
// ---------------------------------------------------------------------------

const MODAL_OPTIONS = {
  animation: 'none',
  presentation: 'transparentModal',
} as const;

// ---------------------------------------------------------------------------
// Moments stack navigator
// ---------------------------------------------------------------------------

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
      <MomentsStack.Screen name="BottomSheet" component={BottomSheetRoute} options={MODAL_OPTIONS} />
      <MomentsStack.Screen name="Alert" component={AlertRoute} options={MODAL_OPTIONS} />
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
      <FoodSpotsStack.Screen name="BottomSheet" component={BottomSheetRoute} options={MODAL_OPTIONS} />
      <FoodSpotsStack.Screen name="Alert" component={AlertRoute} options={MODAL_OPTIONS} />
    </FoodSpotsStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Recipes stack navigator
// ---------------------------------------------------------------------------

function RecipesNavigator() {
  return (
    <RecipesStack.Navigator screenOptions={{ headerShown: false }}>
      <RecipesStack.Screen name="RecipesList" component={RecipesScreen} />
      <RecipesStack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <RecipesStack.Screen
        name="RecipeGallery"
        component={PhotoGalleryScreen}
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
      <RecipesStack.Screen name="WhatToEat" component={WhatToEatScreen} />
      <RecipesStack.Screen name="CookingSession" component={CookingSessionScreen} />
      <RecipesStack.Screen name="CookingHistory" component={CookingHistoryScreen} />
      <RecipesStack.Screen name="BottomSheet" component={BottomSheetRoute} options={MODAL_OPTIONS} />
      <RecipesStack.Screen name="Alert" component={AlertRoute} options={MODAL_OPTIONS} />
    </RecipesStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Notifications stack navigator
// ---------------------------------------------------------------------------

function NotificationsNavigator() {
  return (
    <NotificationsStack.Navigator screenOptions={{ headerShown: false }}>
      <NotificationsStack.Screen name="NotificationsList" component={NotificationsScreen} />
      <NotificationsStack.Screen name="BottomSheet" component={BottomSheetRoute} options={MODAL_OPTIONS} />
      <NotificationsStack.Screen name="Alert" component={AlertRoute} options={MODAL_OPTIONS} />
    </NotificationsStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Expenses stack navigator
// ---------------------------------------------------------------------------

function ExpensesNavigator() {
  return (
    <ExpensesStack.Navigator screenOptions={{ headerShown: false }}>
      <ExpensesStack.Screen name="ExpensesList" component={ExpensesScreen} />
      <ExpensesStack.Screen name="BottomSheet" component={BottomSheetRoute} options={MODAL_OPTIONS} />
      <ExpensesStack.Screen name="Alert" component={AlertRoute} options={MODAL_OPTIONS} />
    </ExpensesStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Profile stack navigator
// ---------------------------------------------------------------------------

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="BottomSheet" component={BottomSheetRoute} options={MODAL_OPTIONS} />
      <ProfileStack.Screen name="Alert" component={AlertRoute} options={MODAL_OPTIONS} />
    </ProfileStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Main tabs (authenticated)
// ---------------------------------------------------------------------------

function NotificationTabIcon({ color, size }: { color: string; size: number }) {
  const count = useUnreadCount();
  return (
    <View>
      <Icon name={count > 0 ? 'bell' : 'bell-outline'} size={size} color={color} />
      {count > 0 && (
        <View
          className="absolute -top-1 -right-1 bg-error rounded-full items-center justify-center"
          style={{ minWidth: 14, height: 14, paddingHorizontal: 3 }}>
          <Text className="text-white text-[9px] font-bold leading-none">
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </View>
  );
}

function MainNavigator() {
  // Note: Notification — Initialize push notifications when authenticated user enters main app.
  // This requests permission, registers FCM token with backend, and sets up
  // foreground/background notification handlers. Runs once per app launch.
  usePushNotifications();

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
        name="RecipesTab"
        component={RecipesNavigator}
        options={{
          tabBarLabel: 'Recipes',
          tabBarIcon: ({ color, size }) => <Icon name="chef-hat" size={size} color={color} />,
        }}
      />
      <MainTab.Screen
        name="ExpensesTab"
        component={ExpensesNavigator}
        options={{
          tabBarLabel: 'Expenses',
          tabBarIcon: ({ color, size }) => <Icon name="cash-multiple" size={size} color={color} />,
        }}
      />
      <MainTab.Screen
        name="NotificationsTab"
        component={NotificationsNavigator}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size }) => <NotificationTabIcon color={color} size={size} />,
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
        name="ProfileTab"
        component={ProfileNavigator}
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
        {/* Global overlays — inside NavigationContainer for useAppColors() access */}
        <LoadingOverlay />
        <UploadProgressFloat />
      </BottomSheetModalProvider>
    </NavigationContainer>
  );
}
