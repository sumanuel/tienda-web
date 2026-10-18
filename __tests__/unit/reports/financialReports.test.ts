/**
 * Tests unitarios para lib/reports/financialReports.ts
 *
 * El backend calcula en USD el estado de resultados mensual (ingresos por
 * ventas, egresos por compras netas de devoluciones); aquí se valida cómo el
 * servicio lo transforma y lo combina con cuentas por cobrar y por pagar.
 */

import { getFinancialReport } from '@/lib/reports/financialReports';
import { apiClient } from '@/lib/api';
import {
  getReceivablesSummary,
  getPayablesSummary,
} from '@/lib/accountsReceivable';

jest.mock('@/lib/api', () => ({ apiClient: { get: jest.fn() } }));
jest.mock('@/lib/accountsReceivable');

const mockGet = apiClient.get as jest.Mock;

const mockReport = (overrides: Record<string, unknown> = {}) => ({
  months: [
    { month: '2026-08', revenueUsd: 600, expensesUsd: 200, profitUsd: 400 },
    { month: '2026-09', revenueUsd: 400, expensesUsd: 200, profitUsd: 200 },
  ],
  totals: { revenueUsd: 1000, expensesUsd: 400, profitUsd: 600 },
  byPaymentMethod: [],
  unconvertedSales: 0,
  ...overrides,
});

describe('financialReports.ts - getFinancialReport()', () => {
  const mockStoreId = 'store-123';
  const mockDateRange = {
    startDate: new Date(2026, 7, 1),
    endDate: new Date(2026, 8, 30),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue(mockReport());
    (getReceivablesSummary as jest.Mock).mockResolvedValue({
      totalReceivable: 500,
    });
    (getPayablesSummary as jest.Mock).mockResolvedValue({
      totalPayable: 300,
    });
  });

  describe('Integración con servicios', () => {
    it('pide el reporte financiero del período con fechas de día calendario', async () => {
      await getFinancialReport(mockStoreId, mockDateRange);

      expect(mockGet).toHaveBeenCalledTimes(1);
      const url = mockGet.mock.calls[0][0] as string;
      expect(url.startsWith('/api/reports/financial?')).toBe(true);
      const params = new URLSearchParams(url.split('?')[1]);
      expect(params.get('storeId')).toBe(mockStoreId);
      expect(params.get('startDate')).toBe('2026-08-01');
      expect(params.get('endDate')).toBe('2026-09-30');
    });

    it('debe llamar a getReceivablesSummary y getPayablesSummary con storeId', async () => {
      await getFinancialReport(mockStoreId, mockDateRange);

      expect(getReceivablesSummary).toHaveBeenCalledWith(mockStoreId);
      expect(getPayablesSummary).toHaveBeenCalledWith(mockStoreId);
    });
  });

  describe('Totales', () => {
    it('toma ingresos, egresos y resultado de los totales del servidor', async () => {
      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.totalRevenue).toBe(1000);
      expect(result.totalExpenses).toBe(400);
      expect(result.grossProfit).toBe(600);
    });

    it('calcula el margen = resultado / ingresos * 100', async () => {
      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.profitMargin).toBe(60);
    });

    it('maneja división por cero en el margen', async () => {
      mockGet.mockResolvedValue(
        mockReport({
          months: [],
          totals: { revenueUsd: 0, expensesUsd: 0, profitUsd: 0 },
        })
      );

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.profitMargin).toBe(0);
      expect(isNaN(result.profitMargin)).toBe(false);
    });

    it('permite resultado negativo cuando se compra más de lo que se vende', async () => {
      mockGet.mockResolvedValue(
        mockReport({
          totals: { revenueUsd: 100, expensesUsd: 250, profitUsd: -150 },
        })
      );

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.grossProfit).toBe(-150);
      expect(result.profitMargin).toBe(-150);
    });

    it('con egresos pero sin ingresos el margen es 0, no infinito', async () => {
      mockGet.mockResolvedValue(
        mockReport({
          totals: { revenueUsd: 0, expensesUsd: 1.1, profitUsd: -1.1 },
        })
      );

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.totalExpenses).toBe(1.1);
      expect(result.profitMargin).toBe(0);
    });
  });

  describe('Estado de resultados mensual', () => {
    it('devuelve una fila por mes con ingresos, egresos y resultado', async () => {
      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.incomeStatement).toEqual([
        { month: 'ago 2026', revenue: 600, expenses: 200, profit: 400 },
        { month: 'sep 2026', revenue: 400, expenses: 200, profit: 200 },
      ]);
    });

    it('conserva los meses sin movimientos', async () => {
      mockGet.mockResolvedValue(
        mockReport({
          months: [
            {
              month: '2026-08',
              revenueUsd: 0,
              expensesUsd: 0,
              profitUsd: 0,
            },
          ],
        })
      );

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.incomeStatement).toHaveLength(1);
      expect(result.incomeStatement[0].profit).toBe(0);
    });

    it('la suma de los meses coincide con los totales', async () => {
      const result = await getFinancialReport(mockStoreId, mockDateRange);

      const revenue = result.incomeStatement.reduce(
        (sum, row) => sum + row.revenue,
        0
      );
      const expenses = result.incomeStatement.reduce(
        (sum, row) => sum + row.expenses,
        0
      );
      expect(revenue).toBe(result.totalRevenue);
      expect(expenses).toBe(result.totalExpenses);
    });

    it('informa las ventas sin equivalente en USD', async () => {
      mockGet.mockResolvedValue(mockReport({ unconvertedSales: 2 }));

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.unconvertedSales).toBe(2);
    });
  });

  describe('Cuentas por cobrar/pagar', () => {
    it('debe incluir accountsReceivable desde getReceivablesSummary', async () => {
      (getReceivablesSummary as jest.Mock).mockResolvedValue({
        totalReceivable: 750,
      });

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.accountsReceivable).toBe(750);
    });

    it('debe incluir accountsPayable desde getPayablesSummary', async () => {
      (getPayablesSummary as jest.Mock).mockResolvedValue({
        totalPayable: 420,
      });

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.accountsPayable).toBe(420);
    });
  });

  describe('Distribución de ingresos', () => {
    it('debe traducir los métodos de pago a español, con monto en USD', async () => {
      mockGet.mockResolvedValue(
        mockReport({
          byPaymentMethod: [
            { method: 'cash', revenueUsd: 300, count: 3 },
            { method: 'card', revenueUsd: 400, count: 4 },
            { method: 'transfer', revenueUsd: 200, count: 2 },
            { method: 'pago_movil', revenueUsd: 60, count: 1 },
            { method: 'por_cobrar', revenueUsd: 40, count: 1 },
          ],
        })
      );

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.revenueDistribution).toEqual([
        { source: 'Efectivo', amount: 300 },
        { source: 'Tarjeta', amount: 400 },
        { source: 'Transferencia', amount: 200 },
        { source: 'Pago móvil', amount: 60 },
        { source: 'Por cobrar', amount: 40 },
      ]);
    });

    it('muestra tal cual un método de pago desconocido en lugar de llamarlo Crédito', async () => {
      mockGet.mockResolvedValue(
        mockReport({
          byPaymentMethod: [{ method: 'unknown', revenueUsd: 100, count: 1 }],
        })
      );

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.revenueDistribution).toEqual([
        { source: 'unknown', amount: 100 },
      ]);
    });
  });

  describe('Errores', () => {
    it('propaga el error si el servidor falla', async () => {
      mockGet.mockRejectedValue(new Error('500'));

      await expect(
        getFinancialReport(mockStoreId, mockDateRange)
      ).rejects.toThrow('500');
    });
  });
});
