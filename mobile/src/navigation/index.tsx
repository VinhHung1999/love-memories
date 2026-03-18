import React from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
// Icons moved to CurvedTabBar — kept here for future use if needed
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CircleUser, Heart, Home, Mail } from 'lucide-react-native';
// Note: Notification — Import push notification hook for FCM setup
import { usePushNotifications } from '../lib/pushNotifications';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'react-native';
import { useAuth } from '../lib/auth';
import { LoginScreen, DashboardScreen, ProfileScreen } from '../screens';
import { AppTheme, DarkAppTheme } from './theme';
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

export type OnboardingStackParamList = {
  OnboardingCouple: undefined;
  OnboardingAnniversary: { coupleName: string };
  OnboardingInvite: { coupleId: string; anniversaryDate?: string; inviteCode?: string };
  OnboardingCelebration: { coupleId: string; partnerName?: string };
  OnboardingAvatar: { coupleName?: string; coupleId?: string; anniversaryDate?: string };
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
  Paywall: { trigger: 'limit' | 'locked_module' | 'browse'; blockedFeature?: string } | undefined;
  ShareViewer: { token: string };
  JoinCouple: { code: string };
};

/** Dashboard sub-stack — Home + Daily Q&A accessible from card press */
export type DashboardStackParamList = {
  DashboardHome: undefined;
  DailyQuestions: undefined;
};

/** Only the 5 visible bottom tabs */
export type MainTabParamList = {
  Dashboard: undefined;
  MomentsTab: undefined;
  CameraTab: undefined;
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
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import OnboardingWelcomeScreen from '../screens/Onboarding/OnboardingWelcomeScreen';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import CameraTabButton from '../components/CameraTabButton';
import CurvedTabBar, { CAMERA_SIZE, CONTAINER_H } from '../components/CurvedTabBar';
import OnboardingCoupleScreen from '../screens/Onboarding/OnboardingCoupleScreen';
import OnboardingAnniversaryScreen from '../screens/Onboarding/OnboardingAnniversaryScreen';
import OnboardingAvatarScreen from '../screens/Onboarding/OnboardingAvatarScreen';
import OnboardingInviteScreen from '../screens/Onboarding/OnboardingInviteScreen';
import OnboardingCelebrationScreen from '../screens/Onboarding/OnboardingCelebrationScreen';

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="OnboardingCouple" component={OnboardingCoupleScreen} />
      <OnboardingStack.Screen name="OnboardingAnniversary" component={OnboardingAnniversaryScreen} />
      <OnboardingStack.Screen name="OnboardingCelebration" component={OnboardingCelebrationScreen} />
      <OnboardingStack.Screen name="OnboardingAvatar" component={OnboardingAvatarScreen} />
      <OnboardingStack.Screen name="OnboardingInvite" component={OnboardingInviteScreen} />
    </OnboardingStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Dashboard stack navigator (Home + Daily Q&A)
// ---------------------------------------------------------------------------

function DashboardNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
      <DashboardStack.Screen name="DailyQuestions" component={DailyQuestionsScreen} />
    </DashboardStack.Navigator>
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
// MVP-HIDDEN: v1.1
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import MapScreen from '../screens/Map/MapScreen';
import RecipesScreen from '../screens/Recipes/RecipesScreen';
import RecipeDetailScreen from '../screens/RecipeDetail/RecipeDetailScreen';
import WhatToEatScreen from '../screens/WhatToEat/WhatToEatScreen';
import CookingSessionScreen from '../screens/CookingSession/CookingSessionScreen';
import CookingHistoryScreen from '../screens/CookingHistory/CookingHistoryScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ExpensesScreen from '../screens/Expenses/ExpensesScreen';
// MVP-HIDDEN: v1.1
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import AchievementsScreen from '../screens/Achievements/AchievementsScreen';
import LettersScreen from '../screens/Letters/LettersScreen';
import LetterReadScreen from '../screens/LetterRead/LetterReadScreen';
import WishesScreen from '../screens/DateWishes/WishesScreen';
import PlanListScreen from '../screens/DatePlans/PlanListScreen';
import PlanDetailScreen from '../screens/PlanDetail/PlanDetailScreen';
import BottomSheetRoute from '../screens/BottomSheetRoute';
import AlertRoute from '../screens/AlertRoute';
import DailyQuestionsScreen from '../screens/DailyQuestions/DailyQuestionsScreen';
// MVP-HIDDEN: v1.1
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import MonthlyRecapScreen from '../screens/MonthlyRecap/MonthlyRecapScreen';
import PaywallScreen from '../screens/Paywall/PaywallScreen';
import LetterOverlay from '../components/LetterOverlay/LetterOverlay';
import ShareViewerScreen from '../screens/ShareViewer/ShareViewerScreen';
import JoinCoupleScreen from '../screens/JoinCouple/JoinCoupleScreen';
import { setPendingInviteCode } from '../lib/pendingInvite';

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
// MVP-HIDDEN: v1.1
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
// Recipes stack navigator (full-screen, no tab bar) // MVP-HIDDEN: v1.1
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
// Expenses stack navigator (full-screen, no tab bar) // MVP-HIDDEN: v1.1
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      // CurvedTabBar handles all rendering — SVG notch + floating camera button
      tabBar={(props) => <CurvedTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { paddingBottom: CONTAINER_H -  CAMERA_SIZE / 2} }}>
      <MainTab.Screen name="Dashboard" component={DashboardNavigator} />
      <MainTab.Screen name="MomentsTab" component={MomentsNavigator} />
      {/* CameraTab: no component rendered — CurvedTabBar handles the floating button */}
      <MainTab.Screen name="CameraTab" component={React.Fragment} />
      <MainTab.Screen name="LettersTab" component={LettersNavigator} />
      <MainTab.Screen name="ProfileTab" component={ProfileNavigator} />
    </MainTab.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Date Planner stack navigator (full-screen, no tab bar) // MVP-HIDDEN: v1.1
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      {/* MVP-HIDDEN: v1.1 — <AppStack.Screen name="RecipesTab" component={RecipesNavigator} /> */}
      {/* MVP-HIDDEN: v1.1 — <AppStack.Screen name="ExpensesTab" component={ExpensesNavigator} /> */}
      <AppStack.Screen name="NotificationsTab" component={NotificationsNavigator} />
      {/* MVP-HIDDEN: v1.1 — <AppStack.Screen name="DatePlannerTab" component={DatePlannerNavigator} /> */}
      {/* MVP-HIDDEN: v1.1 — <AppStack.Screen name="FoodSpotsTab" component={FoodSpotsNavigator} /> */}
      {/* MVP-HIDDEN: v1.1 — <AppStack.Screen name="MapTab" component={MapScreen} /> */}
      {/* MVP-HIDDEN: v1.1 — <AppStack.Screen name="Achievements" component={AchievementsScreen} /> */}
      {/* MVP-HIDDEN: v1.1 — <AppStack.Screen name="MonthlyRecapTab" component={MonthlyRecapScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} /> */}
      <AppStack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <AppStack.Screen name="ShareViewer" component={ShareViewerScreen} />
      <AppStack.Screen name="JoinCouple" component={JoinCoupleScreen} />
    </AppStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Deep linking config
// ---------------------------------------------------------------------------

/** Extract invite code from URL if path matches /invite/:code */
function extractInviteCode(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/invite\/([^/?#]+)/);
    return match ? match[1] : null;
  } catch {
    // lovescrum:// custom scheme — fall back to string matching
    const match = url.match(/\/invite\/([^/?#]+)/);
    return match ? match[1] : null;
  }
}

const linking = {
  prefixes: ['https://memoura.app', 'https://dev.memoura.app', 'lovescrum://'],
  config: {
    screens: {
      ShareViewer: 'share/:token',
      JoinCouple: 'invite/:code',
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (url) {
      const code = extractInviteCode(url);
      if (code) setPendingInviteCode(code);
    }
    return url ?? undefined;
  },
  subscribe(listener: (url: string) => void) {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const code = extractInviteCode(url);
      if (code) setPendingInviteCode(code);
      listener(url);
    });
    return () => subscription.remove();
  },
};

// ---------------------------------------------------------------------------
// Root navigator — switches based on auth state
// ---------------------------------------------------------------------------

export default function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const colorScheme = useColorScheme();
  const navTheme = colorScheme === 'dark' ? DarkAppTheme : AppTheme;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-darkBgCard">
        <ActivityIndicator size="large" color={navTheme.colors.primary} />
      </View>
    );
  }


  return (
    <NavigationContainer theme={navTheme as any} linking={linking}>
      {/* BottomSheetModalProvider inside NavigationContainer so portals have theme access */}
      <BottomSheetModalProvider>
        {!isAuthenticated
          ? <AuthNavigator />
          : !user?.coupleId
            ? <OnboardingNavigator />
            : <AppNavigator />}
        {/* Global overlays — inside NavigationContainer for useAppColors() access */}
        {isAuthenticated ? <LetterOverlay /> : null}
        <LoadingOverlay />
        <UploadProgressFloat />
      </BottomSheetModalProvider>
    </NavigationContainer>
  );
}
