-- AlterTable
ALTER TABLE "cooking_session_steps" ADD COLUMN     "durationSeconds" INTEGER;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "stepDurations" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
