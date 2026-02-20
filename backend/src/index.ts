import express from 'express';
import cors from 'cors';
import path from 'path';
import { momentRoutes } from './routes/moments';
import { foodSpotRoutes } from './routes/foodspots';
import { mapRoutes } from './routes/map';
import { sprintRoutes } from './routes/sprints';
import { goalRoutes } from './routes/goals';
import { authRoutes } from './routes/auth';
import { proxyImageRoute } from './routes/proxy-image';
import { requireAuth } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/proxy-image', requireAuth, proxyImageRoute);
app.use('/api/moments', requireAuth, momentRoutes);
app.use('/api/foodspots', requireAuth, foodSpotRoutes);
app.use('/api/map', requireAuth, mapRoutes);
app.use('/api/sprints', requireAuth, sprintRoutes);
app.use('/api/goals', requireAuth, goalRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
