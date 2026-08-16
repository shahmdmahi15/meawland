-- CreateEnum
CREATE TYPE "StockEventType" AS ENUM ('INITIAL', 'INCREASE', 'DECREASE', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "StockEvent" ADD COLUMN     "newStock" INTEGER DEFAULT 0,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "previousStock" INTEGER DEFAULT 0,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "type" "StockEventType" NOT NULL DEFAULT 'INITIAL';
