import { Prisma } from '@prisma/client';
import { BusinessError } from './errors';

export interface StockChange {
  stockBefore: number;
  stockAfter: number;
}

/**
 * Cambia el stock de un producto de forma atómica. Las salidas solo se aplican
 * si hay existencias suficientes (UPDATE condicionado), así que el stock no
 * puede quedar negativo ni siquiera con operaciones simultáneas.
 */
export async function changeStock(
  tx: Prisma.TransactionClient,
  params: {
    productId: string;
    storeId: string;
    delta: number;
    productName: string;
    insufficientMessage?: string;
  }
): Promise<StockChange> {
  const { productId, storeId, delta, productName } = params;

  if (!Number.isInteger(delta)) {
    throw new BusinessError(
      `La cantidad de "${productName}" debe ser un número entero`
    );
  }

  const result = await tx.product.updateMany({
    where:
      delta < 0
        ? { id: productId, storeId, stock: { gte: -delta } }
        : { id: productId, storeId },
    data: { stock: { increment: delta } },
  });

  if (result.count === 0) {
    const current = await tx.product.findFirst({
      where: { id: productId, storeId },
      select: { stock: true },
    });
    if (!current) {
      throw new BusinessError(`Producto "${productName}" no encontrado`, 404);
    }
    throw new BusinessError(
      params.insufficientMessage ??
        `Stock insuficiente para "${productName}". Disponible: ${current.stock}, requerido: ${-delta}`,
      409
    );
  }

  const updated = await tx.product.findFirst({
    where: { id: productId, storeId },
    select: { stock: true },
  });
  const stockAfter = updated!.stock;
  return { stockBefore: stockAfter - delta, stockAfter };
}
