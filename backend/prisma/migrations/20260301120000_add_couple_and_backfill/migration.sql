-- Sprint 31: Multi-Tenant coupleId (single atomic migration)
-- 1. Create couples table
-- 2. Add nullable coupleId to 15 models
-- 3. Backfill: create default couple + assign all existing data
-- 4. Make coupleId NOT NULL

-- Step 1: Create couples table
CREATE TABLE "couples" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "couples_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add coupleId (nullable) to all 15 models
ALTER TABLE "users" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "moments" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "food_spots" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "recipes" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "cooking_sessions" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "sprints" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "goals" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "date_plans" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "date_wishes" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "expenses" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "love_letters" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "custom_achievements" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "tags" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "app_settings" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "achievements" ADD COLUMN "coupleId" TEXT;

-- Step 3: Backfill — create couple + assign all existing rows
DO $$
DECLARE
  couple_id TEXT;
BEGIN
  couple_id := gen_random_uuid()::TEXT;
  INSERT INTO "couples" ("id", "name", "createdAt") VALUES (couple_id, 'Hung & Nhu', NOW());

  UPDATE "users" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
  UPDATE "moments" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
  UPDATE "food_spots" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
  UPDATE "recipes" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
  UPDATE "cooking_sessions" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
  UPDATE "sprints" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
  UPDATE "goals" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
  UPDATE "date_plans" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
  UPDATE "date_wishes" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
  UPDATE "expenses" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
  UPDATE "love_letters" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
  UPDATE "custom_achievements" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
  UPDATE "tags" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
  UPDATE "app_settings" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
  UPDATE "achievements" SET "coupleId" = couple_id WHERE "coupleId" IS NULL;
END $$;

-- Step 4: Make coupleId NOT NULL
ALTER TABLE "users" ALTER COLUMN "coupleId" SET NOT NULL;
ALTER TABLE "moments" ALTER COLUMN "coupleId" SET NOT NULL;
ALTER TABLE "food_spots" ALTER COLUMN "coupleId" SET NOT NULL;
ALTER TABLE "recipes" ALTER COLUMN "coupleId" SET NOT NULL;
ALTER TABLE "cooking_sessions" ALTER COLUMN "coupleId" SET NOT NULL;
ALTER TABLE "sprints" ALTER COLUMN "coupleId" SET NOT NULL;
ALTER TABLE "goals" ALTER COLUMN "coupleId" SET NOT NULL;
ALTER TABLE "date_plans" ALTER COLUMN "coupleId" SET NOT NULL;
ALTER TABLE "date_wishes" ALTER COLUMN "coupleId" SET NOT NULL;
ALTER TABLE "expenses" ALTER COLUMN "coupleId" SET NOT NULL;
ALTER TABLE "love_letters" ALTER COLUMN "coupleId" SET NOT NULL;
ALTER TABLE "custom_achievements" ALTER COLUMN "coupleId" SET NOT NULL;
ALTER TABLE "tags" ALTER COLUMN "coupleId" SET NOT NULL;
ALTER TABLE "app_settings" ALTER COLUMN "coupleId" SET NOT NULL;
ALTER TABLE "achievements" ALTER COLUMN "coupleId" SET NOT NULL;

-- Step 5: Drop old single-column unique constraints
DROP INDEX IF EXISTS "tags_name_key";
DROP INDEX IF EXISTS "achievements_key_key";
DROP INDEX IF EXISTS "app_settings_key_key";

-- Step 6: Create compound unique indexes
CREATE UNIQUE INDEX "tags_name_coupleId_key" ON "tags"("name", "coupleId");
CREATE UNIQUE INDEX "achievements_key_coupleId_key" ON "achievements"("key", "coupleId");
CREATE UNIQUE INDEX "app_settings_key_coupleId_key" ON "app_settings"("key", "coupleId");

-- Step 7: Create coupleId indexes for performance
CREATE INDEX "users_coupleId_idx" ON "users"("coupleId");
CREATE INDEX "moments_coupleId_idx" ON "moments"("coupleId");
CREATE INDEX "food_spots_coupleId_idx" ON "food_spots"("coupleId");
CREATE INDEX "recipes_coupleId_idx" ON "recipes"("coupleId");
CREATE INDEX "cooking_sessions_coupleId_idx" ON "cooking_sessions"("coupleId");
CREATE INDEX "sprints_coupleId_idx" ON "sprints"("coupleId");
CREATE INDEX "goals_coupleId_idx" ON "goals"("coupleId");
CREATE INDEX "date_plans_coupleId_idx" ON "date_plans"("coupleId");
CREATE INDEX "date_wishes_coupleId_idx" ON "date_wishes"("coupleId");
CREATE INDEX "expenses_coupleId_idx" ON "expenses"("coupleId");
CREATE INDEX "love_letters_coupleId_idx" ON "love_letters"("coupleId");
CREATE INDEX "custom_achievements_coupleId_idx" ON "custom_achievements"("coupleId");
CREATE INDEX "tags_coupleId_idx" ON "tags"("coupleId");
CREATE INDEX "app_settings_coupleId_idx" ON "app_settings"("coupleId");
CREATE INDEX "achievements_coupleId_idx" ON "achievements"("coupleId");

-- Step 8: Add foreign key constraints
ALTER TABLE "users" ADD CONSTRAINT "users_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "moments" ADD CONSTRAINT "moments_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_spots" ADD CONSTRAINT "food_spots_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cooking_sessions" ADD CONSTRAINT "cooking_sessions_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "goals" ADD CONSTRAINT "goals_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "date_plans" ADD CONSTRAINT "date_plans_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "date_wishes" ADD CONSTRAINT "date_wishes_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "love_letters" ADD CONSTRAINT "love_letters_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "custom_achievements" ADD CONSTRAINT "custom_achievements_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tags" ADD CONSTRAINT "tags_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
