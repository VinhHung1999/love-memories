-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ingredients" TEXT[],
    "steps" TEXT[],
    "tags" TEXT[],
    "notes" TEXT,
    "foodSpotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_photos" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_foodSpotId_fkey" FOREIGN KEY ("foodSpotId") REFERENCES "food_spots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_photos" ADD CONSTRAINT "recipe_photos_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
