-- AlterTable
ALTER TABLE "date_wishes" ADD COLUMN     "address" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "url" TEXT;
