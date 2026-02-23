-- CreateTable
CREATE TABLE "moment_comments" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moment_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_reactions" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moment_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "moment_reactions_momentId_emoji_author_key" ON "moment_reactions"("momentId", "emoji", "author");

-- AddForeignKey
ALTER TABLE "moment_comments" ADD CONSTRAINT "moment_comments_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_reactions" ADD CONSTRAINT "moment_reactions_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
