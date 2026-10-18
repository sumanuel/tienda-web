/**
 * Tests unitarios para lib/reports/paymentMethods.ts
 *
 * Una sola tabla de nombres sirve a los reportes de ventas, financiero y al
 * PDF; un método desconocido debe verse tal cual, no con un nombre inventado.
 */

import { paymentMethodLabel } from '@/lib/reports/paymentMethods';

describe('paymentMethodLabel()', () => {
  it.each([
    ['cash', 'Efectivo'],
    ['card', 'Tarjeta'],
    ['transfer', 'Transferencia'],
    ['pago_movil', 'Pago móvil'],
    ['por_cobrar', 'Por cobrar'],
    ['credit', 'Crédito'],
  ])('traduce el método de ventas %s', (method, label) => {
    expect(paymentMethodLabel(method)).toBe(label);
  });

  it.each([
    ['efectivo', 'Efectivo'],
    ['transferencia', 'Transferencia'],
    ['credito', 'Crédito'],
  ])('traduce el método de compras %s', (method, label) => {
    expect(paymentMethodLabel(method)).toBe(label);
  });

  it('un método desconocido se muestra tal cual', () => {
    expect(paymentMethodLabel('cripto')).toBe('cripto');
  });

  it('no confunde un método desconocido con Crédito', () => {
    expect(paymentMethodLabel('unknown')).not.toBe('Crédito');
  });
});
