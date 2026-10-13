-- El libro del proveedor está en USD: la nota guarda su monto en USD y el
-- equivalente en VES, y lo reembolsado en USD.
ALTER TABLE "credit_notes" RENAME COLUMN "amount" TO "amountUsd";
ALTER TABLE "credit_notes" RENAME COLUMN "amountReference" TO "amountVes";
ALTER TABLE "credit_notes" RENAME COLUMN "refundedAmount" TO "refundedUsd";
UPDATE "credit_notes" SET "amountVes" = 0 WHERE "amountVes" IS NULL;
ALTER TABLE "credit_notes" ALTER COLUMN "amountVes" SET NOT NULL;
