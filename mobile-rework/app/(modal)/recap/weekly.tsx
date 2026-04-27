// Sprint 67 T456 — Modal route for the compact weekly recap.
// Spec route `app/(modal)/recap/weekly.tsx?week=YYYY-Www`. ViewModel
// resolves missing / invalid `week` to the previous full ISO week so
// direct route taps without params still work.

import { WeeklyRecapScreen } from '@/screens/Recap/WeeklyRecapScreen';

export default WeeklyRecapScreen;
