-- CreateTable
CREATE TABLE "date_plan_spots" (
    "id" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "url" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_plan_spots_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "date_plan_spots" ADD CONSTRAINT "date_plan_spots_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "date_plan_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
