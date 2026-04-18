# Sprint 60 — Technical Spec: Email Auth + Password Reset

**Author:** DEV | **Date:** 2026-04-18 | **Tickets:** T282 (this doc covers BE + mobile primitives + 3 screens)

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
  - **SignUp** — defers the `register` API per the existing onboarding rule; this
    sprint's screen captures `{name, email, password}` then routes to
    `(auth)/personalize` carrying the draft (final API call lives in T285 finish step).
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

- Real social auth wiring (T283).
- Couple pairing screens (T284).
- Deep-link entry into reset-password (T285) — for now the email link points at the
  web PWA's existing reset surface; mobile-only reset can be added once the
  universal-link plumbing lands.
