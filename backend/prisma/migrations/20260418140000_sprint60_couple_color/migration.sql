-- Sprint 60 T286: store the couple's accent palette swatch (Personalize step).
-- Currently the swatch index "0"–"3" is written; later may be a hex string.
-- Nullable so old couples and "no choice" stay unchanged.
ALTER TABLE "couples" ADD COLUMN "color" TEXT;
