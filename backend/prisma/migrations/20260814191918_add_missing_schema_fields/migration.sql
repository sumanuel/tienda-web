/*
  Warnings:

  - A unique constraint covering the columns `[saleNumber]` on the table `sales` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "inventory_movements" ADD COLUMN     "productCode" TEXT,
ADD COLUMN     "productName" TEXT,
ADD COLUMN     "stockAfter" INTEGER,
ADD COLUMN     "stockBefore" INTEGER,
ADD COLUMN     "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "userName" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "priceEUR" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "priceUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "priceVES" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "amountReceived" DOUBLE PRECISION,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cashierId" TEXT,
ADD COLUMN     "cashierName" TEXT,
ADD COLUMN     "change" DOUBLE PRECISION,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'paid',
ADD COLUMN     "saleNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sales_saleNumber_key" ON "sales"("saleNumber");

-- CreateIndex
CREATE INDEX "sales_saleNumber_idx" ON "sales"("saleNumber");
