# Team Whiteboard

**Sprint:** 6 — "Photo Booth"
**Goal:** Golden feature — Photo Booth. Users select photos from moments, apply frames/filters/stickers, download result as PNG. Purely client-side (Canvas 2D), no backend changes.

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | Done | Sprint 6 APPROVED ✅ — Bug fixes reviewed & accepted | 2026-02-20 12:15 |
| DEV  | Done   | Bug fixes complete (CORS proxy + nav cleanup) | 2026-02-20 11:35 |

---

## Sprint Backlog

| # | Task | Priority | Status | Assignee |
|---|------|----------|--------|----------|
| 1 | Canvas utilities + Filter system | P0 | DONE ✅ | DEV |
| 2 | Frame template system (8 frames) | P0 | DONE ✅ | DEV |
| 3 | Sticker system (~20 stickers, 3 categories) | P0 | DONE ✅ | DEV |
| 4 | PhotoBooth page + all sub-components (5-step wizard) | P0 | DONE ✅ | DEV |
| 5 | App integration + tests + polish | P0 | DONE ✅ | DEV |

---

## Sprint Spec

### Context
Boss wants a "golden feature" — Photo Booth. Users select photos from their memories, apply frames, filters, and stickers, then download the result. Purely client-side (HTML Canvas), no backend changes needed.

---

### UI Flow (5 steps on 1 page)

```
Step 1: Choose Frame → Step 2: Select Photos → Step 3: Filters → Step 4: Stickers → Step 5: Preview & Download
```

User can go back/forward between steps. Live canvas preview visible from Step 3 onward.

---

### Files to Create (all in `frontend/src/`)

| File | Purpose |
|------|---------|
| `pages/PhotoBoothPage.tsx` | Main wizard page (5-step state machine) |
| `components/photobooth/FrameSelector.tsx` | Frame template grid |
| `components/photobooth/PhotoSelector.tsx` | Photo picker from moments |
| `components/photobooth/FilterSelector.tsx` | Horizontal scrollable filter strip |
| `components/photobooth/StickerPanel.tsx` | Sticker picker + drag-to-place on canvas |
| `components/photobooth/CanvasPreview.tsx` | Live canvas rendering + sticker overlay |
| `lib/photobooth/frames.ts` | 8 frame template definitions + canvas draw functions |
| `lib/photobooth/filters.ts` | 8 filter definitions (CSS preview + Canvas pixel manipulation) |
| `lib/photobooth/stickers.ts` | Sticker catalog (SVG/emoji-based, drawn on canvas) |
| `lib/photobooth/canvas-utils.ts` | Image loading (CORS), export/download, resize helpers |

### Files to Modify

| File | Change |
|------|--------|
| `App.tsx` | Add `<Route path="/photobooth" element={<PhotoBoothPage />} />` |
| `Layout.tsx` | Add nav item `{ to: '/photobooth', icon: Sparkles, label: 'Booth' }` |
| `Dashboard.tsx` | Add Photo Booth CTA button (gradient primary→secondary) in Quick Actions |

---

### Frame Templates (8)

All drawn with Canvas 2D API — no external image assets.

| Frame | Photos | Description |
|-------|--------|-------------|
| Polaroid | 1 | White border, thick bottom, optional text |
| Heart Border | 1 | Heart-shaped clip, pink bg, scattered hearts |
| Film Strip | 2-4 | Vertical strip with sprocket holes |
| Collage 2x2 | 4 | 2x2 grid, small heart at center |
| Vintage Round | 1 | Circular crop, ornamental ring border |
| Romantic Flowers | 1 | Watercolor flower/petal decorations (bezier curves) |
| Minimal Border | 1 | Thin elegant #E8788A border, "Love Scrum" watermark |
| Love Letter | 1-2 | Vintage postcard style, stamp-like photo placement |

Output resolution: 1080px wide for high-quality download.

---

### Filters (8)

Two-tier: CSS `filter` for fast thumbnail previews, Canvas `ImageData` manipulation for final render.

| Filter | CSS Preview |
|--------|-------------|
| Original | `none` |
| Grayscale | `grayscale(100%)` |
| Sepia | `sepia(80%)` |
| Warm | `sepia(20%) saturate(140%) brightness(105%)` |
| Cool | `hue-rotate(15deg) saturate(110%) brightness(105%)` |
| Rose | `sepia(15%) hue-rotate(-10deg) saturate(130%)` |
| Vintage | `sepia(30%) contrast(85%) brightness(110%) saturate(80%)` |
| Soft Glow | `brightness(110%) contrast(90%) saturate(110%)` |

---

### Stickers

StickerPanel shows a grid of stickers. User taps a sticker → it appears on the canvas preview → user can drag to reposition and resize.

**Categories:**
- **Love**: hearts, kiss mark, cupid arrow, ring, roses, double hearts
- **Fun**: stars, sparkles, crown, sunglasses, fire, party popper, sparkle cluster
- **Text**: "Yeu", "Love", "Forever", date stamp, location pin, "XOXO"

**Sticker state:**
```ts
interface PlacedSticker {
  id: string;
  stickerId: string;
  x: number; y: number;     // position (% of canvas)
  scale: number;             // resize factor
  rotation: number;          // degrees
}
```

**Interaction:** Tap to add, drag to move (touch+mouse), +/- buttons or scroll wheel to resize, trash to remove.

**Rendering:** Stickers drawn last (on top of frame + filtered photos) during final canvas export.

---

### Canvas CORS

Photo URLs from `/uploads/` or CDN need `crossOrigin = 'anonymous'` on `<img>`. DEV should verify this works — if CORS fails, proxy through Vite dev proxy.

---

### Task Breakdown

**Task 1: Canvas utilities + Filter system**
- `lib/photobooth/canvas-utils.ts` — `loadImage()` (CORS), `downloadCanvas()`, `drawImageCover()`, `fitDimensions()`, `roundRect()`, `createCanvas()`
- `lib/photobooth/filters.ts` — 8 filters with CSS preview strings + Canvas pixel manipulation functions
- Export `applyFilterToCanvas()` helper

**Task 2: Frame template system**
- `lib/photobooth/frames.ts` — 8 frame templates
- Each frame: `render(images, filter, stickers, options?)` returns canvas
- Each frame: `thumbnail(ctx, w, h)` for grid preview
- All decorations via Canvas 2D API (arcs, bezier curves, gradients — no external assets)

**Task 3: Sticker system**
- `lib/photobooth/stickers.ts` — ~20 stickers in 3 categories
- Each sticker: Canvas draw function
- State helpers: `createPlacedSticker()`, `drawStickerOnCanvas()`

**Task 4: PhotoBooth page + sub-components**
- `pages/PhotoBoothPage.tsx` — 5-step wizard with framer-motion transitions
- `components/photobooth/FrameSelector.tsx` — thumbnail grid
- `components/photobooth/PhotoSelector.tsx` — moment photos grid (uses existing momentsApi)
- `components/photobooth/FilterSelector.tsx` — horizontal scroll strip with CSS preview
- `components/photobooth/StickerPanel.tsx` — sticker grid + add handler
- `components/photobooth/CanvasPreview.tsx` — live preview + sticker drag overlay
- Download button → `canvas.toBlob()` → save as PNG

**Task 5: App integration + testing + polish**
- Modify `App.tsx` — add `/photobooth` route
- Modify `Layout.tsx` — add nav item (Sparkles icon, label "Booth")
- Modify `Dashboard.tsx` — add gradient CTA button in Quick Actions
- Write component tests
- `npm run build` + `npm run lint` pass
- Verify mobile bottom nav with 6 items fits
- Commit all changes

**Task order: 1 → 2 → 3 → 4 → 5** (1-3 can be parallelized, 4 depends on 1-3, 5 depends on 4)

---

### Acceptance Criteria

1. Navigate to `/photobooth` from both nav and Dashboard CTA
2. Select a frame → select photos from moments → apply filter → add stickers → preview correct
3. Download saves a high-quality PNG with frame + filter + stickers composited
4. Sticker drag to move works (touch + mouse)
5. `npm run build` and `npm run lint` pass clean
6. All existing tests still pass
7. Code committed

---

## Blockers

| Role | Blocker | Reported | Status |
|------|---------|----------|--------|
| | | | |

---

## Notes

- Purely frontend feature — no backend/DB changes needed
- All frame decorations drawn with Canvas 2D API (no external image assets)
- Use existing `momentsApi.list()` to fetch photos
- Use `framer-motion` for step transitions (already in deps)
- Use `lucide-react` Sparkles icon for nav
- Theme colors: primary #E8788A, secondary #F4A261, accent #7EC8B5
- Z-index: keep modal z-[60] hierarchy if any modals used
- React 19: useRef needs explicit initial value `useRef<T | null>(null)`
- Touch events: use `e.touches.item(0)` not `e.touches[0]` for TypeScript
- Array indexing: use `!` non-null assertion for `Uint8ClampedArray` in filter functions

---

## Clear After Sprint

After Sprint Review, clear this whiteboard for next Sprint.
Keep only the template structure.
