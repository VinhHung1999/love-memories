-- AlterTable
ALTER TABLE "cooking_sessions" ADD COLUMN     "rating" INTEGER;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "datePlanId" TEXT,
ADD COLUMN     "foodSpotId" TEXT,
ADD COLUMN     "receiptUrl" TEXT;
