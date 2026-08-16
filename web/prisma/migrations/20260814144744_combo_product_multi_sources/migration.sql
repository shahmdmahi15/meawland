/*
  Warnings:

  - You are about to drop the column `productId` on the `ComboProduct` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `ComboProduct` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ComboProduct" DROP CONSTRAINT "ComboProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "ComboProduct" DROP CONSTRAINT "ComboProduct_variantId_fkey";

-- AlterTable
ALTER TABLE "ComboProduct" DROP COLUMN "productId",
DROP COLUMN "variantId";

-- CreateTable
CREATE TABLE "_ComboProductToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ComboProductToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ComboProductToVariant" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ComboProductToVariant_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ComboProductToProduct_B_index" ON "_ComboProductToProduct"("B");

-- CreateIndex
CREATE INDEX "_ComboProductToVariant_B_index" ON "_ComboProductToVariant"("B");

-- AddForeignKey
ALTER TABLE "_ComboProductToProduct" ADD CONSTRAINT "_ComboProductToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "ComboProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComboProductToProduct" ADD CONSTRAINT "_ComboProductToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComboProductToVariant" ADD CONSTRAINT "_ComboProductToVariant_A_fkey" FOREIGN KEY ("A") REFERENCES "ComboProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComboProductToVariant" ADD CONSTRAINT "_ComboProductToVariant_B_fkey" FOREIGN KEY ("B") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
