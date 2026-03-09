import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import apiRouter from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { registerCrons } from './services/CronService';
import { validateEnv } from './utils/validateEnv';

validateEnv();

const app = express();
const PORT = process.env.PORT || 5005;

// Task 3: CORS whitelist
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://love-scrum.hungphu.work',
  'https://dev-love-scrum.hungphu.work',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Task 5: Helmet security headers
app.use(helmet());

// Task 6: Request body size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(requestLogger);

// Task 4: Rate limiting (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  const globalLimiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false });
  const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 5, standardHeaders: true, legacyHeaders: false });
  const aiLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false });
  const uploadLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false });

  app.use('/api', globalLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/google', authLimiter);
  app.use('/api/ai', aiLimiter);
  app.use('/api/*/photos', uploadLimiter);
  app.use('/api/*/audio', uploadLimiter);
}
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
