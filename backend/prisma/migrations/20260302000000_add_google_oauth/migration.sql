-- Sprint 33: Google OAuth
-- 1. Make password nullable (Google-only users have no password)
-- 2. Add googleId (unique, nullable)

ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "googleId" TEXT;
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId") WHERE "googleId" IS NOT NULL;
