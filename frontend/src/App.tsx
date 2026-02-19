import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MomentsPage from './pages/MomentsPage';
import MomentDetail from './pages/MomentDetail';
import FoodSpotsPage from './pages/FoodSpotsPage';
import FoodSpotDetail from './pages/FoodSpotDetail';
import MapPage from './pages/MapPage';
import GoalsPage from './pages/GoalsPage';
import SprintDetail from './pages/SprintDetail';

export default function App() {
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
      </Routes>
    </Layout>
  );
}
