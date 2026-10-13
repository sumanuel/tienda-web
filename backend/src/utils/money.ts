export const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Monto en USD de un documento: el guardado o, si falta, derivado de su tasa.
 * Los libros de proveedores y clientes (SupplierTransaction y
 * CustomerTransaction) están en USD, igual que las pantallas de Cuentas por
 * Pagar y por Cobrar.
 */
export function toUsd(
  total: number,
  totalReference: number | null | undefined,
  exchangeRate: number
): number {
  return round2(totalReference ?? (exchangeRate ? total / exchangeRate : 0));
}
