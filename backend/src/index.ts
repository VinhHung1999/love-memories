import express from 'express';
import cors from 'cors';
import path from 'path';
import { momentRoutes } from './routes/moments';
import { foodSpotRoutes } from './routes/foodspots';
import { mapRoutes } from './routes/map';
import { sprintRoutes } from './routes/sprints';
import { goalRoutes } from './routes/goals';

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/moments', momentRoutes);
app.use('/api/foodspots', foodSpotRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/goals', goalRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
