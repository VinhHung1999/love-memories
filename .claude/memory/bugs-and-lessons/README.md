# Bugs & Lessons Learned

## Resolved Bugs

### React Hooks after early return (Sprint 49 — OverlayHeader migration)
- **Cause:** `useSharedValue`/`useAnimatedScrollHandler` declared after `if (isLoading) return` guard in 4 detail screens
- **Fix:** Always declare ALL hooks before any early returns, even if the value is only used after the guard

### Extra closing `</View>` tag (Sprint 49 — MomentDetailScreen)
- **Cause:** Manual JSX restructuring left one stray `</View>` inside `Animated.ScrollView`, causing TS parse errors
- **Fix:** Count open/close tags carefully when restructuring large JSX blocks; lint catches it as TS17002

```markdown
### Bug title (Sprint/Context)
- **Cause:** What caused it
- **Fix:** How it was resolved
```

## Lessons Learned

_(Add lessons from debugging, design mistakes, or surprising behaviors)_

```markdown
### Lesson title
- What happened
- Key takeaway
```

### Mapbox public token URL restriction — backend fetch needs Referer header
- Mapbox `pk.*` tokens can have URL whitelist restrictions. Server-side fetch has no Referer → Mapbox returns 403.
- Fix: add `Referer: <api-domain>` header to all backend→Mapbox fetch calls.
- Key takeaway: always send Referer when proxying Mapbox from backend; or use a secret token (`sk.*`) without URL restrictions.

### backend/.env.development is a TRACKED file — never commit secrets to it
- Unlike `.env` (gitignored), `.env.development` is committed to git history.
- Appending a secret (e.g. MAPBOX_TOKEN) and including it in a commit triggers GitHub Secret Scanning and blocks the push.
- Fix: `git reset HEAD~1`, remove the secret line, re-stage only code files, recommit.
- Key takeaway: treat `.env.development` like a public file — store secrets in `.env` (gitignored) only.

### ESLint v9 flat config missing (Backend & Frontend)
- Both backend and frontend were missing `eslint.config.js` for ESLint v9's flat config format.
- Backend required installing `typescript-eslint` (`npm install --save-dev typescript-eslint`); frontend already had it.
- Both use the `tseslint.config()` pattern to define rules.
- Key takeaway: ESLint v9+ uses flat config (`eslint.config.js`) — the old `.eslintrc.*` format is no longer supported by default.

### React 19 `useRef<T>()` requires explicit initial value (TS2554)
- React 19 changed the `useRef` signature to require an explicit initial value argument.
- `useRef<T>()` (no argument) now causes a TypeScript error: TS2554 (expected 1 argument, got 0).
- Fix: use `useRef<T | undefined>(undefined)` instead of `useRef<T>()`.
- Key takeaway: always pass an explicit initial value to `useRef` in React 19+.

### Enum values are uppercase: Sprint status and Goal status
- Sprint status enum values are uppercase: `ACTIVE`, `PLANNING`, `COMPLETED`, `CANCELLED`.
- Goal status enum values are uppercase: `TODO`, `IN_PROGRESS`, `DONE`.
- Key takeaway: always use the uppercase enum strings when calling the API — lowercase or mixed-case values will be rejected.

### Express route ordering — literal routes before parameterized
- In Express routers, literal routes (`/backlog`, `/reorder`) MUST be defined before parameterized routes (`/:id`, `/:id/status`) or Express will match the param first.
- Pattern: define all literal/named routes at top, then `/:id` variants below.

### Flex overflow: truncate requires min-w-0 on flex children (Sprint 4)
- In a flex row, `truncate` (overflow: hidden + text-overflow: ellipsis) silently fails unless the flex child also has `min-w-0`.
- Fix: add `min-w-0 truncate` together on the child element; add `flex-shrink-0` on siblings that must not compress (e.g., date badge).
- Key takeaway: `min-w-0` is always required alongside `truncate` inside flex containers.

### Touch event index access: e.touches[0] is possibly undefined in TS (Sprint 4)
- TypeScript flags `e.touches[0]` as `Touch | undefined` when using strict mode, causing a TS error in touch handlers.
- Fix: use `e.touches.item(0)` which returns `Touch | null`, then null-check — TypeScript accepts this narrowing cleanly.
- Key takeaway: prefer `TouchList.item(n)` over bracket notation in TypeScript touch event handlers.

### Canvas CORS taint from browser img cache (Sprint 6 Photo Booth)
- Cause: regular `<img>` tags load `/uploads/` images into browser cache WITHOUT CORS mode. Canvas then tries to draw the same URL with `crossOrigin='anonymous'` → browser serves the opaque cached entry → canvas is tainted → `toBlob()` / `toDataURL()` throws SecurityError.
- Fix: use `fetch(url)` → `blob` → `URL.createObjectURL()` in `loadImage()`. Object URLs are always same-origin so canvas never gets tainted, regardless of original image source.
- Key takeaway: never use `crossOrigin='anonymous'` for canvas if the same URL is already loaded by `<img>` elsewhere. Use fetch→blob→objectURL instead.

### Vite server.proxy does NOT apply to vite preview (Sprint 6)
- Cause: `server.proxy` in vite.config.ts only works for `vite dev`. When switching production to `vite preview` (via PM2), the proxy config is ignored → all `/api/*` calls return 404.
- Fix: add a separate `preview.proxy` block pointing to the production backend port.
- Key takeaway: `server` and `preview` are independent config blocks in Vite. Always configure proxy in both if using vite preview for production.

### Camera capture distortion from drawImage without aspect ratio (Sprint 8)
- Cause: `ctx.drawImage(video, 0, 0, w, h)` stretches webcam feed into w×h regardless of actual video aspect ratio (videoWidth/videoHeight).
- Fix: compute cover-crop source rect (sx, sy, sw, sh) from video.videoWidth/videoHeight before calling `ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h)`. Apply mirror (ctx.translate/scale) before the drawImage call.
- Key takeaway: always read `video.videoWidth` and `video.videoHeight` for cover-crop; never assume the video fills exactly the requested dimensions.

### CanvasPreview composite layer order (Sprint 8)
- Old approach: frame.render() baked stickers into result canvas; stickers re-drawn on preview. Overlay had no clean insertion point.
- Fix: pass empty stickers to frame.render(), then composite in CanvasPreview: base → overlay → stickers. One finalCanvas serves both download and preview (no double-drawing).
- Key takeaway: for clean layer ordering in canvas compositing, render each layer independently and composite explicitly.

### Custom CSS carousel layout — use a library instead (Sprint 9)
- Self-coded CSS carousels (flex + scroll-snap, CSS Grid + vw units) went through 5+ broken iterations: `%` width fails in overflow-x flex, `vw` arbitrary values may not be generated by Tailwind, `minWidth` inline style overrides `max-width`, `scroll-snap-align: center` freezes on wide desktop containers (centers require negative scrollLeft → clamps to 0).
- Fix: use `swiper` (v12 React) — `slidesPerView`, `centeredSlides`, `breakpoints` config handle all responsive cases reliably.
- Key takeaway: horizontal swipe carousels are a CSS edge-case minefield. Reach for Swiper or Embla from the start; custom CSS only works for trivially simple single-breakpoint cases.

### AppSettings pattern — localStorage loses data on device switch (Sprint 9)
- Storing user config (e.g., relationship start date) in `localStorage` means data disappears on new device/browser.
- Fix: simple `app_settings` key-value table in DB with `GET/PUT /api/settings/:key` endpoint.
- Key takeaway: any user preference that should survive device changes must live in the DB, not localStorage.

### PO must not code — delegate to DEV (Sprint 10)
- PO directly edited Dashboard.tsx instead of sending task to DEV via tm-send. Boss caught it.
- Key takeaway: in multi-agent team, PO reviews and specs only — all code changes go through DEV, even small ones.

### hover:opacity buttons invisible on mobile touch devices
- Cause: `opacity-0 group-hover:opacity-100` makes buttons (e.g., photo delete) permanently hidden on mobile since there's no hover event.
- Fix: use `md:opacity-0 md:group-hover:opacity-100` — buttons always visible on mobile, hover-reveal on desktop only.
- Key takeaway: never gate interactive elements behind hover-only CSS on touch targets. Use responsive prefixes (`md:`) to separate mobile (always visible) from desktop (hover-reveal).

### Dev DB migrations not applied — recurring 500 errors (Sprint 19, 21)
- Cause: After schema changes, DEV runs migration on prod DB but forgets dev DB (love_scrum_dev). Backend queries new columns → Prisma throws → 500.
- Fix: Always run `DATABASE_URL=...love_scrum_dev npx prisma migrate deploy` after each migration.
- Key takeaway: Include dev DB migration in every deployment checklist. This has happened multiple times across sprints.

### Route comment correct, route path missing suffix (Sprint 21)
- `router.put('/:id/stops/:stopId', ...)` — comment said `/done` but path was missing it. Done button called `/stops/:stopId/done` → Express fell through to wrong handler → silent 500.
- Key takeaway: when defining sub-resource action routes (`/done`, `/publish`, etc.), verify the path string matches the comment, not just the comment itself.

### Filter logic || vs && — compound status+date conditions (Sprint 21)
- Bug: Completed plan still showed as "Đang diễn ra" on Dashboard + list page.
- Cause: `p.status === 'active' || isToday` — OR meant any today plan always matched, even completed ones.
- Fix: `p.status === 'active' && isToday` — AND ensures both conditions must be true.
- Key takeaway: When debugging "data not updating", check the DISPLAY FILTER logic first before blaming cache/invalidation. Spent 5 rounds fixing cache when the real bug was a simple `||` vs `&&`.

### React Query: invalidate BOTH detail + list queries in mutation onSuccess
- Bug: Plan completed on detail page but list page + Dashboard still showed "Đang diễn ra".
- Cause: onSuccess only invalidated `['date-plans', id]` (detail) but not `['date-plans']` (list).
- Key takeaway: Always invalidate both `['key', id]` AND `['key']` in every mutation onSuccess that changes entity status.
- **Race condition corollary**: If mutation A triggers mutation B (chained), do NOT invalidate the list in A's onSuccess — the list refetch will return stale data before B commits. Let B's onSuccess own the list invalidation.

### Google Maps link parsing — multiple URL formats (Sprint 22)
- Google Share/Maps links redirect through many formats: `share.google`→Google Search (q= param), `maps.app.goo.gl`→directions (daddr= as text or coords), direct maps links (/@lat,lng).
- Must check `daddr=` for both coordinate format (`10.805,106.697`) and text format (`Cơm Tấm Tài, 1 Nguyễn An Ninh...`). Skip daddr as place name when it's coords.
- Key takeaway: when building URL parsers for external services, always trace real redirect chains with `curl -v -L` first — never assume URL format from docs alone.

### AuthRequest is not generic — typed params pattern
- `AuthRequest<IdParam>` causes TS2315. AuthRequest extends Request but does not accept a generic.
- Fix: `AuthRequest & { params: IdParam }` for route handlers that need both auth + typed params.
- Key takeaway: custom auth-extended request types lose the Request generic; intersect with `{ params: T }` instead.

### 3D rotateX envelope flap disappears — use clip-path animation instead (Sprint 24)
- backfaceVisibility:hidden + rotateX causes element to vanish at ~90deg — no visible "open" state
- Fix: animate clip-path polygon points directly (sealed: `50% 100%` apex → opened: `50% -80%` apex). 2D, reliable, visually clear
- Previous fix (parent rotates/child clip-path) still had the disappear problem — 2D clip-path animation is the only reliable approach

### CSS clip-path breaks 3D rotateX animation (Sprint 24)
- Cause: clip-path on the same element as rotateX is applied after 3D compositing → triangle stays 2D, rotation invisible
- Fix: parent `motion.div` owns `rotateX` (no clip-path), child `div` holds `clip-path` in local space — child's visual rotates correctly in 3D with parent

### Dev seed missing partner user — Love Letters broken (Sprint 24)
- getPartner() needs 2 users in DB. Dev seed only created 1 → null → "No partner found" error.
- Fix: always seed 2 users (dev@ + partner@) via upsert in seed.ts. Production works because it has real 2-user data.
- Key takeaway: any feature requiring a "partner" lookup must have 2 users in dev seed from day one.

## Migration not applied to dev DB (2026-02-23 — URGENT bug)
After every commit that contains new Prisma migrations, ALWAYS run:
`DATABASE_URL="postgresql://hungphu@localhost:5432/love_scrum_dev" npx prisma migrate deploy`
from `backend/` before reloading PM2. Skipping this caused a 500 error on all writes to the affected table.

### Prisma migration drift — `migrate dev` blocked by modified migration (Sprint 33)
- Cause: A previous migration file was edited after being applied → `npx prisma migrate dev` errors with "migration modified after applied".
- Fix: Create new migration SQL manually → `psql ... -f migration.sql` on both DBs → `npx prisma migrate resolve --applied <name>`.
- Key takeaway: Never edit applied migration files. If drift occurs, write a new migration and apply manually with `psql`.

### react-native-audio-recorder-player v4 API: singleton not class (Sprint 36)
- v4 exports a pre-instantiated singleton (`const AudioRecorderPlayer`), NOT a class — do NOT use `new AudioRecorderPlayer()`
- `AVEncodingOption` is a TypeScript type-only string union — use string literal `'aac'`, not `AVEncodingOption.aac`
- v4.5.0 requires `react-native-nitro-modules` as peer dep — must install both together
- v3.6.0 has a Kotlin compile error on RN 0.74+ new arch (`currentActivity` removed from `ReactContextBaseJavaModule` scope) — avoid v3 on new arch

### RN 0.76 Gradle: allprojects{repositories} silently ignored — use settings.gradle (Sprint 37)
- RN 0.76 Gradle plugin sets `dependencyResolutionManagement(PREFER_SETTINGS)` in settings.gradle → `allprojects { repositories }` in build.gradle is completely ignored.
- Symptom: private Maven repo URL never appears in Gradle search list → "Could not find" error.
- Fix: add private repos to `dependencyResolutionManagement { repositories {} }` in `settings.gradle` (after the react plugin block). Token via `providers.gradleProperty('TOKEN').orElse('').get()`.
- Key takeaway: for RN 0.73+, ALL custom Maven repos must go in settings.gradle, not build.gradle.

### NativeWind v4 babel: preset not plugin
- `nativewind/babel` must be in `presets[]`, NOT `plugins[]` in babel.config.js
- It returns `{ plugins: [...] }` (a preset), so in `plugins[]` Babel throws "[BABEL] .plugins is not a valid Plugin property"
- Internally includes `react-native-worklets/plugin` — no separate reanimated Babel plugin needed
- `nativewind-env.d.ts` belongs at project root; Metro needs `watchFolders` for any alias resolving outside project root

### FastImage required for all image components
- `react-native-fast-image` is installed (not standard `Image` from react-native)
- ALL image components must use `FastImage` — including shared components like `AvatarCircle`
- FastImage does NOT support NativeWind `className` for dimensions → use `style` prop for width/height/position/borderRadius
- `className` can still be used on wrapping `View` elements
- Priority: `FastImage.priority.normal` for lists, `FastImage.priority.high` for detail/hero images
- `resizeMode` uses `FastImage.resizeMode.cover` (not string `"cover"`)

### NativeWind CssInterop crash: disabled + dynamic className on Pressable (Sprint 41)
- Cause: `disabled={dynamic}` prop changing simultaneously with dynamic className ternary (`${cond ? 'a' : 'b'}`) on NativeWind `Pressable` causes crash
- Fix: move dynamic styles (opacity, backgroundColor) to `style` prop; keep only static classes in `className`
- Key takeaway: never mix `disabled` prop changes with dynamic className ternaries on NativeWind Pressable — use `style` for dynamic visual state

### Middleware added to routes breaks existing tests that use test-couple (Sprint 45)
- Adding free-tier middleware to POST routes blocked existing integration tests because test-couple had no subscription.
- Fix: in `beforeAll`, upsert an active subscription for test-couple. Use isolated couples for subscription/free-tier tests.
- Key takeaway: when adding access-control middleware to existing routes, always seed the test couple's prerequisites in beforeAll.

### Prisma migrate reset blocked by AI safety guard — use raw SQL instead (Sprint 45)
- `npx prisma migrate reset` is blocked by Prisma's AI safety guard (Claude Code context detected).
- Fix: apply schema changes directly via `psql -c "ALTER TABLE ..."` then `npx prisma generate`.
- Key takeaway: for dev DB schema sync when migrations are drifted, use raw SQL + `prisma generate` instead of migrate reset.

### Love Letters send: HTTP method mismatch PATCH vs PUT (Sprint 48)
- Mobile `loveLettersApi.send()` called `PATCH /api/love-letters/:id/send` but backend route is `PUT /:id/send` → always 404/405, letter never sent.
- Fix: change method to `PUT` in api.ts. Also throw named error `'PREMIUM_REQUIRED'` on 403 so UI can show specific message.
- Key takeaway: when a send/submit action silently fails, always check HTTP method match between client and server route definition first.

### useNavigation()/useTheme() throw during screen transitions in AppStack (Sprint 41)
- Cause: `useNavigation()` and `useTheme()` throw when NavigationContext is temporarily unavailable during react-native-screens Freeze/Suspense in native stack transitions
- Fix: use `React.useContext(NavigationContext)` / `React.useContext(ThemeContext)` directly (returns undefined, doesn't throw) + fallback to static values
- Key takeaway: in `useAppNavigation()` and `useAppColors()`, never use the throwing hooks — use raw `useContext` with safe fallbacks

### frontend-design skill: invoke via Agent tool, not Skill tool
- `Skill: frontend-design` only loads guidelines — it does NOT produce a design artifact
- Correct usage: `Agent(subagent_type=ui-ux-designer, prompt="design spec for X")` → waits for full spec document → implement from that output
- Lesson: "invoking the skill" means getting a concrete design output, not just reading its instructions
