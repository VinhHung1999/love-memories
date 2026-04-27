import { createNotification } from '../src/utils/notifications';

// Sprint 67 T455 verify — fire a monthly_recap notification at hung40 on
// the dev BE so Boss can verify the deep-link
// `/recap/monthly?month=2026-03` opens the new MonthlyRecapScreen on the
// dev IPA (build 119) for the previous full month.
//
// Today (2026-04-27) → previous full month = 2026-03 (March 2026).
//
// Title + body match BE CronService monthly_recap copy 1:1; only the link
// path is bumped from the legacy `/monthly-recap` to the new
// `/recap/monthly?month=YYYY-MM` so the mobile dispatchNotificationLink
// regex captures the month param into the route.

(async () => {
  await createNotification(
    '3380fc89-1d35-4008-a6ea-fb7dd30c6f75', // hung40@gmail.com
    'monthly_recap',
    'Recap tháng 3 📅',
    'Xem tổng kết tháng 3 của hai bạn! (test 2026-03)',
    '/recap/monthly?month=2026-03',
  );
  console.log('OK monthly_recap noti fired to hung40 (link=/recap/monthly?month=2026-03)');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
