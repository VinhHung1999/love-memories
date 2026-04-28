-- Sprint 68 T471: per-user accent color picked on Personalize.
-- Replaces the Sprint 60 couple-level color (couples.color) which still
-- exists for legacy/web Dashboard compatibility but is no longer written
-- by the new onboarding flow. Stored as a token key string
-- ('primary'|'accent'|'secondary'|'primaryDeep') matching mobile-rework
-- SWATCH_FROM. Nullable so users who haven't picked yet stay unchanged.
ALTER TABLE "users" ADD COLUMN "color" TEXT;
