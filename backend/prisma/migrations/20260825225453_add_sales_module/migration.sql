/*
  Warnings:

  - You are about to drop the column `cost` on the `sale_items` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `sale_items` table. All the data in the column will be lost.
  - You are about to drop the column `amountReceived` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `cashierId` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `cashierName` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `sales` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[storeId,documentNumber]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `localPrice` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productName` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referencePrice` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotalLocal` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotalReference` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Made the column `change` on table `sales` required. This step will fail if there are existing NULL values in that column.
  - Made the column `saleNumber` on table `sales` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "sales_createdAt_idx";

-- DropIndex
DROP INDEX "sales_customerId_idx";

-- DropIndex
DROP INDEX "sales_paymentMethod_idx";

-- DropIndex
DROP INDEX "sales_storeId_idx";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "documentType" TEXT DEFAULT 'V';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "trackInventory" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable sale_items: agregar columnas con valores por defecto temporales
ALTER TABLE "sale_items" DROP COLUMN "cost",
DROP COLUMN "discount",
ADD COLUMN     "iva" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "localPrice" DOUBLE PRECISION,
ADD COLUMN     "priceSnapshot" JSONB,
ADD COLUMN     "productName" TEXT,
ADD COLUMN     "referencePrice" DOUBLE PRECISION,
ADD COLUMN     "subtotalLocal" DOUBLE PRECISION,
ADD COLUMN     "subtotalReference" DOUBLE PRECISION,
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- Actualizar registros existentes en sale_items con valores por defecto
UPDATE "sale_items" si
SET 
  "localPrice" = si.price,
  "referencePrice" = si.price,
  "subtotalLocal" = si.subtotal,
  "subtotalReference" = si.subtotal,
  "productName" = COALESCE(p.name, 'Producto sin nombre')
FROM "products" p
WHERE si."productId" = p.id AND si."productName" IS NULL;

-- Hacer las columnas NOT NULL después de actualizar
ALTER TABLE "sale_items"
  ALTER COLUMN "localPrice" SET NOT NULL,
  ALTER COLUMN "productName" SET NOT NULL,
  ALTER COLUMN "referencePrice" SET NOT NULL,
  ALTER COLUMN "subtotalLocal" SET NOT NULL,
  ALTER COLUMN "subtotalReference" SET NOT NULL;

-- AlterTable sales: agregar columnas con valores por defecto temporales
ALTER TABLE "sales" DROP COLUMN "amountReceived",
DROP COLUMN "cashierId",
DROP COLUMN "cashierName",
DROP COLUMN "paymentStatus",
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "localCurrency" TEXT NOT NULL DEFAULT 'VES',
ADD COLUMN     "monetarySnapshot" JSONB,
ADD COLUMN     "paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "referenceCurrency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "referenceNumber" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed',
ADD COLUMN     "totalReference" DOUBLE PRECISION,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "tax" DROP DEFAULT,
ALTER COLUMN "currency" SET DEFAULT 'VES',
ALTER COLUMN "change" SET DEFAULT 0;

-- Actualizar registros existentes en sales
-- Asignar valores por defecto a change NULL
UPDATE "sales" SET "change" = 0 WHERE "change" IS NULL;

-- Asignar valores por defecto a saleNumber NULL (usar id como fallback)
UPDATE "sales" SET "saleNumber" = 'SALE-' || SUBSTRING(id, 1, 8) WHERE "saleNumber" IS NULL;

-- Asignar userId por defecto (usar el primer usuario disponible o crear uno temporal)
UPDATE "sales" SET "userId" = (SELECT id FROM "users" LIMIT 1) WHERE "userId" IS NULL;

-- Hacer las columnas NOT NULL después de actualizar
ALTER TABLE "sales"
  ALTER COLUMN "change" SET NOT NULL,
  ALTER COLUMN "saleNumber" SET NOT NULL,
  ALTER COLUMN "userId" SET NOT NULL;

-- CreateTable
CREATE TABLE "receivables" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "saleId" TEXT,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "documentNumber" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "referenceAmount" DOUBLE PRECISION NOT NULL,
    "exchangeRateAtCreation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "invoiceNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "receivables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivable_payments" (
    "id" TEXT NOT NULL,
    "receivableId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receivable_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "receivables_saleId_key" ON "receivables"("saleId");

-- CreateIndex
CREATE INDEX "receivables_storeId_status_idx" ON "receivables"("storeId", "status");

-- CreateIndex
CREATE INDEX "receivables_storeId_customerId_idx" ON "receivables"("storeId", "customerId");

-- CreateIndex
CREATE INDEX "receivables_storeId_dueDate_idx" ON "receivables"("storeId", "dueDate");

-- CreateIndex
CREATE INDEX "receivables_saleId_idx" ON "receivables"("saleId");

-- CreateIndex
CREATE INDEX "receivable_payments_receivableId_idx" ON "receivable_payments"("receivableId");

-- CreateIndex
CREATE INDEX "customers_storeId_name_idx" ON "customers"("storeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_storeId_documentNumber_key" ON "customers"("storeId", "documentNumber");

-- CreateIndex
CREATE INDEX "sales_storeId_createdAt_idx" ON "sales"("storeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "sales_storeId_customerId_idx" ON "sales"("storeId", "customerId");

-- CreateIndex
CREATE INDEX "sales_storeId_status_idx" ON "sales"("storeId", "status");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "receivables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
