# Sprint 60 — Technical Spec: Email Auth + Password Reset + Social SSO

**Author:** DEV | **Date:** 2026-04-18 | **Tickets:** T282 (BE + mobile primitives + 3 screens), T283 (Google + Apple SSO wire-up)

---

## Context

Sprint 60 lights up the email auth surface for the rebuilt mobile app
(`mobile-rework/`). The legacy `mobile/` app and the web PWA already have email
register / login flows; the rework needs (a) parity screens that match the
prototype (`docs/design/prototype/memoura-v2/auth.jsx`), and (b) one missing piece
on the backend: forgotten-password recovery.

Social auth (Google / Apple) ships in T283 — the social row on these screens is
intentionally a disabled stub.

---

## Backend changes

### Endpoints

| Method | Path                       | Auth | Purpose                                   |
| ------ | -------------------------- | ---- | ----------------------------------------- |
| POST   | `/api/auth/forgot-password`| —    | Issue + email a one-time reset token      |
| POST   | `/api/auth/reset-password` | —    | Consume token, set new password           |

Both endpoints documented in `docs/technical/api-reference.md`.

### Schema

New `PasswordReset` model — mirrors `EmailVerification`:

```prisma
model PasswordReset {
  id        String    @id @default(uuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("password_resets")
}
```

`User.passwordResets` back-relation added. Migration:
`prisma/migrations/20260418000000_sprint60_password_reset/`.

### Service contract

`AuthService.forgotPassword(email)`:
- Look up user by email; if not found OR has no password (Google/Apple-only), return silently.
- Otherwise call `EmailService.sendPasswordResetEmail` which:
  - Rate-limit: 3 requests/hour/user — throws `AppError(429)`.
  - Deletes any existing unused token for the user.
  - Creates a fresh `PasswordReset` row (`crypto.randomBytes(32).toString('hex')`, 1h expiry).
  - Sends email via the existing nodemailer transporter (`SMTP_*` env). When SMTP
    is unconfigured, logs the token (dev convenience).

`AuthService.resetPassword(token, newPassword)`:
- Fetch token; throw `AppError(400)` for unknown / used / expired.
- In a single transaction: bcrypt-hash + update `User.password`, set
  `PasswordReset.usedAt = now()`, revoke every active `RefreshToken` for the user.
- After this, the user must log in fresh on every device — refresh interceptors will
  see 401 and either re-prompt or navigate to Welcome.

### Controller behaviour (security choices)

- `forgot-password` always returns `200 { ok: true }` regardless of whether the
  email is registered, has a password, or hits the rate limit. Errors are caught
  and logged, never surfaced to the client. **No account enumeration.**
- `reset-password` returns `400` for any token failure with a generic message.

### Validation (Zod)

```ts
forgotPasswordSchema = { email: string().email() }
resetPasswordSchema  = { token: string().min(1), newPassword: string().min(6) }
```

`min(6)` matches `registerSchema` to keep frontend and BE rules aligned.

### Tests

`backend/src/__tests__/auth-forgot-reset.test.ts` — 12 integration tests against
the real dev database. Coverage:

- `forgot-password`: happy path, missing email, malformed email, unknown email
  (200 + no token), Google-only account (200 + no token), token replacement.
- `reset-password`: missing/short fields, unknown token, expired token, used token,
  full happy path (verifies password updated, token marked used, refresh tokens
  revoked, login with new password works).

---

## Mobile changes (`mobile-rework/`)

### Reusable primitives

Three components ported from `docs/design/prototype/memoura-v2/auth.jsx`:

| Component       | Purpose                                                |
| --------------- | ------------------------------------------------------ |
| `AuthField`     | Labeled rounded input with focus border + leading icon + optional trailing slot (used by show/hide-password) |
| `AuthBigBtn`    | Full-width pill CTA, dark when enabled, soft when disabled |
| `DividerWith`   | Horizontal rule with centered uppercase label ("hoặc")|

NativeWind only — no `style` prop. Lives under `src/components/` with barrel export.

The `SocialRow` from the prototype is implemented inline on each screen as a
disabled stub for this sprint; T283 will replace it with the real provider buttons.

### Screens

Standard MVVM split. One folder per screen under `src/screens/`:

| Route                              | View / VM                                  |
| ---------------------------------- | ------------------------------------------ |
| `app/(auth)/signup.tsx`            | `SignUp/{SignUpScreen, useSignUpViewModel}`|
| `app/(auth)/login.tsx`             | `Login/{LoginScreen, useLoginViewModel}`   |
| `app/(auth)/forgot-password.tsx`   | `ForgotPassword/{ForgotPasswordScreen, useForgotPasswordViewModel}`|

Each ViewModel:
- Holds form state + Zod schema (the same shapes the BE uses, mirrored client-side
  for inline error rendering — name/email/password for signup, email/password for
  login, email for forgot).
- Submits via `apiClient.post` (refresh interceptor + status-before-json safety).
- Maps BE 400/409/429 responses to friendly Vietnamese error copy.
- On success:
  - **SignUp** — calls `/auth/register` directly, stores tokens via
    `useAuthStore.setSession`. `useAuthGate` then routes the brand-new user to
    `(auth)/pair-create` because they have no `coupleId` yet. (See §Flow below
    for why register fires here, not at a later step.)
  - **Login** — calls `/auth/login`, stores tokens in `useAuthStore`, navigates to
    `(tabs)/index` (or `(auth)/pair-create` if the user has no `coupleId`).
  - **ForgotPassword** — calls `/auth/forgot-password`, swaps to the "It's on its
    way" success view (per prototype).

### Strings

New `onboarding.auth.*` namespace in both `vi.ts` and `en.ts`, double-brace
interpolation for any field-validation messages that include limits
(`"Mật khẩu phải có ít nhất {{min}} ký tự"`).

### Cleanup carried in this commit

- `IntroScreen.tsx:271` — replace hardcoded `'#FFFFFF'` in `DailyVisual` gradient
  with a theme token (`c.bg`). Fixes PO non-blocking note from T281 review.

---

## Out of scope (this sprint)

- Real social auth Android wiring (Sprint 65 — see T283 below).
- Couple pairing screens (T284).
- Deep-link entry into reset-password (T285) — for now the email link points at the
  web PWA's existing reset surface; mobile-only reset can be added once the
  universal-link plumbing lands.

---

## T283 — Google + Apple SSO wire-up

Replaces the disabled `SocialRowStub` from T282 with the real provider buttons.
Backend `/auth/google` + `/auth/apple` already exist (Sprint 58); this ticket is
mobile-side only.

### Library choice — Option A: native modules

| Provider | Package                                          |
| -------- | ------------------------------------------------ |
| Google   | `@react-native-google-signin/google-signin` v16  |
| Apple    | `expo-apple-authentication` v8 (Expo official)   |

Native libraries (Option A) over `expo-auth-session` (Option B) because: (a)
both are battle-tested in the legacy `mobile/` app, (b) Apple HIG requires the
native sheet for Sign in with Apple, (c) Google Sign-In's native sheet is
materially nicer than the in-app browser fallback Option B forces.

### Trade-off paid for Option A

`expo prebuild --clean` regenerates `ios/Memoura/AppDelegate.swift` from a
template, so any hand-edits are wiped. We need to inject the GoogleSignIn URL
handler back in every prebuild — covered by a custom config-plugin
(`plugins/withGoogleSigninUrlHandler.js`).

### Config (`app.config.ts`)

```ts
ios: { ..., usesAppleSignIn: true },           // Apple entitlement
plugins: [
  ...,
  'expo-apple-authentication',                 // Apple
  ['@react-native-google-signin/google-signin', // Google URL scheme
    { iosUrlScheme: 'com.googleusercontent.apps.<reversed-iOS-client-ID>' }],
  './plugins/withGoogleSigninUrlHandler',      // injects GIDSignIn handler
],
extra: {
  googleIosClientId: '<iOS client ID>',
  googleWebClientId: '<Web client ID — required for idToken issuance>',
},
```

`extra.*` is read by `src/config/env.ts` and passed to
`GoogleSignin.configure({ iosClientId, webClientId })` once at root layout
boot.

### `src/lib/socialAuth.ts`

Exports five things:

| Export                         | Purpose                                             |
| ------------------------------ | --------------------------------------------------- |
| `configureGoogleSignIn()`      | Idempotent boot-time `GoogleSignin.configure`       |
| `signInWithGoogle()`           | Returns `{ kind: 'token', idToken } \| { kind: 'cancelled' }` |
| `signInWithApple()`            | Same shape; returns `nameHint` on first sign-in     |
| `completeGoogleSignIn(token)`  | POST `/auth/google` (+ `/google/complete` on `needsCouple`) → `setSession` |
| `completeAppleSignIn(token, nameHint?)` | Same flow against `/auth/apple`                |

### Apple credential persistence

Apple sends `email` + `fullName` ONLY on the first sign-in for a given Apple
ID. Subsequent calls return only the stable `user` ID + `identityToken`. We
cache the first-time tuple in AsyncStorage (`@memoura/apple-credentials/v1`)
keyed by Apple user ID, so later sign-ins can still pass `nameHint` to the
backend. Cache is best-effort — the backend already wrote the user row on
first sign-in.

### Custom config-plugin: `plugins/withGoogleSigninUrlHandler.js`

The official google-signin Expo plugin only writes the reversed-client URL
scheme to `Info.plist`. RN 0.77+ Swift AppDelegates do NOT auto-swizzle the
URL handler, so without manual injection the Google sheet opens but the
callback URL never reaches `GIDSignIn.sharedInstance.handle(url)` and the
sign-in promise hangs.

The plugin runs `withAppDelegate` to:
1. Add `import GoogleSignIn` after `import ReactAppDependencyProvider`.
2. Insert `if GIDSignIn.sharedInstance.handle(url) { return true }` as the
   first line of the existing `application(_:open:options:)` body.

Both edits are idempotent (string-presence checks) so re-running prebuild on
an already-patched AppDelegate is a no-op. Throws if the AppDelegate template
changes shape — better to fail loud than silently break sign-in.

### Backend contract (already in place — Sprint 58)

| Method | Path                       | Body                              | Returns |
| ------ | -------------------------- | --------------------------------- | ------- |
| POST   | `/api/auth/google`         | `{ idToken }`                     | `AuthResponse` OR `{ needsCouple: true, googleProfile }` |
| POST   | `/api/auth/google/complete`| `{ idToken, inviteCode?, coupleName? }` | `AuthResponse` |
| POST   | `/api/auth/apple`          | `{ idToken, name? }`              | `AuthResponse` OR `{ needsCouple: true, appleProfile }` |
| POST   | `/api/auth/apple/complete` | `{ idToken, name?, inviteCode?, coupleName? }` | `AuthResponse` |

The mobile flow always calls `/complete` with no `inviteCode` / `coupleName`
on the `needsCouple` branch — the user is created with `coupleId=null` and
the auth gate then routes them to `/(auth)/pair-create`, identical to the
email-signup path.

### `src/components/SocialRow.tsx`

Replaces the inline `SocialRowStub` from T282 in both `LoginScreen` and
`SignUpScreen`. Behaviour:

| Platform | Apple                  | Google              | Phone               |
| -------- | ---------------------- | ------------------- | ------------------- |
| iOS      | Real (HIG sheet)       | Real (native sheet) | Coming-soon `Alert` |
| Android  | Hidden (HIG: iOS only) | Coming-soon `Alert` | Coming-soon `Alert` |

Per-button `loading` state (`'apple' | 'google' | null`) — the active button
shows an `ActivityIndicator` and the row dims while a sign-in is in flight,
absorbing further taps.

### Cancellation

User-cancelled sign-ins return silently — no toast, no error message:
- Google: `statusCodes.SIGN_IN_CANCELLED` or `result.type === 'cancelled'`
- Apple: `ERR_REQUEST_CANCELED`

Other errors surface as `formError = { kind: 'socialFailed' }` →
"Đăng nhập chưa thành. Em thử lại sau nhé." copy.

### iOS entitlements

`ios/Memoura/Memoura.entitlements` (regenerated by prebuild from
`usesAppleSignIn: true`):

```xml
<key>com.apple.developer.applesignin</key>
<array><string>Default</string></array>
```

### Out of scope for T283

- Android Google Sign-In (web client ID is wired but the Android flavor
  doesn't have native Google Play Services config yet — Sprint 65).
- Phone / SMS auth — placeholder only, no decision yet on Twilio vs Firebase.
- Account linking (existing email user signs in with Google for the same
  email) — backend already handles the email-link case; no separate UI.

---

## Flow

End-to-end onboarding sequence for the rework app. **The `/auth/register` call
fires at SignUp submit** — every step after sign-up is JWT-authenticated.

```
Welcome → Intro → SignUp ──/auth/register──▶ PairChoice
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                          PairCreate       PairJoin       (Skip "Để sau")
                       /couple/generate-   /couple/join-          │
                          invite             Couple                │
                              │               │                    │
                              └───────┬───────┘                    │
                                      ▼                            │
                                Personalize ◀──────────────────────┘
                                      │
                                      ▼
                                Permissions
                                      │
                                      ▼
                                OnboardingDone → (tabs)/index
```

### Why register fires at SignUp submit (not later)

Three constraints force the call to happen here:

1. **Pair endpoints need JWT.** Both `POST /api/couple/generate-invite` (T284)
   and `POST /api/couple/joinCouple` (T285) are behind `requireAuth`. The user
   must hold an access token before either screen can do anything useful.
2. **Sprint-6 spec §T282 #4** explicitly stated: "Submit → POST /auth/register
   via apiClient.post — on success store token + user, navigate /(auth)/pair-
   create." The first version of this spec said otherwise; that was wrong.
3. **The "onboarding-API-timing" memory rule does not apply** to this flow.
   That rule was written for the legacy web onboarding wizard which collected
   personalize fields before the user had even chosen an email. Here, by the
   time SignUp submits, name + email + password are all valid — there is no
   information left to defer.

### Task ownership of the auth-commit moment

| Task | Owns                                                   |
| ---- | ------------------------------------------------------ |
| **T282** (this) | The `/auth/register` call itself. SignUp's submit handler is the auth-commit moment. |
| T284 | PairCreate UI + `/couple/generate-invite` + the "Để sau" skip exit. Inherits JWT from T282. |
| T285 | PairJoin UI (6-digit OTP + scan QR) + `/couple/joinCouple`. Inherits JWT from T282. |
| T286 | Personalize + Permissions + OnboardingDone — pure UX/settings, no auth-commit. |

There is no separate "Finish" task that owns a deferred register call. The
register call is owned by T282 and complete before the user reaches PairChoice.

### Why no in-memory `signupDraftStore`

The earlier WIP version staged `{name, email, password}` in a Zustand store so
a later step could call `/auth/register`. That store has been removed — once
register fires at submit, there is nothing to stage. Personalize works against
the already-authed user via `PATCH /api/profile` (or equivalent) when wired
up in T286.

### Confirm-password field

The signup form includes a 4-th field `confirmPassword`. Validation rule:

```ts
signupSchema.refine((d) => d.password === d.confirmPassword, {
  path: ['confirmPassword'],
  message: 'passwordMismatch',
})
```

Reason: the password input uses `secureTextEntry` + `autoComplete="password-new"`,
so the user has zero visibility into typos until the next time they log in. A
mismatched-pair check at submit prevents the lockout.
