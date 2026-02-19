-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "GoalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "moments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_photos" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moment_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_spots" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location" TEXT,
    "tags" TEXT[],
    "priceRange" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_spots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_spot_photos" (
    "id" TEXT NOT NULL,
    "foodSpotId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "food_spot_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'TODO',
    "priority" "GoalPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignee" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "sprintId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "moment_photos" ADD CONSTRAINT "moment_photos_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_spot_photos" ADD CONSTRAINT "food_spot_photos_foodSpotId_fkey" FOREIGN KEY ("foodSpotId") REFERENCES "food_spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
