import express from 'express';
import cors from 'cors';
import path from 'path';
import cron from 'node-cron';
import { momentRoutes } from './routes/moments';
import { foodSpotRoutes } from './routes/foodspots';
import { mapRoutes } from './routes/map';
import { sprintRoutes } from './routes/sprints';
import { goalRoutes } from './routes/goals';
import { settingsRoutes } from './routes/settings';
import { tagRoutes } from './routes/tags';
import { authRoutes } from './routes/auth';
import { recipeRoutes } from './routes/recipes';
import { cookingSessionRoutes } from './routes/cookingSessions';
import { aiRoutes } from './routes/ai';
import { achievementRoutes } from './routes/achievements';
import { profileRoutes } from './routes/profile';
import { proxyImageRoute } from './routes/proxy-image';
import { proxyAudioRoute } from './routes/proxy-audio';
import { notificationRoutes } from './routes/notifications';
import { pushRoutes } from './routes/push';
import { dateWishRoutes } from './routes/dateWishes';
import { datePlanRoutes } from './routes/datePlans';
import { resolveLocationRoute } from './routes/resolveLocation';
import { loveLetterRoutes } from './routes/loveLetters';
import { recapRoutes } from './routes/recap';
import { expenseRoutes } from './routes/expenses';
import { requireAuth } from './middleware/auth';
import prisma from './utils/prisma';
import { createNotification } from './utils/notifications';

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
app.use('/api/resolve-location', resolveLocationRoute);
// proxy-audio is public: <audio src> can't send Authorization headers.
// Security: endpoint validates URL must start with CDN_BASE_URL (our own CDN only).
app.use('/api/proxy-audio', proxyAudioRoute);

// Protected routes
app.use('/api/proxy-image', requireAuth, proxyImageRoute);
app.use('/api/moments', requireAuth, momentRoutes);
app.use('/api/foodspots', requireAuth, foodSpotRoutes);
app.use('/api/map', requireAuth, mapRoutes);
app.use('/api/sprints', requireAuth, sprintRoutes);
app.use('/api/goals', requireAuth, goalRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/tags', requireAuth, tagRoutes);
app.use('/api/recipes', requireAuth, recipeRoutes);
app.use('/api/cooking-sessions', requireAuth, cookingSessionRoutes);
app.use('/api/ai', requireAuth, aiRoutes);
app.use('/api/achievements', requireAuth, achievementRoutes);
app.use('/api/profile', requireAuth, profileRoutes);
app.use('/api/notifications', requireAuth, notificationRoutes);
app.use('/api/push', requireAuth, pushRoutes);
app.use('/api/date-wishes', requireAuth, dateWishRoutes);
app.use('/api/date-plans', requireAuth, datePlanRoutes);
app.use('/api/love-letters', requireAuth, loveLetterRoutes);
app.use('/api/recap', requireAuth, recapRoutes);
app.use('/api/expenses', requireAuth, expenseRoutes);

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  server.timeout = 300_000; // 5 minutes — allow large file uploads

  // Every minute: deliver SCHEDULED love letters where scheduledAt <= now
  cron.schedule('* * * * *', async () => {
    try {
      const due = await prisma.loveLetter.findMany({
        where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
        include: { sender: { select: { name: true } } },
      });
      if (due.length === 0) return;
      await Promise.all(
        due.map(async (letter) => {
          await prisma.loveLetter.update({
            where: { id: letter.id },
            data: { status: 'DELIVERED', deliveredAt: new Date() },
          });
          await createNotification(
            letter.recipientId,
            'love_letter',
            `Thư tình mới từ ${letter.sender.name} 💌`,
            letter.title,
            '/love-letters',
          ).catch(() => {});
        }),
      );
      console.log(`[cron] delivered ${due.length} scheduled love letter(s)`);
    } catch (err) {
      console.error('[cron] love_letter delivery error:', err);
    }
  });

  // 6 AM daily reminder: notify all users if there's a planned/active DatePlan for today
  cron.schedule('0 6 * * *', async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      const plans = await prisma.datePlan.findMany({
        where: {
          date: { gte: todayStart, lt: todayEnd },
          status: { in: ['planned', 'active'] },
        },
        select: { id: true, title: true },
      });
      if (plans.length === 0) return;
      const users = await prisma.user.findMany({ select: { id: true } });
      const title = 'Nhắc hẹn hò hôm nay 💑';
      const message = plans.length === 1
        ? `Hôm nay có kế hoạch: ${plans[0].title}`
        : `Hôm nay có ${plans.length} kế hoạch hẹn hò đang chờ!`;
      await Promise.all(
        users.map((u) => createNotification(u.id, 'daily_plan_reminder', title, message, '/date-planner')),
      );
      console.log(`[cron] daily_plan_reminder sent to ${users.length} users`);
    } catch (err) {
      console.error('[cron] daily_plan_reminder error:', err);
    }
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 9 AM on last day of each month — monthly recap notification
  // cron has no "last day" syntax, so run on days 28-31 and check at runtime
  cron.schedule('0 9 28-31 * *', async () => {
    try {
      const now = new Date();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      if (now.getDate() !== lastDayOfMonth) return;
      const users = await prisma.user.findMany({ select: { id: true } });
      await Promise.all(
        users.map((u) =>
          createNotification(u.id, 'monthly_recap', 'Tổng kết tháng 📅', 'Xem tổng kết tháng vừa qua của hai bạn!', '/monthly-recap'),
        ),
      );
      console.log(`[cron] monthly_recap sent to ${users.length} users`);
    } catch (err) {
      console.error('[cron] monthly_recap error:', err);
    }
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 9 AM every Monday — weekly recap notification
  cron.schedule('0 9 * * 1', async () => {
    try {
      const users = await prisma.user.findMany({ select: { id: true } });
      await Promise.all(
        users.map((u) =>
          createNotification(u.id, 'weekly_recap', 'Recap tuần qua 📊', 'Xem tổng kết tuần của hai bạn!', '/weekly-recap'),
        ),
      );
      console.log(`[cron] weekly_recap sent to ${users.length} users`);
    } catch (err) {
      console.error('[cron] weekly_recap error:', err);
    }
  }, { timezone: 'Asia/Ho_Chi_Minh' });
}

export default app;
