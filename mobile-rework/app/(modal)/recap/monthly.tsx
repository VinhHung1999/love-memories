// Sprint 67 T452 — Modal route for the editorial monthly recap. Spec route
// `app/(modal)/recap/monthly.tsx?month=YYYY-MM`. ViewModel resolves missing /
// invalid `month` to the previous full month so direct route taps without
// params still work.
//
// Sub-folder route — sits inside the parent `(modal)` group, inheriting its
// presentation:'modal' stack. The legacy `app/(modal)/monthly-recap.tsx`
// stub stays in place for now and gets retired in T455 along with the deep-
// link dispatch update in `app/_layout.tsx`.

import { MonthlyRecapScreen } from '@/screens/Recap';

export default MonthlyRecapScreen;
