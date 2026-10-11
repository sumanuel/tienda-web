-- DropIndex
DROP INDEX "purchase_returns_returnNumber_key";

-- DropIndex
DROP INDEX "purchases_purchaseNumber_key";

-- DropIndex
DROP INDEX "sales_saleNumber_key";

-- CreateTable
CREATE TABLE "document_counters" (
    "storeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL,

    CONSTRAINT "document_counters_pkey" PRIMARY KEY ("storeId","type")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_returns_storeId_returnNumber_key" ON "purchase_returns"("storeId", "returnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_storeId_purchaseNumber_key" ON "purchases"("storeId", "purchaseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "sales_storeId_saleNumber_key" ON "sales"("storeId", "saleNumber");

-- AddForeignKey
ALTER TABLE "document_counters" ADD CONSTRAINT "document_counters_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

