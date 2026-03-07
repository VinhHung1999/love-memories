import cron from 'node-cron';
import prisma from '../utils/prisma';
import { createNotification } from '../utils/notifications';

export function registerCrons(): void {
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

  // 6 AM daily: notify couple's users if there's a planned/active DatePlan for today
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
        const message =
          plans.length === 1
            ? `Hôm nay có kế hoạch: ${plans[0]!.title}`
            : `Hôm nay có ${plans.length} kế hoạch hẹn hò đang chờ!`;
        await Promise.all(
          couple.users.map((u) =>
            createNotification(u.id, 'daily_plan_reminder', title, message, '/date-planner'),
          ),
        );
        totalSent += couple.users.length;
      }
      if (totalSent > 0) console.log(`[cron] daily_plan_reminder sent to ${totalSent} users`);
    } catch (err) {
      console.error('[cron] daily_plan_reminder error:', err);
    }
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  // 9 AM on last day of month — monthly recap notification
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
