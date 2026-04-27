// Sprint 67 T455 — Legacy stub retired. The original placeholder route at
// /monthly-recap was where the BE cron's monthly_recap notification deep-
// linked into a "MonthlyRecap — placeholder" screen. The editorial recap
// now lives at /recap/monthly?month=YYYY-MM (D4 promoted out of (modal)).
//
// This file kept (not deleted) so cold-start deep-links carrying the legacy
// `link: '/monthly-recap'` path don't 404 — Expo Router redirects on mount.
// BE-side migration of the cron link string is tracked under
// B-be-monthly-recap-link-update (P3·1pt). Once BE flips, this file can be
// deleted.

import { Redirect } from 'expo-router';

export default function MonthlyRecapLegacyRedirect() {
  return <Redirect href="/recap/monthly" />;
}
