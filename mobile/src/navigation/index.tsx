import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { CircleUser, Heart, Home, Mail, MessageCircleHeart } from 'lucide-react-native';
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

/** Root stack for authenticated users — 5-tab MainTabs + full-screen stacks */
export type AppStackParamList = {
  MainTabs: undefined;
  RecipesTab: NavigatorScreenParams<RecipesStackParamList> | undefined;
  ExpensesTab: NavigatorScreenParams<ExpensesStackParamList> | undefined;
  NotificationsTab: NavigatorScreenParams<NotificationsStackParamList> | undefined;
  DatePlannerTab: NavigatorScreenParams<DatePlannerStackParamList> | undefined;
  FoodSpotsTab: NavigatorScreenParams<FoodSpotsStackParamList> | undefined;
  MapTab: undefined;
  Achievements: undefined;
  MonthlyRecapTab: { month?: string } | undefined;
  Paywall: { trigger: 'limit' | 'browse'; blockedFeature?: string } | undefined;
};

/** Only the 5 visible bottom tabs */
export type MainTabParamList = {
  Dashboard: undefined;
  MomentsTab: undefined;
  DailyQuestionsTab: undefined;
  LettersTab: undefined;
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

export type DatePlannerStackParamList = {
  WishesList: undefined;
  PlansList: undefined;
  PlanDetail: { planId: string };
  BottomSheet: BottomSheetParams;
  Alert: AlertParams;
};

export type LettersStackParamList = {
  LettersList: undefined;
  LetterRead: { letterId: string };
  BottomSheet: BottomSheetParams;
  Alert: AlertParams;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const MomentsStack = createNativeStackNavigator<MomentsStackParamList>();
const FoodSpotsStack = createNativeStackNavigator<FoodSpotsStackParamList>();
const RecipesStack = createNativeStackNavigator<RecipesStackParamList>();
const NotificationsStack = createNativeStackNavigator<NotificationsStackParamList>();
const ExpensesStack = createNativeStackNavigator<ExpensesStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const DatePlannerStack = createNativeStackNavigator<DatePlannerStackParamList>();
const LettersStack = createNativeStackNavigator<LettersStackParamList>();

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
import AchievementsScreen from '../screens/Achievements/AchievementsScreen';
import LettersScreen from '../screens/Letters/LettersScreen';
import LetterReadScreen from '../screens/LetterRead/LetterReadScreen';
import WishesScreen from '../screens/DateWishes/WishesScreen';
import PlanListScreen from '../screens/DatePlans/PlanListScreen';
import PlanDetailScreen from '../screens/PlanDetail/PlanDetailScreen';
import BottomSheetRoute from '../screens/BottomSheetRoute';
import AlertRoute from '../screens/AlertRoute';
import DailyQuestionsScreen from '../screens/DailyQuestions/DailyQuestionsScreen';
import MonthlyRecapScreen from '../screens/MonthlyRecap/MonthlyRecapScreen';
import PaywallScreen from '../screens/Paywall/PaywallScreen';
import LetterOverlay from '../components/LetterOverlay/LetterOverlay';

// ---------------------------------------------------------------------------
// Shared screen options for modal routes
// ---------------------------------------------------------------------------

const MODAL_OPTIONS = {
  animation: 'none',
  presentation: 'containedTransparentModal',
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
// Food Spots stack navigator (full-screen, no tab bar — accessed via Dashboard/Map)
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
// Recipes stack navigator (full-screen, no tab bar)
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
// Notifications stack navigator (full-screen, no tab bar)
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
// Expenses stack navigator (full-screen, no tab bar)
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
// 5-tab bottom navigator (visible tabs only)
// ---------------------------------------------------------------------------


function MainTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: AppTheme.colors.primary,
        tabBarInactiveTintColor: AppTheme.colors.textMid,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F0E6E3',
          borderTopWidth: 1,
        },
        headerShown: false,
      }}>
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={1.5} />,
        }}
      />
      <MainTab.Screen
        name="MomentsTab"
        component={MomentsNavigator}
        options={{
          tabBarLabel: 'Moments',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} strokeWidth={1.5} />,
        }}
      />
      <MainTab.Screen
        name="DailyQuestionsTab"
        component={DailyQuestionsScreen}
        options={{
          tabBarLabel: 'Daily Q&A',
          tabBarIcon: ({ color, size }) => <MessageCircleHeart size={size} color={color} strokeWidth={1.5} />,
        }}
      />
      <MainTab.Screen
        name="LettersTab"
        component={LettersNavigator}
        options={{
          tabBarLabel: 'Letters',
          tabBarIcon: ({ color, size }) => <Mail size={size} color={color} strokeWidth={1.5} />,
        }}
      />
      <MainTab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <CircleUser size={size} color={color} strokeWidth={1.5} />,
        }}
      />
    </MainTab.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Date Planner stack navigator (full-screen, no tab bar)
// ---------------------------------------------------------------------------

function DatePlannerNavigator() {
  return (
    <DatePlannerStack.Navigator screenOptions={{ headerShown: false }}>
      <DatePlannerStack.Screen name="WishesList" component={WishesScreen} />
      <DatePlannerStack.Screen name="PlansList" component={PlanListScreen} />
      <DatePlannerStack.Screen name="PlanDetail" component={PlanDetailScreen} />
      <DatePlannerStack.Screen name="BottomSheet" component={BottomSheetRoute} options={MODAL_OPTIONS} />
      <DatePlannerStack.Screen name="Alert" component={AlertRoute} options={MODAL_OPTIONS} />
    </DatePlannerStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Letters stack navigator (full-screen, no tab bar)
// ---------------------------------------------------------------------------

function LettersNavigator() {
  return (
    <LettersStack.Navigator screenOptions={{ headerShown: false }}>
      <LettersStack.Screen name="LettersList" component={LettersScreen} />
      <LettersStack.Screen name="LetterRead" component={LetterReadScreen} />
      <LettersStack.Screen name="BottomSheet" component={BottomSheetRoute} options={MODAL_OPTIONS} />
      <LettersStack.Screen name="Alert" component={AlertRoute} options={MODAL_OPTIONS} />
    </LettersStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// App navigator — root stack for authenticated users
// Recipes / Expenses / Notifications open as full-screen (no tab bar)
// ---------------------------------------------------------------------------

function AppNavigator() {
  // Note: Notification — Initialize push notifications when authenticated user enters main app.
  usePushNotifications();

  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="MainTabs" component={MainTabNavigator} />
      <AppStack.Screen name="RecipesTab" component={RecipesNavigator} />
      <AppStack.Screen name="ExpensesTab" component={ExpensesNavigator} />
      <AppStack.Screen name="NotificationsTab" component={NotificationsNavigator} />
      <AppStack.Screen name="DatePlannerTab" component={DatePlannerNavigator} />
      <AppStack.Screen name="FoodSpotsTab" component={FoodSpotsNavigator} />
      <AppStack.Screen name="MapTab" component={MapScreen} />
      <AppStack.Screen name="Achievements" component={AchievementsScreen} />
      <AppStack.Screen
        name="MonthlyRecapTab"
        component={MonthlyRecapScreen}
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
      <AppStack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </AppStack.Navigator>
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
    <NavigationContainer theme={AppTheme as any}>
      {/* BottomSheetModalProvider inside NavigationContainer so portals have theme access */}
      <BottomSheetModalProvider>
        {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
        {/* Global overlays — inside NavigationContainer for useAppColors() access */}
        {isAuthenticated ? <LetterOverlay /> : null}
        <LoadingOverlay />
        <UploadProgressFloat />
      </BottomSheetModalProvider>
    </NavigationContainer>
  );
}
