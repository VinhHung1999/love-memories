-- Sprint 66 T435: per-couple "vibe" chip per VN day.
-- Brand-new isolated table — no backfill, no impact on existing rows.
-- Apply on prod (port 5433) manually via psql; deploy CLI does NOT run
-- `prisma migrate deploy` (see rules/backend.md + memory).

CREATE TABLE "daily_vibes" (
  "id" TEXT NOT NULL,
  "coupleId" TEXT NOT NULL,
  "vibeKey" TEXT NOT NULL,
  "dayKey" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "daily_vibes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_vibes_coupleId_dayKey_key" ON "daily_vibes" ("coupleId", "dayKey");
CREATE INDEX "daily_vibes_coupleId_idx" ON "daily_vibes" ("coupleId");

ALTER TABLE "daily_vibes"
  ADD CONSTRAINT "daily_vibes_coupleId_fkey"
  FOREIGN KEY ("coupleId") REFERENCES "couples"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
