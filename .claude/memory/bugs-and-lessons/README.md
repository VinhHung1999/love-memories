# Bugs & Lessons Learned

## Resolved Bugs

_(Add bugs as they are fixed)_

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

### hover:opacity buttons invisible on mobile touch devices
- Cause: `opacity-0 group-hover:opacity-100` makes buttons (e.g., photo delete) permanently hidden on mobile since there's no hover event.
- Fix: use `md:opacity-0 md:group-hover:opacity-100` — buttons always visible on mobile, hover-reveal on desktop only.
- Key takeaway: never gate interactive elements behind hover-only CSS on touch targets. Use responsive prefixes (`md:`) to separate mobile (always visible) from desktop (hover-reveal).
