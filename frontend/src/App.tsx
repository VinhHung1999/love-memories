import { Routes, Route } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './lib/auth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MomentsPage from './pages/MomentsPage';
import MomentDetail from './pages/MomentDetail';
import FoodSpotsPage from './pages/FoodSpotsPage';
import FoodSpotDetail from './pages/FoodSpotDetail';
import MapPage from './pages/MapPage';
import GoalsPage from './pages/GoalsPage';
import SprintDetail from './pages/SprintDetail';
import PhotoBoothPage from './pages/PhotoBoothPage';
import MorePage from './pages/MorePage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetail from './pages/RecipeDetail';
import CookingSessionPage from './pages/CookingSessionPage';
import CookingSessionFlow from './pages/CookingSessionFlow';
import CookingSessionHistory from './pages/CookingSessionHistory';
import AchievementsPage from './pages/AchievementsPage';
import NotificationsPage from './pages/NotificationsPage';
import DatePlannerPage from './pages/DatePlannerPage';
import DatePlanDetailPage from './pages/DatePlanDetailPage';
import LoveLettersPage from './pages/LoveLettersPage';
import WeeklyRecapPage from './pages/WeeklyRecapPage';
import MonthlyRecapPage from './pages/MonthlyRecapPage';
import ExpensesPage from './pages/ExpensesPage';
import OnboardingOverlay from './components/OnboardingOverlay';

async function registerPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const reg = await navigator.serviceWorker.register('/sw.js');
    // Fetch VAPID public key
    const res = await fetch('/api/push/vapid-key', {
      headers: { Authorization: `Bearer ${localStorage.getItem('love-scrum-token')}` },
    });
    if (!res.ok) return;
    const { publicKey } = await res.json() as { publicKey: string };
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('love-scrum-token')}`,
      },
      body: JSON.stringify(sub.toJSON()),
    });
  } catch {
    // silent — push is non-critical
  }
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const wasAuthenticatedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) registerPush();
  }, [isAuthenticated]);

  // Invalidate all caches on login so Dashboard gets fresh letter data immediately
  useEffect(() => {
    if (isAuthenticated && !wasAuthenticatedRef.current) {
      queryClient.invalidateQueries();
    }
    wasAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/moments" element={<MomentsPage />} />
        <Route path="/moments/:id" element={<MomentDetail />} />
        <Route path="/foodspots" element={<FoodSpotsPage />} />
        <Route path="/foodspots/:id" element={<FoodSpotDetail />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/sprint/:id" element={<SprintDetail />} />
        <Route path="/photobooth" element={<PhotoBoothPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/what-to-eat" element={<CookingSessionPage />} />
        <Route path="/what-to-eat/history" element={<CookingSessionHistory />} />
        <Route path="/what-to-eat/:id" element={<CookingSessionFlow />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/date-planner" element={<DatePlannerPage />} />
        <Route path="/date-planner/plans/:id" element={<DatePlanDetailPage />} />
        <Route path="/love-letters" element={<LoveLettersPage />} />
        <Route path="/weekly-recap" element={<WeeklyRecapPage />} />
        <Route path="/monthly-recap" element={<MonthlyRecapPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
      </Routes>
    </Layout>
  );
}
