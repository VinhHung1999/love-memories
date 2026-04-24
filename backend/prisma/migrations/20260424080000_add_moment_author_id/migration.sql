-- Sprint 64 T387: Moment author 'by' pill.
-- Adds moments.authorId (FK → users.id) so clients can render a "by Partner" tag on each moment.
-- 4-step migration: add nullable → backfill → sanity check → NOT NULL + FK + index.
-- Backfill rule: use the earliest-joined user of the couple (ORDER BY "createdAt" ASC LIMIT 1).
-- Prod (port 5433) runs the same 4 steps manually via psql — do NOT `prisma migrate deploy` prod.

-- Step 1: add nullable column so existing rows keep working during backfill.
ALTER TABLE "moments" ADD COLUMN "authorId" TEXT;

-- Step 2: backfill each moment with the earliest-joined user of that couple.
UPDATE "moments" m
SET "authorId" = (
  SELECT u."id"
  FROM "users" u
  WHERE u."coupleId" = m."coupleId"
  ORDER BY u."createdAt" ASC
  LIMIT 1
)
WHERE "authorId" IS NULL;

-- Step 3: sanity check — abort the migration if any moment is still unassigned
-- (e.g. orphan couple with 0 users). Safer to fail loudly than silently flip NOT NULL.
DO $$
DECLARE
  null_count INT;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "moments" WHERE "authorId" IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % moments still have NULL authorId', null_count;
  END IF;
END $$;

-- Step 4: lock in NOT NULL + FK RESTRICT (users cannot be deleted while they own moments — compliance) + index.
ALTER TABLE "moments" ALTER COLUMN "authorId" SET NOT NULL;

ALTER TABLE "moments"
  ADD CONSTRAINT "moments_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "moments_authorId_idx" ON "moments"("authorId");
