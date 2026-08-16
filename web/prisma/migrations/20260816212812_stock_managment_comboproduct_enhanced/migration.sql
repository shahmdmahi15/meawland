-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StockEventType" ADD VALUE 'PURCHASE';
ALTER TYPE "StockEventType" ADD VALUE 'RETURN';
ALTER TYPE "StockEventType" ADD VALUE 'RESTOCK';
ALTER TYPE "StockEventType" ADD VALUE 'DAMAGE';
ALTER TYPE "StockEventType" ADD VALUE 'EXPIRED';
ALTER TYPE "StockEventType" ADD VALUE 'LOSS';
