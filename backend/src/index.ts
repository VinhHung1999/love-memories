import express from 'express';
import cors from 'cors';
import path from 'path';
import cron from 'node-cron';
import apiRouter from './routes/index';
import { errorHandler } from './middleware/errorHandler';
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

app.use('/api', apiRouter);

// Global error handler — must be registered LAST
app.use(errorHandler);

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

  // 6 AM daily reminder: notify couple's users if there's a planned/active DatePlan for today
  cron.schedule('0 6 * * *', async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      const couples = await prisma.couple.findMany({ include: { users: { select: { id: true } } } });
      let totalSent = 0;
      for (const couple of couples) {
        const plans = await prisma.datePlan.findMany({
          where: { coupleId: couple.id, date: { gte: todayStart, lt: todayEnd }, status: { in: ['planned', 'active'] } },
          select: { title: true },
        });
        if (plans.length === 0) continue;
        const title = 'Nhắc hẹn hò hôm nay 💑';
        const message = plans.length === 1
          ? `Hôm nay có kế hoạch: ${plans[0]!.title}`
          : `Hôm nay có ${plans.length} kế hoạch hẹn hò đang chờ!`;
        await Promise.all(
          couple.users.map((u) => createNotification(u.id, 'daily_plan_reminder', title, message, '/date-planner')),
        );
        totalSent += couple.users.length;
      }
      if (totalSent > 0) console.log(`[cron] daily_plan_reminder sent to ${totalSent} users`);
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
