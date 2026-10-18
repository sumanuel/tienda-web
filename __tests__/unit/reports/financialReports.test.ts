/**
 * Tests unitarios para lib/reports/financialReports.ts
 *
 * Objetivo: Validar integración con Fase 5 y cálculos financieros
 */

import { getFinancialReport } from '@/lib/reports/financialReports';
import { getSalesReport } from '@/lib/reports/salesReports';
import { getPurchasesReport } from '@/lib/reports/purchaseReports';
import {
  getReceivablesSummary,
  getPayablesSummary,
} from '@/lib/accountsReceivable';

// Mocks
jest.mock('@/lib/reports/salesReports');
jest.mock('@/lib/reports/purchaseReports');
jest.mock('@/lib/accountsReceivable');

describe('financialReports.ts - getFinancialReport()', () => {
  const mockStoreId = 'store-123';
  const mockDateRange = {
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-08-31'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Sin compras en el período salvo que cada prueba indique otra cosa
    (getPurchasesReport as jest.Mock).mockResolvedValue({ netReference: 0 });
  });

  describe('Integración con servicios', () => {
    it('debe llamar a getSalesReport con parámetros correctos', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 1000,
        salesByPaymentMethod: [],
      });

      (getReceivablesSummary as jest.Mock).mockResolvedValue({
        totalReceivable: 500,
      });

      (getPayablesSummary as jest.Mock).mockResolvedValue({
        totalPayable: 300,
      });

      await getFinancialReport(mockStoreId, mockDateRange);

      expect(getSalesReport).toHaveBeenCalledWith(mockStoreId, mockDateRange);
    });

    it('debe llamar a getReceivablesSummary con storeId', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 1000,
        salesByPaymentMethod: [],
      });

      (getReceivablesSummary as jest.Mock).mockResolvedValue({
        totalReceivable: 500,
      });

      (getPayablesSummary as jest.Mock).mockResolvedValue({
        totalPayable: 300,
      });

      await getFinancialReport(mockStoreId, mockDateRange);

      expect(getReceivablesSummary).toHaveBeenCalledWith(mockStoreId);
    });

    it('debe llamar a getPayablesSummary con storeId', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 1000,
        salesByPaymentMethod: [],
      });

      (getReceivablesSummary as jest.Mock).mockResolvedValue({
        totalReceivable: 500,
      });

      (getPayablesSummary as jest.Mock).mockResolvedValue({
        totalPayable: 300,
      });

      await getFinancialReport(mockStoreId, mockDateRange);

      expect(getPayablesSummary).toHaveBeenCalledWith(mockStoreId);
    });
  });

  describe('Egresos (compras netas de devoluciones)', () => {
    const mockSummaries = () => {
      (getReceivablesSummary as jest.Mock).mockResolvedValue({
        totalReceivable: 500,
      });
      (getPayablesSummary as jest.Mock).mockResolvedValue({
        totalPayable: 300,
      });
    };

    it('debe pedir el reporte de compras del mismo período', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 1000,
        salesByPaymentMethod: [],
      });
      mockSummaries();

      await getFinancialReport(mockStoreId, mockDateRange);

      expect(getPurchasesReport).toHaveBeenCalledWith(
        mockStoreId,
        mockDateRange
      );
    });

    it('totalExpenses toma las compras netas en USD', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 1000,
        salesByPaymentMethod: [],
      });
      (getPurchasesReport as jest.Mock).mockResolvedValue({
        netReference: 400,
      });
      mockSummaries();

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.totalExpenses).toBe(400);
      expect(result.grossProfit).toBe(600);
      expect(result.profitMargin).toBe(60);
    });

    it('permite resultado negativo cuando se compra más de lo que se vende', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 100,
        salesByPaymentMethod: [],
      });
      (getPurchasesReport as jest.Mock).mockResolvedValue({
        netReference: 250,
      });
      mockSummaries();

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.grossProfit).toBe(-150);
      expect(result.profitMargin).toBe(-150);
    });
  });

  describe('BUG-008: incomeStatement siempre devuelve 0s', () => {
    it('FALLA: incomeStatement tiene todos los valores en 0 (bug crítico)', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 1000,
        salesByPaymentMethod: [],
      });

      (getReceivablesSummary as jest.Mock).mockResolvedValue({
        totalReceivable: 500,
      });

      (getPayablesSummary as jest.Mock).mockResolvedValue({
        totalPayable: 300,
      });

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      // BUG: incomeStatement siempre tiene 0s
      result.incomeStatement.forEach((month) => {
        expect(month.revenue).toBe(0);
        expect(month.expenses).toBe(0);
        expect(month.profit).toBe(0);
      });

      // DEBERÍA tener valores reales por mes
      // Este test DOCUMENTA el bug actual
    });
  });

  describe('Cálculos básicos', () => {
    it('debe calcular totalRevenue desde salesData.totalSales', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 5000,
        salesByPaymentMethod: [],
      });

      (getReceivablesSummary as jest.Mock).mockResolvedValue({
        totalReceivable: 500,
      });

      (getPayablesSummary as jest.Mock).mockResolvedValue({
        totalPayable: 300,
      });

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.totalRevenue).toBe(5000);
    });

    it('debe calcular grossProfit = totalRevenue - totalExpenses', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 5000,
        salesByPaymentMethod: [],
      });

      (getReceivablesSummary as jest.Mock).mockResolvedValue({
        totalReceivable: 500,
      });

      (getPayablesSummary as jest.Mock).mockResolvedValue({
        totalPayable: 300,
      });

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      // Sin compras en el período (mock por defecto), el resultado es el ingreso
      expect(result.grossProfit).toBe(5000); // 5000 - 0
    });

    it('debe manejar división por cero en profitMargin', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 0,
        salesByPaymentMethod: [],
      });

      (getReceivablesSummary as jest.Mock).mockResolvedValue({
        totalReceivable: 0,
      });

      (getPayablesSummary as jest.Mock).mockResolvedValue({
        totalPayable: 0,
      });

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.profitMargin).toBe(0);
      expect(isNaN(result.profitMargin)).toBe(false);
    });

    it('debe calcular profitMargin = (grossProfit / totalRevenue) * 100', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 1000,
        salesByPaymentMethod: [],
      });

      (getReceivablesSummary as jest.Mock).mockResolvedValue({
        totalReceivable: 500,
      });

      (getPayablesSummary as jest.Mock).mockResolvedValue({
        totalPayable: 300,
      });

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      // Sin compras: resultado = 1000 y margen = (1000 / 1000) * 100 = 100%
      expect(result.profitMargin).toBe(100);
    });
  });

  describe('Cuentas por cobrar/pagar', () => {
    it('debe incluir accountsReceivable desde getReceivablesSummary', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 1000,
        salesByPaymentMethod: [],
      });

      (getReceivablesSummary as jest.Mock).mockResolvedValue({
        totalReceivable: 750,
      });

      (getPayablesSummary as jest.Mock).mockResolvedValue({
        totalPayable: 300,
      });

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.accountsReceivable).toBe(750);
    });

    it('debe incluir accountsPayable desde getPayablesSummary', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 1000,
        salesByPaymentMethod: [],
      });

      (getReceivablesSummary as jest.Mock).mockResolvedValue({
        totalReceivable: 500,
      });

      (getPayablesSummary as jest.Mock).mockResolvedValue({
        totalPayable: 420,
      });

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.accountsPayable).toBe(420);
    });
  });

  describe('Distribución de ingresos', () => {
    it('debe traducir métodos de pago a español', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 1000,
        salesByPaymentMethod: [
          { method: 'cash', total: 300 },
          { method: 'card', total: 400 },
          { method: 'transfer', total: 200 },
          { method: 'credit', total: 100 },
        ],
      });

      (getReceivablesSummary as jest.Mock).mockResolvedValue({
        totalReceivable: 500,
      });

      (getPayablesSummary as jest.Mock).mockResolvedValue({
        totalPayable: 300,
      });

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      expect(result.revenueDistribution).toEqual([
        { source: 'Efectivo', amount: 300 },
        { source: 'Tarjeta', amount: 400 },
        { source: 'Transferencia', amount: 200 },
        { source: 'Crédito', amount: 100 },
      ]);
    });

    it('debe manejar método de pago desconocido', async () => {
      (getSalesReport as jest.Mock).mockResolvedValue({
        totalSales: 1000,
        salesByPaymentMethod: [{ method: 'unknown', total: 100 }],
      });

      (getReceivablesSummary as jest.Mock).mockResolvedValue({
        totalReceivable: 500,
      });

      (getPayablesSummary as jest.Mock).mockResolvedValue({
        totalPayable: 300,
      });

      const result = await getFinancialReport(mockStoreId, mockDateRange);

      // Debería manejar métodos desconocidos
      expect(result.revenueDistribution).toHaveLength(1);
    });
  });
});
