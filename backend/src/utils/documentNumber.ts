import { Prisma } from '@prisma/client';

export type DocumentType =
  'sale' | 'purchase' | 'purchase_return' | 'credit_note';

const PREFIXES: Record<DocumentType, string> = {
  sale: 'VEN',
  purchase: 'COM',
  purchase_return: 'DEV',
  credit_note: 'NC',
};

async function lastIssuedNumber(
  tx: Prisma.TransactionClient,
  storeId: string,
  type: DocumentType
): Promise<number> {
  const prefix = PREFIXES[type];
  const startsWith = `${prefix}-`;
  let last: string | undefined;

  if (type === 'sale') {
    last = (
      await tx.sale.findFirst({
        where: { storeId, saleNumber: { startsWith: startsWith } },
        orderBy: { saleNumber: 'desc' },
        select: { saleNumber: true },
      })
    )?.saleNumber;
  } else if (type === 'purchase') {
    last = (
      await tx.purchase.findFirst({
        where: { storeId, purchaseNumber: { startsWith: startsWith } },
        orderBy: { purchaseNumber: 'desc' },
        select: { purchaseNumber: true },
      })
    )?.purchaseNumber;
  } else if (type === 'credit_note') {
    last = (
      await tx.creditNote.findFirst({
        where: { storeId, noteNumber: { startsWith: startsWith } },
        orderBy: { noteNumber: 'desc' },
        select: { noteNumber: true },
      })
    )?.noteNumber;
  } else {
    last = (
      await tx.purchaseReturn.findFirst({
        where: { storeId, returnNumber: { startsWith: startsWith } },
        orderBy: { returnNumber: 'desc' },
        select: { returnNumber: true },
      })
    )?.returnNumber;
  }

  const parsed = last ? parseInt(last.split('-')[1], 10) : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Siguiente número consecutivo por tienda y tipo, atómico: el upsert bloquea la
 * fila del contador hasta que termina la transacción, así que dos operaciones
 * simultáneas nunca obtienen el mismo número. La primera vez parte del mayor
 * número ya emitido.
 */
export async function nextDocumentNumber(
  tx: Prisma.TransactionClient,
  storeId: string,
  type: DocumentType
): Promise<string> {
  const initial = (await lastIssuedNumber(tx, storeId, type)) + 1;

  const rows = await tx.$queryRaw<{ lastNumber: number }[]>`
    INSERT INTO document_counters ("storeId", "type", "lastNumber")
    VALUES (${storeId}, ${type}, ${initial})
    ON CONFLICT ("storeId", "type")
    DO UPDATE SET "lastNumber" = document_counters."lastNumber" + 1
    RETURNING "lastNumber"`;

  return `${PREFIXES[type]}-${String(rows[0].lastNumber).padStart(6, '0')}`;
}
