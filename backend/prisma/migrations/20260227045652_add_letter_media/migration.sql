-- CreateTable
CREATE TABLE "letter_photos" (
    "id" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "letter_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter_audio" (
    "id" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "duration" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "letter_audio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "letter_photos" ADD CONSTRAINT "letter_photos_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "love_letters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_audio" ADD CONSTRAINT "letter_audio_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "love_letters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
