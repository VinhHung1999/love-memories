# Sprint 36 — RN: Moments

**Goal:** Implement Moments module in React Native mobile app — list, create, detail, photos, voice memo, comments, reactions.

**Backend:** NO changes — all API endpoints already exist.

---

## Screens

### 1. Moments List (`MomentsScreen`)

- Show all moments sorted by date DESC
- Each card: cover photo (first photo or placeholder), title, date, location, tag chips
- Tag filter bar at top (horizontal scroll, "All" + unique tags from data)
- Pull-to-refresh
- FAB button to create new moment
- Empty state with illustration + CTA
- Tap card → navigate to MomentDetail

### 2. Moment Detail (`MomentDetailScreen`)

- Hero photo (full width, first image) — tap to open gallery
- Photo thumbnails strip (horizontal scroll)
- Title, caption, date, location
- Tag chips
- Spotify link (open in Spotify app or browser — NO embed)
- Google Maps link if coordinates exist
- **Voice Memos section:** play/pause, duration display, record new, delete
- **Reactions section:** 8 preset emojis (❤️ 😂 😍 🥺 🔥 👏 😢 🎉), tap to toggle, show counts
- **Comments section:** list with avatar + author + content + time, input to add new, swipe-to-delete own comments
- Edit button → opens Create/Edit screen pre-filled
- Delete button with confirmation alert

### 3. Create/Edit Moment (`CreateMomentScreen`)

- Form fields:
  - Title (required, max 200)
  - Caption (multiline, optional)
  - Date picker (defaults to today)
  - Location (text input + optional map picker)
  - Tags (chip input — type + add)
  - Spotify URL (optional, validated)
- Photo section: pick from gallery (multi-select, up to 10), camera capture, reorder, delete
- Audio section: record voice memo, play preview, delete
- Save button → create/update API call
- Photos/audio uploaded in background (NOT blocking UI)

### 4. Photo Gallery (`PhotoGalleryScreen` or modal)

- Full-screen image viewer
- Swipe left/right to navigate
- Pinch-to-zoom
- Page indicator (1/N)
- Close gesture (swipe down) or X button

---

## Navigation

Add to `MainTabParamList` or create a Moments stack:

```
MomentsList (tab or stack screen)
  → MomentDetail (params: { momentId: string })
  → CreateMoment (params: { momentId?: string } — undefined = create, string = edit)
  → PhotoGallery (params: { photos: Photo[], initialIndex: number })
```

Add Moments tab to bottom tab navigator (icon: `heart-multiple-outline` or similar).

---

## API Integration

Use existing endpoints — add to `mobile/src/lib/api.ts`:

```typescript
momentsApi = {
  list: () => apiFetch('/moments'),
  get: (id) => apiFetch(`/moments/${id}`),
  create: (data) => apiFetch('/moments', { method: 'POST', body: data }),
  update: (id, data) => apiFetch(`/moments/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiFetch(`/moments/${id}`, { method: 'DELETE' }),
  uploadPhotos: (id, formData) => apiFetch(`/moments/${id}/photos`, { method: 'POST', body: formData }),
  deletePhoto: (momentId, photoId) => apiFetch(`/moments/${momentId}/photos/${photoId}`, { method: 'DELETE' }),
  uploadAudio: (id, formData) => apiFetch(`/moments/${id}/audio`, { method: 'POST', body: formData }),
  deleteAudio: (momentId, audioId) => apiFetch(`/moments/${momentId}/audio/${audioId}`, { method: 'DELETE' }),
  addComment: (momentId, data) => apiFetch(`/moments/${momentId}/comments`, { method: 'POST', body: data }),
  deleteComment: (momentId, commentId) => apiFetch(`/moments/${momentId}/comments/${commentId}`, { method: 'DELETE' }),
  toggleReaction: (momentId, data) => apiFetch(`/moments/${momentId}/reactions`, { method: 'POST', body: data }),
}
```

---

## MVVM Structure

```
src/screens/
  Moments/
    MomentsScreen.tsx
    useMomentsViewModel.ts
  MomentDetail/
    MomentDetailScreen.tsx
    useMomentDetailViewModel.ts
    components/
      PhotoSection.tsx
      VoiceMemoSection.tsx
      ReactionsBar.tsx
      CommentsSection.tsx
  CreateMoment/
    CreateMomentScreen.tsx
    useCreateMomentViewModel.ts
    components/
      PhotoPicker.tsx
      AudioRecorder.tsx
      TagInput.tsx
      LocationInput.tsx
```

---

## Reusable Components Needed

- **PhotoPicker** — multi-select from gallery + camera capture
- **AudioRecorder** — record, play preview, show duration
- **AudioPlayer** — play/pause button + progress + duration
- **TagInput** — chip-style tag entry
- **EmojiReactionBar** — 8 emojis with toggle + count
- **PhotoGallery** — full-screen swipe viewer with pinch-zoom

---

## Design Rules

- **Use `frontend-design` skill** for all UI work — Boss requirement
- **Mobile UI is independent from web** — design native-first, don't copy web PWA layout
- Follow existing patterns: NativeWind className only, useAppColors(), i18n strings in en.ts
- Bottom sheets via @gorhom/bottom-sheet for modals
- Haptic feedback on interactions
- Smooth animations (spring for press, fade for transitions)

---

## Acceptance Criteria

- [ ] Moments list loads and displays all moments with photos
- [ ] Tag filtering works
- [ ] Pull-to-refresh works
- [ ] Create moment with title, caption, date, location, tags, spotify URL
- [ ] Upload photos (multi-select, background upload)
- [ ] Record and upload voice memo
- [ ] View moment detail with all data
- [ ] Photo gallery with swipe + pinch-zoom
- [ ] Play voice memos
- [ ] Add/toggle emoji reactions (8 presets)
- [ ] Add comments with current user name
- [ ] Delete own comments
- [ ] Edit existing moment
- [ ] Delete moment with confirmation
- [ ] All strings in en.ts locale file
- [ ] MVVM pattern followed (Screen + ViewModel per screen)
- [ ] NativeWind only (no style prop)
- [ ] Tests pass, lint clean, builds successfully

---

## Dependencies to Install (if needed)

- `react-native-image-picker` (already installed)
- `react-native-audio-recorder-player` or `expo-av` for audio recording/playback
- `react-native-image-zoom-viewer` or similar for pinch-zoom gallery
- Check what's available before adding new deps
