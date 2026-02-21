-- AlterTable
ALTER TABLE "cooking_session_items" ADD COLUMN     "price" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "ingredientPrices" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[];
