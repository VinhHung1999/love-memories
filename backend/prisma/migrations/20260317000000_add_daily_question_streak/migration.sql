-- CreateTable
CREATE TABLE "daily_question_streaks" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastAnsweredDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_question_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_question_streaks_coupleId_key" ON "daily_question_streaks"("coupleId");

-- AddForeignKey
ALTER TABLE "daily_question_streaks" ADD CONSTRAINT "daily_question_streaks_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "couples"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
