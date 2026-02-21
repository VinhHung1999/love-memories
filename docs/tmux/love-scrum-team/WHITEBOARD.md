# Team Whiteboard

**Sprint:** 10
**Goal:** Dashboard UI Redesign — làm lại giao diện Dashboard đẹp hơn, cảm xúc hơn

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | Active | Writing spec, assigning DEV | 2026-02-21 |
| DEV  | Idle   | Awaiting assignment | 2026-02-21 |

---

## Sprint 10 Spec

### Task 1: Hero Section — Relationship Timer Redesign
**Priority:** P0

Nâng cấp Relationship Timer từ inline text thành hero visual section.

**Acceptance Criteria:**
- [ ] Timer hiển thị lớn, nổi bật (số năm/tháng/ngày dùng font heading, size lớn)
- [ ] Background gradient nhẹ hoặc subtle pattern (dùng theme colors)
- [ ] Layout: số lớn + label nhỏ bên dưới (kiểu "2 năm · 3 tháng · 15 ngày")
- [ ] Giữ nguyên chức năng edit ngày (click pencil)
- [ ] Responsive: đẹp trên cả mobile và desktop
- [ ] Không phá vỡ safe-area insets trên iOS PWA

### Task 2: Recent Moments — Card Redesign
**Priority:** P1

Cải thiện card design trong carousel.

**Acceptance Criteria:**
- [ ] Card có depth/shadow tốt hơn, rounded corners lớn hơn
- [ ] Overlay gradient mượt hơn, text dễ đọc hơn
- [ ] Thêm location hoặc tag nhỏ trên card (nếu có)
- [ ] Hover/touch effect mượt mà
- [ ] Giữ nguyên Swiper carousel behavior (1.15 mobile, 3 desktop)

### Task 3: Stats Section — Compact Redesign
**Priority:** P1

Gom stats lại cho gọn, ít chiếm diện tích hơn.

**Acceptance Criteria:**
- [ ] Chuyển từ grid 2x2 (mobile) sang horizontal scroll row hoặc inline compact cards
- [ ] Mỗi stat nhỏ gọn hơn: icon + số + label trên 1 dòng hoặc compact card
- [ ] Vẫn clickable, link đến trang tương ứng
- [ ] Không mất thông tin (vẫn hiển thị 4 stats)
- [ ] Responsive đẹp trên mobile và desktop

### Task 4: Active Sprint Card — Visual Upgrade
**Priority:** P2

Làm đẹp hơn phần Active Sprint trên dashboard.

**Acceptance Criteria:**
- [ ] Progress bar đẹp hơn (gradient hoặc animated)
- [ ] Goal status icons rõ ràng hơn (checkmark cho DONE, spinner cho IN_PROGRESS)
- [ ] Card nổi bật hơn so với background (border accent hoặc subtle gradient bg)
- [ ] Hiển thị sprint deadline/remaining days nếu có
- [ ] Giữ nguyên "View" link đến sprint detail

---

## Sprint Backlog

| # | Task | Priority | Status | Assignee |
|---|------|----------|--------|----------|
| 1 | Hero Section — Timer Redesign | P0 | TODO | DEV |
| 2 | Recent Moments — Card Redesign | P1 | TODO | DEV |
| 3 | Stats Section — Compact Redesign | P1 | TODO | DEV |
| 4 | Active Sprint — Visual Upgrade | P2 | TODO | DEV |

---

## Backlog (Sprint 11+)

| # | Feature | Notes |
|---|---------|-------|
| 1 | Spotify integration | OAuth + Web Playback SDK hoặc chỉ link bài hát |
| 2 | Map custom icon per tag | Icon picker per tag, user-editable |
| 3 | Comments & Reactions on Moments | Comment thread + emoji reactions trên từng moment |

---

## Notes

_Sprint 7 — PicaPica Booth: APPROVED & MERGED (2026-02-20)_
_Sprint 8 — Bug Fix + Sticker Upgrade: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 9 — Dashboard Timer + Voice Recording + Map Tag Filter + Swiper Carousel + FAB: APPROVED & DEPLOYED (2026-02-21)_

---

## Process Reminder

**Production deployment requires Boss approval:**
1. DEV implements → PO reviews on sprint branch
2. PO deploys to dev environment for Boss review
3. Boss approves → merge to main → production
