---
name: react-native-view-shot RN 0.84 incompatibility
description: view-shot@4.x uses RCTScrollView removed in RN 0.84 Fabric — upgrade to v5.0.0-alpha.3
type: feedback
---

react-native-view-shot@4.x fails to compile on RN 0.84 (Fabric): `RCTScrollView` was removed. `pod install` does NOT fix it — the error is in the package source code.

**Why:** RCTScrollView is a pre-Fabric RN internal class eliminated in 0.84. v5.0.0-alpha.3 migrated to UIScrollView.

**How to apply:** Always use `react-native-view-shot@5.0.0-alpha.3` (or later) with RN 0.84+. Also note: cert errors from Xcode can mask downstream compilation errors — use `xcodebuild` directly to see full error list.
