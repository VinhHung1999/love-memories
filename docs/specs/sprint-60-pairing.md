# Sprint 60 — Technical Spec: Couple Pairing (PairChoice + PairCreate)

**Author:** DEV | **Date:** 2026-04-18 | **Tickets:** T284 (PairChoice + PairCreate, this doc) — T285 (PairJoin) cross-references this doc for invite-code format and deep-link scheme.

---

## Context

After SignUp commits the user (`/auth/register` per `sprint-60-auth.md` §Flow), the
user lands on PairChoice — the 2-card landing that branches into either creating
an invite (this task) or joining one (T285). Both paths are required to reach
Personalize (T286); the "Bỏ qua" skip is **disabled** for MVP per Boss decision.

The earlier T284 card was spec'd from memory and got 4 details wrong; this doc is
the canonical contract going forward.

---

## Invite code format — 8-char hex

Backend (`backend/src/services/CoupleService.ts:41`) generates codes via
`crypto.randomBytes(4).toString('hex')` → 8 lowercase hex chars (`[0-9a-f]`).
Tests assert `code.length === 8` (`backend/src/__tests__/api.test.ts:1634`). No BE
change.

UI presentation: split into two groups of 4, uppercase, monospace —
`A3F8 D2B1`. T285 (PairJoin) renders 8 cells, accepts `[0-9a-fA-F]` (case
insensitive on input, normalize to lowercase before POST `/api/couple/join`).

**Codes do not expire server-side.** A couple's `inviteCode` column persists
until rotated. Rotation is **user-initiated** only — there is no `expiresAt`
field, no polling for expiry. The PairInvite UI exposes a "Lấy mã mới?" button
that calls `POST /api/couple/generate-invite` to overwrite the column with a
fresh 8-hex code; previous codes immediately become invalid.

---

## Backend changes

### `createCoupleSchema.name` becomes optional

```diff
- name: z.string().min(1),
+ name: z.string().min(1).optional(),
```

`Couple.name` is already nullable in the Prisma schema. `CoupleService.createCouple`
passes `null` to Prisma when name is missing or empty after trim. Web PWA legacy
callers that supply a name continue to work unchanged.

**Why:** PairCreate fires `POST /api/couple` immediately after the user picks
"Tạo lời mời" — well before the couple-name input lives in T286 Personalize.
Deferring couple creation past PairChoice would force us to rebuild every pair
endpoint to be unauthenticated. Doing the creation now (couple with `name=null`)
+ updating the name in Personalize via `PUT /api/couple` keeps every existing
endpoint behind `requireCouple` and the JWT contract intact.

### No new endpoints

T284 wires into:

| Method | Path                           | Purpose                                    |
| ------ | ------------------------------ | ------------------------------------------ |
| POST   | `/api/couple`                  | First call — creates couple, returns new tokens (JWT now carries coupleId) + first inviteCode |
| POST   | `/api/couple/generate-invite`  | "Lấy mã mới" — rotates the inviteCode      |
| GET    | `/api/couple`                  | 3s polling — when `users.length === 2`, partner has joined |

---

## Mobile flow (mobile-rework)

```
SignUp /auth/register ─▶ useAuthGate routes to /(auth)/pair-create
                                       │
                                       ▼
                          ┌──────────────────────────┐
                          │ PairChoice (pair-create) │
                          │  • "Tạo lời mời" card    │
                          │  • "Có mã rồi" card      │
                          │  • Bỏ qua [DISABLED]     │
                          └────┬──────────────────┬──┘
                  Tạo lời mời  │                  │ Có mã rồi
                               ▼                  ▼
                  POST /api/couple {}      router.push('/(auth)/pair-join')
                  setSession(newTokens)            │  (T285)
                  router.replace                   │
                       '/(auth)/pair-invite'       │
                               │                   │
                               ▼                   │
                  ┌──────────────────────────┐     │
                  │ PairInvite               │     │
                  │  • "A3F8 D2B1" big code  │     │
                  │  • QR (memoura://pair?…) │     │
                  │  • Chia sẻ button        │     │
                  │  • Lấy mã mới? link      │     │
                  │  • polls GET /api/couple │     │
                  └────┬─────────────────────┘     │
            partner joins (memberCount=2)          │
                       │                           │
                       ▼                           ▼
              router.replace('/(auth)/personalize')   ──▶  T286
```

### Routes + folders

| Route                              | Folder                                                                |
| ---------------------------------- | --------------------------------------------------------------------- |
| `app/(auth)/pair-create.tsx`       | `src/screens/PairChoice/{PairChoiceScreen, usePairChoiceViewModel}`   |
| `app/(auth)/pair-invite.tsx`       | `src/screens/PairInvite/{PairInviteScreen, usePairInviteViewModel}`   |

The route file is a 1-line re-export per the existing convention.

### PairChoice ViewModel responsibilities

State:
- `creating: boolean` — set true while POST `/api/couple` is in flight; disables
  both option cards.
- `error: 'network' | null`.

Actions:
- `onCreate()` — POST `/api/couple` (no body), `setSession` with returned
  tokens (JWT now carries coupleId), then `router.replace('/(auth)/pair-invite',
  { params: { code: res.inviteCode } })`.
- `onJoin()` — `router.push('/(auth)/pair-join')` (T285 owns the screen; this
  task only needs the navigation hookup).
- `onSkip()` — no-op (button is disabled visually + `disabled={true}` on press).

### PairInvite ViewModel responsibilities

Initial code arrives via route param from PairChoice (`?code=…`); ViewModel
seeds state from it on mount and **does NOT auto-call `/generate-invite`** — the
code is fresh. If the user lands here without a route param (e.g. deep-link or
manual navigation), fall back to GET `/api/couple` to read the current
`inviteCode`.

State:
- `code: string | null`
- `rotating: boolean` — true while `/generate-invite` POST is in flight.
- `polling: boolean` — true while the 3s poll interval is active.
- `partnerJoined: boolean` — set when `memberCount === 2`. Drives navigation.
- `error: 'network' | null`.

Actions:
- `onRotate()` — POST `/api/couple/generate-invite`, replace `code` with response.
- `onShare()` — wraps RN `Share.share` with the share-message + URL (see below).
  No special handling for Android (Share API already routes to chooser).
- (no manual onJoin / onContinue — partner-join transition is automatic.)

### Polling

`useEffect` registers a `setInterval(3000)` on mount that fires GET
`/api/couple`. When `res.memberCount === 2` (server returns this in
CoupleController.getCouple), set `partnerJoined = true`, clear interval, and
`router.replace('/(auth)/personalize')`. Cleanup on unmount and when
`partnerJoined` becomes true.

Network errors during poll: silently retry on next tick. We don't display
mid-poll errors — a hiccup is uninteresting, and the next 3s tick recovers.

### Share message

`react-i18next` keys `onboarding.pairing.shareMessage` (vi/en):

| Locale | String                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------- |
| vi     | `"Mình đợi em ở Memoura ✨ Mở link để vào: https://memoura.app/pair?code={{code}} (hoặc nhập mã {{code}} trong app)"` |
| en     | `"Come find me on Memoura ✨ Open: https://memoura.app/pair?code={{code}} (or type code {{code}} in the app)"`         |

Both forms — the URL and the raw 8-hex code — are handled by T280's deep-link
parser (`mobile-rework/src/lib/deepLink.ts`). The parser treats `code` as
free-form; it does not assume a specific length, so 8-hex passes through.

### QR

`react-native-qrcode-svg` (uses `react-native-svg`, already installed at
15.12.1). Encodes the **custom-scheme URL** `memoura://pair?code=XXXXXXXX` —
not the universal-link form — because:
- Universal-link Associated Domains plumbing lands in Sprint 65; in 60 the
  `https://memoura.app/pair?…` URL only works inside the share-sheet (a
  human-readable iMessage that recipients tap), not as a QR target where Safari
  would intercept it instead of Memoura.
- Custom scheme deep-links work today on installed devices; that's the QR's
  audience (a partner with the app already installed pointing their camera).

QR size: 192px. White margin per the QR spec. Wrapped in a `bg-bg-elev`
rounded card per `pairing.jsx:160`.

---

## Auth gate — `onboardingComplete` flag

### Why the existing gate fails

`useAuthGate` (`mobile-rework/app/_layout.tsx:71`) currently routes by
`accessToken + coupleId`. After PairCreate's POST `/api/couple`, the user has a
coupleId but no partner yet. A kill + relaunch on PairInvite would be evaluated
as `authed && paired && inAuthGroup` → `router.replace('/(tabs)')`, bouncing the
user into a half-built dashboard with no partner. Same orphaned-state hazard the
T282 §Flow rationale called out for SignUp.

### Fix

Add `onboardingComplete: boolean` (default `false`) to `useAuthStore`. Persisted
under the existing `@memoura/auth/v1` AsyncStorage key. New action
`setOnboardingComplete(value: boolean)`. Cleared by `clear()`.

Set `false` on `setSession()` (every fresh login/register starts a brand-new
onboarding session). T286 (OnboardingDone) sets it `true` as the explicit
"commit the onboarding" moment.

`useAuthGate` becomes:

```ts
const onboardingComplete = useAuthStore((s) => s.onboardingComplete);

if (!authed && !inAuthGroup) {
  router.replace('/(auth)/welcome');
} else if (authed && !onboardingComplete && inTabsGroup) {
  router.replace('/(auth)/pair-create');
} else if (authed && onboardingComplete && inAuthGroup) {
  router.replace('/(tabs)');
}
```

The `coupleId` checks go away from the gate. Inside the (auth) group the user
moves freely — pair-create routes them to pair-invite which routes them to
personalize without the gate intervening.

### Edge case — reinstall with existing couple

After app reinstall, hydrate restores cached tokens but not
`onboardingComplete` (it's a fresh install, default `false`). If the user
already has a paired couple in the BE, the gate would (wrongly) shove them back
to PairChoice.

**Decision: lazy probe in useAuthGate, not eager probe in hydrate.**

A new `useOnboardingResume()` hook runs once when the gate first observes
`authed && !onboardingComplete && user.coupleId`: it fires GET `/api/couple` and
if `memberCount === 2`, calls `setOnboardingComplete(true)`. The gate then
re-evaluates and routes to (tabs). Effect deps make it run exactly once per
login session.

Why lazy not eager:
- Hydrate must stay fast and offline-tolerant (network may be down at launch).
- The probe only matters when the user is actually authenticated — the lazy
  hook fires after that's known.
- If the network is offline, the user stays in (auth)/pair-create, which is
  recoverable when they reconnect (the next gate eval re-runs the probe).

Implementation lives in `app/_layout.tsx` next to `useAuthGate`. ~15 LOC.

---

## i18n strings

New `onboarding.pairing.*` namespace (vi.ts + en.ts). Keys:

```
choice.title
choice.subtitle
choice.create.title       ("Tạo lời mời")
choice.create.subtitle    ("Cho người ta một mã 8 ký tự")
choice.create.icon        ("✦")
choice.join.title         ("Có mã rồi")
choice.join.subtitle      ("Nhập mã từ người ta")
choice.join.icon          ("→")
choice.skip               ("Bỏ qua") — disabled
invite.title              ("Mã ghép đôi")
invite.subtitle           ("Gửi mã này cho người ta nhé")
invite.codeLabel          ("Mã 8 ký tự")
invite.shareCta           ("Chia sẻ")
invite.rotateCta          ("Lấy mã mới")
invite.rotating           ("Đang đổi mã…")
invite.waitingTitle       ("Đang đợi người ta…")
invite.waitingSubtitle    ("Mình sẽ tự chuyển sang bước tiếp khi người ta vào")
invite.shareMessage       ("…{{code}}…" — see Share message above)
errors.network            ("Mạng đang trục trặc. Em thử lại nhé.")
```

---

## Out of scope (this sprint)

- Universal-link Associated Domains / AASA registration (Sprint 65 — see
  T280 deep-link parser comment).
- Push-notification "partner just joined" (T286 onwards if needed).
- Deep-link handler edge cases for unauthed entry into PairJoin / already-paired
  no-op (T285 owns these per T280's PO follow-up note).
- Couple name input — T286 Personalize collects this and PUTs `/api/couple`.
