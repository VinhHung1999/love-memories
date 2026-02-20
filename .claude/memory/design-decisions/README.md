# Design Decisions

Key UI/UX decisions made during development. Read this before changing visual elements.

## Color & Theme

_(Record palette choices, theme decisions, and their evolution)_

## Animation Philosophy

_(Record animation approach: timing, easing, accessibility considerations)_

## Layout Decisions

_(Record layout patterns, responsive strategy, component structure)_

## Typography

_(Record font choices, sizing scale, readability decisions)_

## Edit Modal Pattern (Sprint 4)

- `MomentEditModal` and `FoodSpotEditModal` follow a consistent pattern: all fields editable inline including `LocationPicker`, tag input, and `RatingStars`.
- Modals reuse the shared `Modal` component (bottom-sheet on mobile, centered on desktop) and open from the detail page via an "Edit" button.
- "Add Photos" upload button is placed directly on detail pages (not inside the edit modal) to keep photo management separate from field editing.

## Gallery Overlay Approach (Sprint 4)

- Fullscreen photo gallery uses a CSS opacity toggle (not conditional rendering) so the overlay is always in the DOM and refs remain valid.
- On mobile the gallery slides over everything at `z-[70]`; background content is visually hidden but not unmounted.
- Swipe-to-navigate and pinch-to-zoom are implemented with native touch events rather than a third-party carousel library to minimise bundle size.

## Mapbox GeolocateControl (Sprint 4)

- Added Mapbox's built-in `GeolocateControl` to `MapPage` for current-location centering.
- No custom geolocation implementation — `GeolocateControl` handles permission prompts, accuracy circles, and iOS/Android quirks out of the box.
- Positioned `bottom-right` so it does not overlap the bottom nav on mobile.
