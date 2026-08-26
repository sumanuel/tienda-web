import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Genera un número consecutivo único para ventas
 * @param storeId - ID de la tienda
 * @param prefix - Prefijo (por defecto 'VEN')
 * @returns Número de venta formateado (ej: VEN-000001)
 */
export async function generateSaleNumber(
  storeId: string,
  prefix: string = 'VEN'
): Promise<string> {
  // Obtener el último número de venta para esta tienda con este prefijo
  const lastSale = await prisma.sale.findFirst({
    where: {
      storeId,
      saleNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      saleNumber: true,
    },
  });

  let nextNumber = 1;

  if (lastSale) {
    // Extraer el número del formato VEN-000001
    const numberPart = lastSale.saleNumber.split('-')[1];
    if (numberPart) {
      nextNumber = parseInt(numberPart, 10) + 1;
    }
  }

  // Formatear con ceros a la izquierda (mínimo 6 dígitos)
  const paddedNumber = nextNumber.toString().padStart(6, '0');

  return `${prefix}-${paddedNumber}`;
}

/**
 * Verifica si un número de venta ya existe
 * @param saleNumber - Número de venta a verificar
 * @returns true si existe, false si no
 */
export async function saleNumberExists(saleNumber: string): Promise<boolean> {
  const sale = await prisma.sale.findUnique({
    where: { saleNumber },
  });

  return !!sale;
}
