-- CreateTable
CREATE TABLE "date_wishes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "linkedMomentId" TEXT,
    "linkedFoodSpotId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "date_wishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_plans" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "date_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_plan_stops" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "order" INTEGER NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "wishId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_plan_stops_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "date_plan_stops" ADD CONSTRAINT "date_plan_stops_planId_fkey" FOREIGN KEY ("planId") REFERENCES "date_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
