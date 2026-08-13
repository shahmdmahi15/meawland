/*
  Warnings:

  - Added the required column `image` to the `Variant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "image" TEXT NOT NULL;
