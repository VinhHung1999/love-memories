// T472 (Sprint 70) — Memory Map. Shared contract between Slice 2 (MapScreen
// + ViewModel + PinView) and Slice 3 (MomentPreviewCard) so the two dev:dev
// subagents can implement in parallel without disagreeing on prop shapes.
// LOCKED — do NOT diverge without re-syncing both slices.

// Pin payload returned by GET /api/map/moments?bounds=... — mirror of the
// BE shape in `backend/src/services/MapService.ts → getMomentsInBounds`.
// Compact by design: full Moment hydration happens on tap-to-open via the
// existing /api/moments/:id endpoint (re-used MomentDetail modal).
export type MapMomentPin = {
  id: string;
  kind: 'polaroid' | 'heart';
  latitude: number;
  longitude: number;
  title: string | null;
  date: string; // ISO 8601
  location: string | null;
  thumbnailUrl: string | null;
  hasAudio: boolean;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
};

// Bounding-box request shape. Mapbox `onCameraChanged` emits a viewport
// rectangle on every pan/zoom; the ViewModel debounces it and re-fetches.
export type MapBounds = {
  south: number; // lat min
  west: number; // lng min
  north: number; // lat max
  east: number; // lng max
};

// Locked props for the slide-up preview card. Slice 2 owns the parent that
// renders it with `moment = selectedPin`; Slice 3 owns the card internals.
// Both must import this exact interface — no parallel definitions.
export interface MomentPreviewCardProps {
  moment: MapMomentPin | null; // null → card hidden (slide-down state)
  onOpenFull: () => void; // tap card body / 'Open' CTA → MomentDetail modal
  onClose: () => void; // tap X / map outside
}
