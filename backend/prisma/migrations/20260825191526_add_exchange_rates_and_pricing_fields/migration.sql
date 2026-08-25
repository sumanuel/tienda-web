/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `exchange_rates` table. All the data in the column will be lost.
  - Added the required column `storeId` to the `exchange_rates` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "exchange_rates_fromCurrency_idx";

-- DropIndex
DROP INDEX "exchange_rates_fromCurrency_toCurrency_key";

-- AlterTable
ALTER TABLE "exchange_rates" DROP COLUMN "updatedAt",
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "storeId" TEXT NOT NULL,
ALTER COLUMN "fromCurrency" SET DEFAULT 'USD',
ALTER COLUMN "toCurrency" SET DEFAULT 'VES',
ALTER COLUMN "source" SET DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "additionalCost" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "costCurrency" TEXT DEFAULT 'USD',
ADD COLUMN     "iva" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "margin" DOUBLE PRECISION DEFAULT 30;

-- CreateIndex
CREATE INDEX "exchange_rates_storeId_idx" ON "exchange_rates"("storeId");

-- CreateIndex
CREATE INDEX "exchange_rates_storeId_isActive_idx" ON "exchange_rates"("storeId", "isActive");

-- CreateIndex
CREATE INDEX "exchange_rates_createdAt_idx" ON "exchange_rates"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "products_margin_idx" ON "products"("margin");

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
