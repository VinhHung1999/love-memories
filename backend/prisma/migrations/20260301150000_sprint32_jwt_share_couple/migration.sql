-- Sprint 32: JWT Auth Upgrade + Shared Links + Couple Profile

-- 1. Add new columns to couples
ALTER TABLE "couples" ADD COLUMN "anniversaryDate" TIMESTAMP(3);
ALTER TABLE "couples" ADD COLUMN "inviteCode" TEXT;
CREATE UNIQUE INDEX "couples_inviteCode_key" ON "couples"("inviteCode");

-- 2. Backfill anniversaryDate from app_settings relationship-start-date
UPDATE "couples" c SET "anniversaryDate" = (s."value")::timestamp
FROM "app_settings" s
WHERE s."coupleId" = c."id" AND s."key" = 'relationship-start-date'
  AND s."value" IS NOT NULL AND s."value" != '';

-- 3. Create refresh_tokens table
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Create share_links table
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "share_links_token_key" ON "share_links"("token");
CREATE INDEX "share_links_coupleId_idx" ON "share_links"("coupleId");
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_coupleId_fkey"
  FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
