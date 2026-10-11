import { Prisma } from '@prisma/client';

/**
 * Bloquea la fila del proveedor hasta el fin de la transacción para que el
 * libro de movimientos (saldo acumulado) no se calcule en paralelo.
 */
export async function lockSupplier(
  tx: Prisma.TransactionClient,
  supplierId: string
): Promise<void> {
  await tx.$queryRaw`SELECT id FROM suppliers WHERE id = ${supplierId} FOR UPDATE`;
}
