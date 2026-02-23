import { Routes, Route } from 'react-router-dom';
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

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

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
      </Routes>
    </Layout>
  );
}
