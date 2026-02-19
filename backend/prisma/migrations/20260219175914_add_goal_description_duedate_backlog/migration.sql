-- AlterTable
ALTER TABLE "goals" ADD COLUMN     "description" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ALTER COLUMN "sprintId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sprints" ADD COLUMN     "description" TEXT;
