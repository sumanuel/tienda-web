// Métodos de pago de ventas (cash, card, transfer, pago_movil, por_cobrar) y
// de compras (efectivo, transferencia, credito) con su nombre para reportes
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  pago_movil: 'Pago móvil',
  por_cobrar: 'Por cobrar',
  credit: 'Crédito',
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  credito: 'Crédito',
};

// Un método desconocido se muestra tal cual en lugar de adivinar su nombre
export const paymentMethodLabel = (method: string) =>
  PAYMENT_METHOD_LABELS[method] ?? method;
