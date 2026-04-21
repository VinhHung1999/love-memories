# Retrospective Log

**Purpose:** Track lessons learned and improvements across Sprints.
**Owner:** Scrum Master (SM)

---

## How to Use This Log

After each Sprint, SM documents:
1. What went well
2. What didn't go well
3. Root causes identified
4. Prompt updates made
5. Action items created

---

## Template

```markdown
## Sprint N Retrospective
**Date:** YYYY-MM-DD
**Facilitator:** SM

### What Went Well
- [Item 1]
- [Item 2]

### What Didn't Go Well
- [Problem 1]
  - Root cause: [Why this happened]
  - Affected prompt: [Which prompt]
- [Problem 2]

### Prompt Updates Made
- `[ROLE]_PROMPT.md`: [What was added/changed]
- `workflow.md`: [What was added/changed]

### Action Items
| Action | Owner | Status | Due |
|--------|-------|--------|-----|
| [Action 1] | [Role] | [ ] | [Date] |
| [Action 2] | [Role] | [ ] | [Date] |

### Verification (Before Next Sprint)
- [ ] All action items from previous retro completed
- [ ] Prompt updates applied
- [ ] Team acknowledges changes
```

---

## Sprint History

## Sprint 61 Retrospective
**Date:** 2026-04-21
**Facilitator:** PO (Lu)

### What Went Well
- Pill BottomTab + Profile + Legal/Delete Account shipped (T336–T374, ~42pts). Profile screen hit 1:1 prototype parity including hero, stats, 8-row settings, edit flows, coming-soon stubs.
- iOS compliance gate cleared: T347 (Privacy/Terms/Version), T348 (Delete Account App Store 5.1.1(v)).
- Theme system held up: T356 Light/Dark/System picker layered on `useAppColors()` + NativeWind vars without touching screens.
- Density token seed (airy) locked — T366 density pass established `py-5`/`py-6`/`mb-6` as current values; tokens centralization deferred to T368 cleanly.
- Build cadence stayed high: Build 30, 32, 33, 34, 35, 36, 39 — each test cycle had a concrete payload Boss could verify.

### What Didn't Go Well
- **Scroll-clip "LẦN 6" ate ~3h without deterministic fix.** T369 hook + T372 spacer + Build 35/36 all failed on Boss's iPhone 15 Pro Max despite math saying clearance was sufficient. Resolved blind via T374 (+30px buffer) — we shipped a fix but don't know the root cause.
  - Root cause (meta): no runtime telemetry on real device. Math assumptions (`insets.bottom = 34`, `pill = 98`, `spacer = 120`) were unverified.
- **Dev-client instrumentation detour burned ~2h for zero data.**
  - Tried: Metro + Cloudflare quick-tunnel (broken on cloudflared 2026.2.0 Darwin 25.3) → named tunnel `metro-dev.hungphu.work` (worked) → Debug IPA Build 37 (`ip.txt` missing port, RN dialed default :8081 through Cloudflare which only proxies 80/443 → "No script URL") → Build 38 (`:80` baked in, but iOS ATS blocked HTTP to non-localhost domain, NSAllowsLocalNetworking doesn't cover public hosts).
  - Hit 3 RN/iOS gotchas stacked: `react-native-xcode.sh` hardcodes LAN IP into `ip.txt` (ignores `EXPO_PACKAGER_HOSTNAME`), `RCTBundleURLProvider` defaults to port 8081 + http scheme, iOS ATS NSAllowsLocalNetworking only whitelists localhost/RFC1918.
  - Boss called the path off with "không là được" — correct read; we were over-engineering for one bug.
- **Trust cost of repeated "build to test" cycles for the same bug** — by the 6th attempt Boss's confidence in the fix drops even when the build is clean. Blind +30px shipped only because LẦN 6 was the cap.
- **WHITEBOARD header drifted.** Still showed Build 30 awaiting QA at sprint close; PO didn't refresh across Build 32→39 iterations.

### Root Causes
- **Missing device-side telemetry for layout assumptions.** Whenever a fix depends on hardware-specific numbers (safe-area, nav-bar height, font metrics), a telemetry path needs to be baked in BEFORE the fix attempts, not after the 5th retry.
- **Underestimated coupling: Metro + Cloudflare + RN bootstrap + iOS ATS.** Each layer's default silently undid the previous layer's workaround. Without an end-to-end connectivity check post-build (curl from device, log tail), we built 2 IPAs that never had a chance.
- **Sprint scope vs debug budget unbounded.** No explicit "if LẦN N fails, fall back to blind buffer / defer" decision rule — it took Boss to pull the plug.

### Prompt Updates Made
- `.claude/rules/mobile-rework.md`: appended "Device-side telemetry first when fix depends on runtime insets" + "Dev-client over Cloudflare tunnel has 3 stacked failure modes — prefer sim or LAN Metro instead" (covers ATS, react-native-xcode.sh LAN hardcode, Cloudflare :80/:443 proxy restriction).
- No PO/DEV prompt churn — process held; lesson is technical.

### Action Items
| Action | Owner | Status | Due |
|--------|-------|--------|-----|
| Move T367 (BottomSheet reopen) + T368 (airy tokens centralize) to backlog for Sprint 62 | PO | [ ] | Sprint 62 plan |
| If LẦN 6 blind fix doesn't hold on Boss final check → escalate to T375 device-telemetry spike (onLayout + useSafeAreaInsets log to AsyncStorage, user-triggered export) | DEV | [ ] | Conditional |
| Sprint-scope rule: any "LẦN ≥ 3" bug requires explicit decision before next attempt (continue / blind / defer) | PO | [ ] | Applied Sprint 62+ |
| WHITEBOARD refresh discipline: update header row whenever a new build ships, not only at sprint close | PO | [ ] | Ongoing |

### Verification (Before Next Sprint)
- [ ] T367 / T368 exist in `backlog.md` as P1 candidates
- [ ] `.claude/rules/mobile-rework.md` has new telemetry + dev-client bullets
- [ ] Sprint-7.md archived, Sprint 62 board file seeded when Boss provides goal
- [ ] brain2 `raw/2026-04-21/code-knowledge/mobile/` staged with 3 new bug entries

---

<!-- Add new retrospectives above this line -->
