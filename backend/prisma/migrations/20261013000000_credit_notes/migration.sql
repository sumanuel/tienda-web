-- AlterTable
ALTER TABLE "supplier_transactions" ADD COLUMN     "creditNoteId" TEXT;

-- CreateTable
CREATE TABLE "credit_notes" (
    "id" TEXT NOT NULL,
    "noteNumber" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseReturnId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "amountReference" DOUBLE PRECISION,
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_purchaseReturnId_key" ON "credit_notes"("purchaseReturnId");

-- CreateIndex
CREATE INDEX "credit_notes_storeId_supplierId_idx" ON "credit_notes"("storeId", "supplierId");

-- CreateIndex
CREATE INDEX "credit_notes_storeId_createdAt_idx" ON "credit_notes"("storeId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_storeId_noteNumber_key" ON "credit_notes"("storeId", "noteNumber");

-- CreateIndex
CREATE INDEX "supplier_transactions_creditNoteId_idx" ON "supplier_transactions"("creditNoteId");

-- AddForeignKey
ALTER TABLE "supplier_transactions" ADD CONSTRAINT "supplier_transactions_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "credit_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "purchase_returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

