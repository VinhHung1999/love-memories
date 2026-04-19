-- Add onboardingComplete flag so re-login restores wizard-completion state
-- (T301 — server-side source of truth replaces client-only AsyncStorage flag)
ALTER TABLE "users" ADD COLUMN "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: any user already paired (coupleId IS NOT NULL) finished the wizard
UPDATE "users" SET "onboardingComplete" = true WHERE "coupleId" IS NOT NULL;
