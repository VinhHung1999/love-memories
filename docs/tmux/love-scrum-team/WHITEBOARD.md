# Team Whiteboard

**Sprint:** 9
**Goal:** Dashboard Timer + Voice Recording + Map Tag Filter

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | Active | Assigning tasks | 2026-02-21 |
| DEV  | Pending | Awaiting tasks | 2026-02-21 |

---

## Sprint Backlog

### Feature 1: Dashboard Timer (frontend only)
- Widget trên Dashboard hiển thị "Ngày quen nhau"
- Config ngày bắt đầu (lưu localStorage, có nút edit)
- Hiển thị: X năm Y tháng Z ngày (hoặc tổng ngày)
- UI: card đẹp với icon Heart, animation nhẹ
- Vị trí: đầu Dashboard, trước stats grid

### Feature 2: Voice Recording (fullstack)
- Record âm thanh trong Moment detail page
- MediaRecorder API → upload audio file lên CDN
- Backend: thêm MomentAudio model (id, momentId, filename, url, duration, createdAt)
- API: POST /moments/:id/audio (upload), DELETE /moments/:id/audio/:audioId
- Upload middleware: chấp nhận audio/webm, audio/mp4, audio/mpeg (max 10MB)
- Frontend: nút Record (mic icon), playback với audio player
- Hiển thị list audio clips trong Moment detail

### Feature 3: Map Tag Filter (frontend only)
- Filter markers theo tags trên MapPage
- Backend đã trả tags[] trong /api/map/pins — không cần thay đổi backend
- Frontend: extract unique tags từ pins, hiển thị chip filter
- Cho phép chọn nhiều tags (multi-select)
- Combine với filter type hiện tại (All/Moments/Food)

---

## Task Order: 1 → 3 → 2

Branch: `feature_sprint9`

## Quy trình
1. Dev trên branch `feature_sprint9`
2. Xong → Boss review trên dev-love-scrum.hungphu.work
3. Boss approve → merge main → deploy production

---

## Backlog (Sprint 10+)

| # | Feature | Notes |
|---|---------|-------|
| 1 | Spotify integration | OAuth + Web Playback SDK hoặc chỉ link bài hát |
| 2 | Map custom icon per tag | Icon picker per tag, user-editable |

---

## Notes

_Sprint 7 — PicaPica Booth: APPROVED & MERGED (2026-02-20)_
_Sprint 8 — Bug Fix + Sticker Upgrade: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 9 — Started 2026-02-21_
