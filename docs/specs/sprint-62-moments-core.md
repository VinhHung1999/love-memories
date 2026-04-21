# Sprint 62 — Moments CORE (mobile-rework)

**Goal:** User có thể thêm khoảnh khắc (photos + description + date) và xem lại. Empty states đẹp trên Dashboard + Moments tab. Camera đỏ giữa tabbar mở BottomSheet 3 option. 1:1 theo prototype.

**Board:** `~/Documents/Note/HungVault/brain2/wiki/projects/love-scrum/docs/board/sprints/active/sprint-8.md`
**Branch:** `sprint_62`
**Scope:** 5 task · 14 pts — T375 / T376 / T377 / T378 / T379.

**Out of scope (→ Sprint 63):** Edit, Delete, Location, Mood.
**Out of scope (→ Sprint 64):** Reactions, Comments, Audio memo, Photobooth full.

---

## Mandatory cross-cutting rules (Lu locks these)

1. **Prototype is source of truth.** Cross-check MỌI screen với `docs/design/prototype/memoura-v2/` trước khi code. Nếu prototype disagree với memory rule → follow prototype, flag Lu.
2. **MVVM.** Screen = `XxxScreen.tsx` (view) + `useXxxViewModel.ts` (logic/API). Co-locate `src/screens/Xxx/`.
3. **NativeWind only — ZERO `style` prop.** Carve-outs: `Animated.Value`, `@gorhom/bottom-sheet` backgroundStyle/handleIndicatorStyle, `expo-blur` BlurView radius. Everything else = `className`.
4. **Theme via `useAppColors()`.** No hardcoded hex outside `src/theme/tokens.ts`.
5. **Background upload queue.** Photo upload MUST NOT block UI. Create `mobile-rework/src/lib/uploadQueue.ts` (port từ web `frontend/src/lib/uploadQueue.ts` pattern — enqueue + progress toast + retry 2x).
6. **Full CRUD not required this sprint.** Edit/Delete ship Sprint 63.
7. **Board CLI from now on.** Zu dùng `board start/ack/done/commit` thay vì Read/Edit sprint MD. Lu review dùng `board approve/reject`.

---

## Known gotchas — DO NOT reinvent (lifted from memory + sprint-6/7)

- **`FullWindowOverlay` on iOS** cho BottomSheet (T377) khi mount trên transparentModal — else touch blocked.
- **`BottomSheetTextInput`** inside sheets — raw `TextInput` không trigger keyboard avoid. (Nếu T378 open inside a sheet → dùng. Nếu modal full-screen → `Input` thường OK.)
- **Avatar upload precedent (Sprint 60)**: `apiClient.upload()` FormData helper, fire-and-forget, submit NOT gated on upload. T378 apply y chang cho photos.
- **Permission soft-ask card pattern** (Sprint 60 onboarding) — trước khi gọi `ImagePicker.request*PermissionsAsync()` lần đầu, hiện card giải thích "Vì sao Memoura cần quyền". Reuse nếu đủ thời gian; fallback OK là Alert sau denial.
- **DatePicker config (Sprint 60)**: `@react-native-community/datetimepicker`, iOS `display="spinner"`, max = now (không cho chọn tương lai), min không cần lock. Store dạng ISO trong VM.
- **NativeWind v4 gotcha**: `contentContainerClassName={variable}` KHÔNG work (Tailwind JIT cần literal strings). Literal class string or wrap `<View className="min-h-full ...">`.
- **Pill tab bar scroll clearance**: FlatList/ScrollView luôn kèm `<TabBarSpacer />` cuối cùng. Value lock 150 notched / 116 flat (Sprint 61 T374 LẦN 6 lesson). KHÔNG bump xuống mà chưa verify iPhone 15 Pro Max.
- **`tabBarStyle.position: 'absolute'`** required — else tab content bị squeezed.
- **i18n `{{n}}`** double-brace. All strings vào `src/locales/{vi,en}.ts`. Default `vi`.
- **Reanimated v4 worklet colors**: capture `useAppColors()` values OUTSIDE `useAnimatedStyle` — never call hook inside worklet.

---

## Task spec (one block per card)

### T375 (P0 · 3pt) — Dashboard empty state + latest moment card

**Files:**
- `mobile-rework/app/(tabs)/index.tsx` (already re-exports Dashboard)
- `mobile-rework/src/screens/Dashboard/DashboardScreen.tsx` (refactor)
- `mobile-rework/src/screens/Dashboard/useDashboardViewModel.ts` (refactor)
- `mobile-rework/src/screens/Dashboard/components/EmptyHero.tsx` (new)
- `mobile-rework/src/screens/Dashboard/components/LatestMomentCard.tsx` (new)

**Behavior:**
1. ViewModel `useDashboardViewModel` fetches GET `/api/moments?limit=1&sort=createdAt:desc`.
2. `count === 0` → render `<EmptyHero />`: polaroid stack hero (3 tấm tilted −10° / +6° / −2°, heart pulse animation top layer), headline Vi "Trang đầu của hai đứa" / En "Your very first page", subtitle, 2 CTA Primary "＋ Thêm khoảnh khắc" + secondary "Mở camera" — cả 2 tap đều mở Camera BottomSheet (T377 handle).
3. `count > 0` → render `<LatestMomentCard moment={latest} />`: cover photo (first photo), description preview 2-line truncate, relative time ("3 giờ trước"). Tap → `router.push('/moment-detail?id=<id>')`.
4. Switch reactive — khi user tạo moment mới (T378 success), invalidate query → Dashboard flip empty → has-data tự động.

**Prototype ref:** `empty-states.jsx` (`EmptyHomeBody`) + `dashboard.jsx` (has-data hero).

**Acceptance (verify mỗi điểm):**
- [ ] Empty render polaroid stack + heart pulse + 2 CTA correct text Vi + En
- [ ] Both CTA open Camera BottomSheet (T377 integration works)
- [ ] Has-data render cover + caption preview + relative date
- [ ] Tap card → MomentDetail with correct id
- [ ] Switch empty ↔ has-data reactive sau khi tạo moment mới (không cần reload app)
- [ ] MVVM split, NativeWind only, prototype 1:1

---

### T376 (P0 · 3pt) — Moments tab empty + timeline list

**Files:**
- `mobile-rework/app/(tabs)/moments.tsx` (replace placeholder)
- `mobile-rework/src/screens/Moments/MomentsScreen.tsx` (new)
- `mobile-rework/src/screens/Moments/useMomentsViewModel.ts` (new)
- `mobile-rework/src/screens/Moments/components/MomentCard.tsx` (new)
- `mobile-rework/src/screens/Moments/components/MomentsEmpty.tsx` (new)

**Behavior:**
1. `useMomentsViewModel` fetch GET `/api/moments?limit=20&cursor=<createdAt>` — paginated. Expose `moments`, `hasMore`, `isRefreshing`, `onRefresh`, `onEndReached`.
2. Empty → `<MomentsEmpty />`: centered illustration (empty polaroid + heart), headline, subtitle, 1 CTA "＋ Thêm khoảnh khắc" mở Camera BottomSheet.
3. Has-data → `<FlatList>` vertical:
   - Card: cover photos grid (tối đa 4 cell vuông, "+N" badge nếu còn), description 2-line truncate, date format Vi "Thứ Bảy, 18 tháng 4".
   - Tap card → MomentDetail.
4. Pull-to-refresh + infinite scroll (onEndReached loads next page).
5. FlatList footer = `<TabBarSpacer />` (150 notched / 116 flat).
6. `contentContainerStyle={{ minHeight }}` NOT via className (gotcha — use inline or wrap).

**Acceptance:**
- [ ] Empty state CTA opens BottomSheet
- [ ] Has-data list renders multi-photo grid + truncate + date format Vi
- [ ] Pull-to-refresh works
- [ ] Pagination hits next page before list end
- [ ] TabBarSpacer clearance on iPhone 15 Pro Max (no clip)
- [ ] MVVM + NativeWind + prototype 1:1

---

### T377 (P0 · 3pt) — Camera red middle-tab → Action BottomSheet

**Files:**
- `mobile-rework/app/(tabs)/_layout.tsx` (wire camera icon onPress → open sheet)
- `mobile-rework/src/components/CameraActionSheet.tsx` (new)
- `mobile-rework/src/hooks/useCameraSheet.ts` (new — ref singleton exposed via context, or via zustand)

**Behavior:**
1. Middle pill tab icon (red camera from Sprint 61 T360) `onPress` = open `<CameraActionSheet ref={...} />`.
2. Sheet 3 rows, full-width, divider between:
   - Row 1: 📷 "Chụp ảnh" — onPress → `ImagePicker.requestCameraPermissionsAsync()` → launch camera → close sheet + `router.push('/moment-create?initialPhotos=<urisJSON>')`.
   - Row 2: 🖼️ "Chọn từ thư viện" — `requestMediaLibraryPermissionsAsync()` → launch picker `allowsMultipleSelection: true, selectionLimit: 10, quality: 0.8` → navigate với nhiều URIs.
   - Row 3: 🎭 "Photobooth" + subtitle "Sắp ra mắt 💝" (dimmed 50%, lock icon) — onPress = no-op (optional: toast "Sắp ra mắt"). Sheet vẫn đóng sau tap.
3. Permission denied → Alert "Memoura cần quyền truy cập … để lưu khoảnh khắc. Vào Cài đặt để bật" → `Linking.openSettings()`.
4. **iOS:** `containerComponent={FullWindowOverlay}` — else touches blocked on transparentModal ancestry (known bug).
5. **NativeWind carve-out:** `backgroundStyle` + `handleIndicatorStyle` chỉ accept style object → dùng minimal style với color từ `useAppColors()`.

**Prototype ref:** `camera-sheet.jsx`.

**Acceptance:**
- [ ] Tap red camera icon opens sheet from bottom
- [ ] "Chụp ảnh" opens native camera, returns URI → navigate MomentCreate
- [ ] "Chọn thư viện" multi-select returns up to 10 URIs → navigate MomentCreate
- [ ] "Photobooth" dimmed, sub "Sắp ra mắt 💝", tap no navigate
- [ ] Permission denied → Settings alert
- [ ] Sheet closes on swipe-down + backdrop tap
- [ ] iOS: touches work (FullWindowOverlay applied)
- [ ] Prototype 1:1

---

### T378 (P0 · 3pt) — Create moment (photos + description + date)

**Files:**
- `mobile-rework/app/(modal)/moment-create.tsx` (new modal route)
- `mobile-rework/src/screens/MomentCreate/MomentCreateScreen.tsx` (new)
- `mobile-rework/src/screens/MomentCreate/useMomentCreateViewModel.ts` (new)
- `mobile-rework/src/lib/uploadQueue.ts` (new — port pattern from web)

**Behavior (1-screen scroll, Boss Q4 chốt):**
1. Header: X close (left) · "Khoảnh khắc mới" (center) · "Lưu" button (right — disabled nếu `photos.length === 0`).
2. Photos section: 3-column grid of URIs. Each cell: square image + small X top-right (remove). Last cell "＋" opens picker again (add more, up to 10 total).
3. Description: multiline textarea, placeholder "Kể về khoảnh khắc này...", min 5 rows, max 10 rows auto-grow, maxLength 2000.
4. Date picker row: label "Ngày" + current date format Vi. Tap → `@react-native-community/datetimepicker`, iOS `display="spinner"`, maximumDate = now. Default = today.

**Submit flow (CRITICAL):**
1. Tap "Lưu" → disable button + close modal IMMEDIATELY (router.dismiss).
2. POST `/api/moments { description, takenAt }` → returns `moment.id`.
3. For each photo URI → enqueue `uploadQueue.enqueue({ endpoint: `/api/moments/${momentId}/photos`, file: uri, onProgress, retries: 2 })`.
4. Progress toast top of screen (global, persists across navigation).
5. All done → invalidate `moments` query → Dashboard + Moments tab auto-refresh.
6. Partial fail (1/N photo fails after retries) → toast "Ảnh X upload thất bại, thử lại sau" + moment still exists với N-1 photos.

**No `await` blocks UI** — user must be able to return to Dashboard immediately after tap Lưu.

**Prototype ref:** `add-moment.jsx`.

**Acceptance:**
- [ ] Opens from Camera BottomSheet với `initialPhotos` param
- [ ] Photo grid renders, remove + add more works
- [ ] Description auto-grow, maxLength enforced
- [ ] Date picker iOS spinner + Android calendar, no future dates
- [ ] Tap Lưu dismisses modal instantly
- [ ] POST moment returns id, then N uploads queued
- [ ] Progress toast shows across screens
- [ ] List refresh on all success
- [ ] Partial fail graceful
- [ ] `uploadQueue.ts` created + tested
- [ ] Prototype 1:1

---

### T379 (P0 · 2pt) — Moment detail with photo lightbox

**Files:**
- `mobile-rework/app/(modal)/moment-detail.tsx` (refactor stub)
- `mobile-rework/src/screens/MomentDetail/MomentDetailScreen.tsx` (new)
- `mobile-rework/src/screens/MomentDetail/useMomentDetailViewModel.ts` (new)

**Behavior:**
1. Header: back arrow left · "Khoảnh khắc" center · NO action menu (Edit/Delete = Sprint 63).
2. Photo gallery horizontal swipeable, 4:3 ratio, index badge "2 / 5" bottom-left.
3. Tap photo → lightbox overlay: pinch zoom, double-tap zoom, swipe down to dismiss. Suggest `react-native-awesome-gallery` OR `expo-image` + `react-native-reanimated-carousel` — Zu picks lighter lib.
4. Meta row: Vi formatted date + relative time ("3 giờ trước") in muted text.
5. Description: full body text, `font-body`, `text-ink`, line-height 1.5, NO truncate.
6. Bottom padding + `<TabBarSpacer />`.
7. Data: GET `/api/moments/:id`. Hook `useMomentDetail(id)`.
8. Loading: skeleton (photo gradient + 2 text lines). Error: centered "Không tải được khoảnh khắc" + retry button.
9. Navigation: from Dashboard T375 + Moments list T376 → `router.push('/moment-detail?id=<id>')`. Back → `router.back()`.

**Acceptance:**
- [ ] Navigate from Dashboard + Moments list OK
- [ ] Swipe gallery horizontal OK với index badge
- [ ] Tap → lightbox pinch/double-tap zoom + swipe dismiss
- [ ] Vi formatted date + relative time
- [ ] Description full text no truncate
- [ ] Loading skeleton + error retry
- [ ] TabBarSpacer clearance
- [ ] MVVM + NativeWind + prototype 1:1

---

## Workflow (board CLI from Sprint 62)

**Zu daily flow:**
```bash
board lane todo             # see tasks
board start T375            # todo → in_progress + branch note
# … code …
board commit T375           # checkpoint commit note (no lane move)
board done T375             # in_review + commit SHA
tm-send PO "DEV [HH:mm]: T375 ready for review, commit abc1234"
```

**Lu review flow:**
```bash
board show T375             # read card
# …inspect code…
board approve T375 --note "passed review + QA, moving to testing"   # in_review → testing
# OR
board reject  T375 --note "prototype mismatch at empty CTA spacing" # in_review → in_progress
```

**Definition of Done (Sprint 62):**
- [ ] Code on `sprint_62` branch, committed
- [ ] `npm run lint` clean (tsc --noEmit + expo lint)
- [ ] Manual device smoke on iPhone 15 Pro Max (the one that clipped T374)
- [ ] Prototype 1:1 verified screenshot vs implementation
- [ ] Lu approve on board → testing → done
- [ ] Boss approve on app-store.hungphu.work TestFlight build before merge main

---

## QA checklist (Lu owns, before Boss review)

1. `cd mobile-rework && npm run lint`
2. Build dev-client ad-hoc, install on iPhone 15 Pro Max via app-store.hungphu.work
3. Run E2E golden path:
   - Fresh install, login, pair, reach Dashboard
   - Dashboard should show empty state (polaroid stack)
   - Tap "Thêm khoảnh khắc" → Camera sheet → "Chụp ảnh" → pick camera → Create screen with photo
   - Add description "Test moment", change date → Lưu
   - Modal closes, toast progress, Dashboard flips to has-data card
   - Tap card → Detail, swipe gallery, tap photo → lightbox → dismiss → back
   - Moments tab → list shows 1 card
4. Edge cases:
   - Deny camera permission → Settings alert
   - Add 10 photos, mixed portrait/landscape
   - Kill app mid-upload → reopen, moment still exists with N-K photos
   - Empty description submit (should NOT be blocked — description optional per BE schema)
5. Photobooth row stays dimmed + "Sắp ra mắt"

---

## Deployment

Sprint 62 = mobile-rework only. No BE change. No web change. Deploy path:
1. Zu: `cd mobile-rework && ./deploy-appstore.sh all` (or wait for Lu to run after approval)
2. Build uploads to app-store.hungphu.work
3. Lu `notify_boss(urgency=high, URL, what's bundled)`
4. Boss test on device → APPROVE → Lu `git checkout main && git merge sprint_62 && git push`. No prod deploy needed (mobile build already on ad-hoc store).
