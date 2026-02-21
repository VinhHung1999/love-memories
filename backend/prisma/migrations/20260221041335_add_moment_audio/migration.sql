-- CreateTable
CREATE TABLE "moment_audios" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "duration" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moment_audios_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "moment_audios" ADD CONSTRAINT "moment_audios_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
