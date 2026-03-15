-- AlterTable: make users.coupleId nullable to support register without couple
ALTER TABLE "users" ALTER COLUMN "coupleId" DROP NOT NULL;
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_coupleId_fkey";
ALTER TABLE "users" ADD CONSTRAINT "users_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
