# Sprint 33 — Google OAuth Login

## Goal
Add Google login as an alternative to email/password. Existing users with matching email get auto-linked. New Google users still go through couple setup flow.

---

## Requirements

### 1. Database Changes
- Add `googleId String? @unique` to User model
- Make `password` nullable: `String?` (Google-only users have no password)

### 2. Backend — `POST /api/auth/google`
Receives `{ idToken }` from frontend (Google ID token from Google Sign-In).

**Flow:**
1. Verify `idToken` with Google (`google-auth-library` package — `OAuth2Client.verifyIdToken()`)
2. Extract `email`, `name`, `picture`, `sub` (Google user ID) from payload
3. **Lookup user by `googleId`** → if found, login (issue tokens, return user)
4. **Lookup user by `email`** → if found, auto-link: set `googleId` on that user, update `avatar` if null, login
5. **No user found** → return `{ needsCouple: true, googleProfile: { email, name, picture, googleId } }` (HTTP 200, NOT an error)

### 3. Backend — `POST /api/auth/google/complete`
For new Google users who need to set up a couple.

Receives `{ idToken, inviteCode?, coupleName? }`

**Flow:**
1. Verify idToken again
2. Create user with `email`, `name` from Google, `avatar` from Google `picture`, `googleId` from `sub`, `password` = null
3. Create/join couple (same logic as register)
4. Issue tokens, return user

### 4. Frontend — Google Sign-In Button
- Use `@react-oauth/google` package with `GoogleOAuthProvider` + `GoogleLogin` component
- Add Google Client ID env var: `VITE_GOOGLE_CLIENT_ID`
- Backend env var: `GOOGLE_CLIENT_ID` (for token verification)

### 5. Frontend — LoginPage Changes
- Add "Continue with Google" button (Google's branded button via `@react-oauth/google`)
- Divider: "or" between Google button and email/password form
- Google button on BOTH login and register views (same button, same flow)
- On success response from `/api/auth/google`:
  - If `needsCouple: true` → show couple setup UI (create/join), then call `/api/auth/google/complete`
  - If tokens returned → login immediately (existing user or auto-linked)

### 6. Frontend — Profile/Settings: Link Google Account
- In profile or settings page, show "Link Google Account" button if user has no `googleId`
- Show "Google linked" badge if already linked
- Endpoint: `POST /api/auth/google/link` (requireAuth) — receives `{ idToken }`, sets `googleId` on current user

### 7. Auto-Link Behavior (email match)
- When Google email matches existing account → auto-link `googleId`, login
- If existing user has no avatar → set avatar from Google `picture`
- If existing user already has avatar → keep existing, don't overwrite
- Name is NOT overwritten for existing users (they already chose their name)

### 8. New Google User Defaults
- `name` = Google profile name (user can edit later in profile)
- `avatar` = Google profile picture URL (user can change later)
- `password` = null (can set password later if they want — SKIP for this sprint)

---

## Acceptance Criteria
- [ ] Google button on login page, works on both login/register mode
- [ ] Existing user with same email → auto-link, login immediately
- [ ] New Google user → couple setup flow, then account created
- [ ] Google profile picture used as default avatar for new users & existing users without avatar
- [ ] Google profile name used as default for new users
- [ ] Profile page shows "Link Google" button for users without googleId
- [ ] Email/password login still works as before
- [ ] Tests pass (backend + frontend)
- [ ] Build succeeds

---

## Out of Scope
- "Set password" for Google-only users (future sprint)
- Google One Tap (just standard button for now)
- Apple Sign-In
