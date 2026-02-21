/*
  Warnings:

  - You are about to drop the column `checkedIngredients` on the `recipes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "checkedIngredients",
ADD COLUMN     "cooked" BOOLEAN NOT NULL DEFAULT false;
