/**
 * Tests unitarios para lib/reports/salesReports.ts
 *
 * Objetivo: validar el mapeo entre la respuesta de GET /api/reports/sales
 * (montos en USD agregados por el backend) y SalesReportData.
 *
 * El frontend solo completa los días y las horas sin ventas para las
 * gráficas; los totales no se recalculan aquí.
 */

import { getSalesReport } from '@/lib/reports/salesReports';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api', () => ({ apiClient: { get: jest.fn() } }));

const mockGet = apiClient.get as jest.Mock;

const emptyReport = () => ({
  summary: { totalUsd: 0, count: 0, averageUsd: 0 },
  topProduct: null,
  byDay: [],
  byPaymentMethod: [],
  byHour: [],
  byProduct: [],
  unconvertedSales: 0,
});

describe('salesReports.ts - getSalesReport()', () => {
  const mockStoreId = 'store-123';
  const mockDateRange = {
    startDate: new Date(2026, 7, 1),
    endDate: new Date(2026, 7, 7),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue(emptyReport());
  });

  it('pide el reporte de la tienda con fechas de día calendario', async () => {
    await getSalesReport(mockStoreId, mockDateRange);

    expect(mockGet).toHaveBeenCalledTimes(1);
    const url = mockGet.mock.calls[0][0] as string;
    expect(url.startsWith('/api/reports/sales?')).toBe(true);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('storeId')).toBe(mockStoreId);
    expect(params.get('startDate')).toBe('2026-08-01');
    expect(params.get('endDate')).toBe('2026-08-07');
  });

  describe('Totales (calculados por el backend en USD)', () => {
    it('toma total, transacciones y ticket promedio del resumen', async () => {
      mockGet.mockResolvedValue({
        ...emptyReport(),
        summary: { totalUsd: 435.5, count: 3, averageUsd: 145.17 },
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      expect(result.totalSales).toBe(435.5);
      expect(result.totalTransactions).toBe(3);
      expect(result.averageTicket).toBe(145.17);
    });

    it('maneja el caso de 0 ventas', async () => {
      const result = await getSalesReport(mockStoreId, mockDateRange);

      expect(result.totalSales).toBe(0);
      expect(result.totalTransactions).toBe(0);
      expect(result.averageTicket).toBe(0);
      expect(result.topProduct).toBeNull();
      expect(result.salesByProduct).toEqual([]);
    });

    it('informa las ventas sin equivalente en USD', async () => {
      mockGet.mockResolvedValue({ ...emptyReport(), unconvertedSales: 2 });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      expect(result.unconvertedSales).toBe(2);
    });
  });

  describe('Ventas por día', () => {
    it('incluye todos los días del rango, incluso sin ventas', async () => {
      mockGet.mockResolvedValue({
        ...emptyReport(),
        byDay: [{ date: '2026-08-05', totalUsd: 150, count: 1 }],
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      expect(result.salesByDay).toHaveLength(7); // 01-07 agosto
      const dayWithSale = result.salesByDay.find((d) => d.date.includes('05'));
      expect(dayWithSale?.total).toBe(150);
      expect(dayWithSale?.transactions).toBe(1);

      const daysWithoutSales = result.salesByDay.filter(
        (d) => d.transactions === 0
      );
      expect(daysWithoutSales).toHaveLength(6);
      daysWithoutSales.forEach((day) => expect(day.total).toBe(0));
    });
  });

  describe('Ventas por hora', () => {
    it('devuelve las 24 horas, con ceros donde no hubo ventas', async () => {
      mockGet.mockResolvedValue({
        ...emptyReport(),
        byHour: [{ hour: 14, totalUsd: 85.5, count: 2 }],
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      expect(result.salesByHour).toHaveLength(24);
      expect(result.salesByHour[14]).toEqual({
        hour: 14,
        total: 85.5,
        transactions: 2,
      });
      expect(result.salesByHour[3]).toEqual({
        hour: 3,
        total: 0,
        transactions: 0,
      });
    });
  });

  describe('Ventas por método de pago', () => {
    it('conserva el monto en USD y las transacciones de cada método', async () => {
      mockGet.mockResolvedValue({
        ...emptyReport(),
        byPaymentMethod: [
          { method: 'cash', totalUsd: 350, count: 2 },
          { method: 'card', totalUsd: 85.5, count: 1 },
        ],
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      expect(result.salesByPaymentMethod).toEqual([
        { method: 'cash', total: 350, transactions: 2 },
        { method: 'card', total: 85.5, transactions: 1 },
      ]);
    });
  });

  describe('Productos', () => {
    it('mapea el detalle por producto y el producto más vendido', async () => {
      mockGet.mockResolvedValue({
        ...emptyReport(),
        topProduct: {
          productId: 'p1',
          productName: 'Harina Pan 1kg',
          quantity: 120,
          totalUsd: 300,
        },
        byProduct: [
          {
            productId: 'p1',
            productName: 'Harina Pan 1kg',
            quantity: 120,
            totalUsd: 300,
          },
          { productId: 'p2', productName: 'Arroz', quantity: 10, totalUsd: 20 },
        ],
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      expect(result.topProduct).toEqual({
        id: 'p1',
        name: 'Harina Pan 1kg',
        quantity: 120,
        total: 300,
      });
      expect(result.salesByProduct).toEqual([
        {
          productId: 'p1',
          productName: 'Harina Pan 1kg',
          quantity: 120,
          total: 300,
        },
        { productId: 'p2', productName: 'Arroz', quantity: 10, total: 20 },
      ]);
    });
  });

  describe('Errores', () => {
    it('lanza un error legible si el servidor falla', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      mockGet.mockRejectedValue(new Error('500'));

      await expect(getSalesReport(mockStoreId, mockDateRange)).rejects.toThrow(
        'Error al generar reporte de ventas'
      );
    });
  });
});
