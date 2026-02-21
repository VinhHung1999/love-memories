-- CreateTable
CREATE TABLE "cooking_sessions" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'selecting',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalTimeMs" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cooking_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooking_session_recipes" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "cooking_session_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooking_session_items" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ingredient" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" TIMESTAMP(3),

    CONSTRAINT "cooking_session_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooking_session_steps" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checkedBy" TEXT,
    "checkedAt" TIMESTAMP(3),

    CONSTRAINT "cooking_session_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooking_session_photos" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cooking_session_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cooking_session_recipes" ADD CONSTRAINT "cooking_session_recipes_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cooking_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_session_recipes" ADD CONSTRAINT "cooking_session_recipes_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_session_items" ADD CONSTRAINT "cooking_session_items_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cooking_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_session_steps" ADD CONSTRAINT "cooking_session_steps_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cooking_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_session_photos" ADD CONSTRAINT "cooking_session_photos_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "cooking_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
