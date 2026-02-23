-- AlterTable
ALTER TABLE "moment_comments" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "moment_comments" ADD CONSTRAINT "moment_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
