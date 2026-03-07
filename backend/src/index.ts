import express from 'express';
import cors from 'cors';
import path from 'path';
import apiRouter from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { registerCrons } from './services/CronService';

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiRouter);

// Global error handler — must be registered LAST
app.use(errorHandler);

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  server.timeout = 300_000; // 5 minutes — allow large file uploads
  registerCrons();
}

export default app;
