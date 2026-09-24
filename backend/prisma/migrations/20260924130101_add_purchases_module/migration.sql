-- AlterTable
ALTER TABLE "supplier_transactions" ADD COLUMN     "purchaseId" TEXT,
ADD COLUMN     "purchaseReturnId" TEXT;

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "purchaseNumber" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VES',
    "localCurrency" TEXT NOT NULL DEFAULT 'VES',
    "referenceCurrency" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReference" DOUBLE PRECISION,
    "paymentMethod" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "notes" TEXT,
    "cancelReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "localCost" DOUBLE PRECISION NOT NULL,
    "referenceCost" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "subtotalLocal" DOUBLE PRECISION NOT NULL,
    "subtotalReference" DOUBLE PRECISION NOT NULL,
    "costSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_returns" (
    "id" TEXT NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseId" TEXT,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VES',
    "localCurrency" TEXT NOT NULL DEFAULT 'VES',
    "referenceCurrency" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReference" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_return_items" (
    "id" TEXT NOT NULL,
    "purchaseReturnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "purchaseItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchases_purchaseNumber_key" ON "purchases"("purchaseNumber");

-- CreateIndex
CREATE INDEX "purchases_storeId_createdAt_idx" ON "purchases"("storeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "purchases_storeId_supplierId_idx" ON "purchases"("storeId", "supplierId");

-- CreateIndex
CREATE INDEX "purchases_storeId_status_idx" ON "purchases"("storeId", "status");

-- CreateIndex
CREATE INDEX "purchases_purchaseNumber_idx" ON "purchases"("purchaseNumber");

-- CreateIndex
CREATE INDEX "purchase_items_purchaseId_idx" ON "purchase_items"("purchaseId");

-- CreateIndex
CREATE INDEX "purchase_items_productId_idx" ON "purchase_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_returns_returnNumber_key" ON "purchase_returns"("returnNumber");

-- CreateIndex
CREATE INDEX "purchase_returns_storeId_createdAt_idx" ON "purchase_returns"("storeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "purchase_returns_storeId_supplierId_idx" ON "purchase_returns"("storeId", "supplierId");

-- CreateIndex
CREATE INDEX "purchase_returns_purchaseId_idx" ON "purchase_returns"("purchaseId");

-- CreateIndex
CREATE INDEX "purchase_returns_returnNumber_idx" ON "purchase_returns"("returnNumber");

-- CreateIndex
CREATE INDEX "purchase_return_items_purchaseReturnId_idx" ON "purchase_return_items"("purchaseReturnId");

-- CreateIndex
CREATE INDEX "purchase_return_items_productId_idx" ON "purchase_return_items"("productId");

-- CreateIndex
CREATE INDEX "supplier_transactions_purchaseId_idx" ON "supplier_transactions"("purchaseId");

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "purchase_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_transactions" ADD CONSTRAINT "supplier_transactions_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_transactions" ADD CONSTRAINT "supplier_transactions_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "purchase_returns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
