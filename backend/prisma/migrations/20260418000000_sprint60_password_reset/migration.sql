-- Sprint 60: Password reset support
-- Mirrors email_verifications: random-byte token + DB-tracked expiry + cascade on user delete.

CREATE TABLE IF NOT EXISTS "password_resets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_resets_token_key" ON "password_resets"("token");
CREATE INDEX IF NOT EXISTS "password_resets_userId_idx" ON "password_resets"("userId");

ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
