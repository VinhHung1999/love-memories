# Team Whiteboard

**Sprint:** 30
**Goal:** Love Letters — Photos & Voice Memo

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | ACTIVE | Sprint 30 impl done, awaiting PO review | 2026-02-27 |
| DEV  | DONE | Sprint 30 all 4 tasks complete | 2026-02-27 |

---

## Sprint 30 Spec

### Task 1: Backend — LetterPhoto + LetterAudio Models & Endpoints

**What:** Add optional photo (max 5) and voice memo (max 30s) support to Love Letters, following the Moments media pattern.

#### 1A. Prisma Schema Changes

**New models (mirroring MomentPhoto/MomentAudio):**

```prisma
model LetterPhoto {
  id        String     @id @default(uuid())
  letterId  String
  filename  String
  url       String
  createdAt DateTime   @default(now())
  letter    LoveLetter @relation(fields: [letterId], references: [id], onDelete: Cascade)

  @@map("letter_photos")
}

model LetterAudio {
  id        String     @id @default(uuid())
  letterId  String
  filename  String
  url       String
  duration  Float?
  createdAt DateTime   @default(now())
  letter    LoveLetter @relation(fields: [letterId], references: [id], onDelete: Cascade)

  @@map("letter_audio")
}
```

**Update LoveLetter model:**
```prisma
model LoveLetter {
  // ... existing fields ...
  photos    LetterPhoto[]
  audio     LetterAudio[]
}
```

Run `npx prisma migrate dev --name add_letter_media`.

#### 1B. New API Endpoints

Add to `backend/src/routes/loveLetters.ts`:

| Method | Path | Purpose | Notes |
|--------|------|---------|-------|
| POST | /api/love-letters/:id/photos | Upload photos (max 5) | Multer, images only, 10MB limit. Only sender can upload. Only DRAFT/SCHEDULED status. |
| DELETE | /api/love-letters/:id/photos/:photoId | Delete a photo | Only sender, only DRAFT/SCHEDULED |
| POST | /api/love-letters/:id/audio | Upload voice memo (1 only) | Multer, audio types, 10MB limit. Only sender, only DRAFT/SCHEDULED. |
| DELETE | /api/love-letters/:id/audio/:audioId | Delete voice memo | Only sender, only DRAFT/SCHEDULED |

**Upload logic:** Follow Moments pattern — use existing `uploadToCdn()` / `deleteFromCdn()` from upload middleware. UUID filenames.

**Include media in all GET responses:** Update all letter queries to include `photos` and `audio` relations:
```ts
include: { sender: { select: ... }, recipient: { select: ... }, photos: true, audio: true }
```

**Validation:**
- Photos: max 5 per letter. If uploading would exceed 5, reject with 400.
- Audio: max 1 per letter. If audio already exists, reject with 400.
- Only sender can add/remove media.
- Only DRAFT or SCHEDULED letters can have media added/removed.

#### 1C. Acceptance Criteria

- [ ] Migration runs cleanly
- [ ] Photo upload/delete works (max 5)
- [ ] Audio upload/delete works (max 1, with duration)
- [ ] Media included in all GET responses (received, sent, get by id)
- [ ] Only sender can manage media, only on unsent letters
- [ ] Cascade delete: deleting letter removes its media
- [ ] Existing tests still pass + new tests for media endpoints

---

### Task 2: Frontend — Compose with Photos & Voice Memo

**What:** Update ComposeLetterModal to allow attaching optional photos and voice memo.

#### 2A. Update Types

**File:** `frontend/src/types/index.ts`

```ts
export interface LetterPhoto {
  id: string;
  letterId: string;
  filename: string;
  url: string;
  createdAt: string;
}

export interface LetterAudio {
  id: string;
  letterId: string;
  filename: string;
  url: string;
  duration: number | null;
  createdAt: string;
}

export interface LoveLetter {
  // ... existing fields ...
  photos?: LetterPhoto[];
  audio?: LetterAudio[];
}
```

#### 2B. Update API Client

**File:** `frontend/src/lib/api.ts`

Add to `loveLettersApi`:
```ts
uploadPhotos: (id: string, files: File[], onProgress?) => uploadWithProgress(...)
deletePhoto: (letterId: string, photoId: string) => request(DELETE)
uploadAudio: (id: string, file: File, duration?: number, onProgress?) => uploadWithProgress(...)
deleteAudio: (letterId: string, audioId: string) => request(DELETE)
```

Follow the exact same pattern as `momentsApi.uploadPhotos` / `momentsApi.uploadAudio`.

#### 2C. Update ComposeLetterModal

**File:** `frontend/src/pages/LoveLettersPage.tsx` (ComposeLetterModal section)

**Flow:** User creates letter as DRAFT first (if not editing existing), then can add photos/audio to the saved draft before sending.

**Add below content textarea, above mood picker:**

1. **Photo section:**
   - Label: "📷 Ảnh đính kèm (tùy chọn)"
   - Show attached photo thumbnails in a horizontal scroll row
   - "Thêm ảnh" button (disabled if 5 photos already)
   - Each thumbnail has X button to delete
   - `<input type="file" accept="image/*" multiple>` — cap selection to (5 - existing)
   - Use `uploadQueue.enqueue()` for upload progress (follow existing pattern)

2. **Voice memo section:**
   - Label: "🎤 Voice memo (tùy chọn, tối đa 30 giây)"
   - If no audio: show "Ghi âm" button
   - Recording UI: red pulsing dot + elapsed time + "Dừng" button
   - Auto-stop at 30 seconds
   - After recording: show audio player (play/pause, duration) + "Xóa" button
   - Use `navigator.mediaDevices.getUserMedia({ audio: true })` + MediaRecorder
   - Upload as WebM/audio format
   - If audio already exists: show player + "Xóa" option

**Important UX notes:**
- Photos/audio sections only appear AFTER the letter is saved as draft (need letter ID for upload)
- If creating new letter: "Lưu nháp" first, then media sections appear
- If editing existing draft: media sections available immediately
- All inputs fontSize: 16px (iOS zoom prevention)

#### 2D. Acceptance Criteria

- [ ] Can attach up to 5 photos to a draft letter
- [ ] Can record and attach voice memo (max 30s, auto-stop)
- [ ] Can delete individual photos and voice memo
- [ ] Photo thumbnails display correctly
- [ ] Audio player works (play/pause)
- [ ] Media sections only available after letter has an ID (saved draft)
- [ ] Build + lint pass

---

### Task 3: Frontend — Display Media in LetterReadOverlay

**What:** Show photos and voice memo when reading a love letter.

#### 3A. Update LetterReadOverlay

**File:** `frontend/src/components/LetterReadOverlay.tsx`

**Display location:** After the letter content text, before the ornamental divider (✦ ✦ ✦).

1. **Photos:** If `letter.photos?.length > 0`:
   - Horizontal scrollable row of photos (rounded corners, shadow)
   - Tap on photo → full-screen lightbox view (fixed z-[80], tap to dismiss)
   - Photo sizes: ~160px height, auto width, rounded-xl

2. **Voice memo:** If `letter.audio?.length > 0`:
   - Compact audio player bar below photos
   - Play/pause button + waveform-style progress bar + duration text
   - Styled to match the letter's romantic aesthetic (soft colors, rounded)

**All media displayed inline with the letter — cùng lúc mở thư (Boss's preference).**

#### 3B. Also update Letter detail view in LoveLettersPage

When viewing a sent letter (sender's view), also display attached photos/audio in the letter card or detail view.

#### 3C. Acceptance Criteria

- [ ] Photos display in horizontal scroll when reading letter
- [ ] Tap photo opens full-screen lightbox
- [ ] Voice memo player works in read overlay
- [ ] Media displays for both sender and recipient views
- [ ] No layout breakage when no media attached
- [ ] Animations still work smoothly with media

---

### Task 4: Driver.js Tour Update

- Update love-letters tour to mention photo/voice memo feature in compose step
- Acceptance: tour works, build passes

---

## Sprint 30 Backlog

| # | Task | Priority | Status | Assignee |
|---|------|----------|--------|----------|
| 1 | Backend: LetterPhoto + LetterAudio | P0 | DONE | DEV |
| 2 | Frontend: Compose with Photos & Memo | P0 | DONE | DEV |
| 3 | Frontend: Display Media in ReadOverlay | P0 | DONE | DEV |
| 4 | Driver.js Tour Update | P2 | DONE | DEV |

---

## Previous Sprints

_Sprint 7–28: See git history_
_Sprint 29 — Dashboard Bento Grid Refactor: DEPLOYED_
_Sprint 30 — Love Letters Photos & Voice Memo: PENDING REVIEW_

---

## Process Reminder

**Production deployment requires Boss approval:**
1. DEV implements → PO reviews on sprint branch
2. PO deploys to dev environment for Boss review
3. Boss approves → merge to main → production
