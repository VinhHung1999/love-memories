-- CreateTable
CREATE TABLE "daily_questions" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "textVi" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_question_responses" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_question_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_question_responses_questionId_coupleId_userId_key" ON "daily_question_responses"("questionId", "coupleId", "userId");

-- CreateIndex
CREATE INDEX "daily_question_responses_coupleId_idx" ON "daily_question_responses"("coupleId");

-- AddForeignKey
ALTER TABLE "daily_question_responses" ADD CONSTRAINT "daily_question_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "daily_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
