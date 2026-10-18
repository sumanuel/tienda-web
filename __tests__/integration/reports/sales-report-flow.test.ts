/**
 * Test de integración para el flujo completo de reporte de ventas
 *
 * Objetivo: validar el flujo end-to-end:
 * 1. Se solicita el reporte al backend (GET /api/reports/sales, en USD)
 * 2. Se completan los días y las horas sin ventas para las gráficas
 * 3. Se exporta el reporte a Excel
 */

import { getSalesReport } from '@/lib/reports/salesReports';
import { exportSalesReportToExcel } from '@/lib/export/excelExporter';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api', () => ({ apiClient: { get: jest.fn() } }));

// Mock de XLSX para exportación
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    json_to_sheet: jest.fn(() => ({})),
    aoa_to_sheet: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn(() => new ArrayBuffer(8)),
}));

// Mock de DOM APIs
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();
global.Blob = jest.fn() as any;

describe('Flujo de integración: Reporte de ventas completo', () => {
  const mockStoreId = 'store-123';
  const mockDateRange = {
    startDate: new Date(2026, 7, 1),
    endDate: new Date(2026, 7, 7),
  };
  const mockGet = apiClient.get as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    document.createElement = jest.fn((tag) => {
      if (tag === 'a') {
        return {
          href: '',
          download: '',
          click: jest.fn(),
        } as any;
      }
      return {} as any;
    });
  });

  describe('Flujo completo: Carga → Gráficas → Exportación', () => {
    it('debe completar el flujo end-to-end correctamente', async () => {
      mockGet.mockResolvedValue({
        summary: { totalUsd: 435.5, count: 3, averageUsd: 145.17 },
        topProduct: {
          productId: 'p1',
          productName: 'Harina Pan 1kg',
          quantity: 5,
          totalUsd: 250,
        },
        byDay: [
          { date: '2026-08-05', totalUsd: 150, count: 1 },
          { date: '2026-08-06', totalUsd: 85.5, count: 1 },
          { date: '2026-08-07', totalUsd: 200, count: 1 },
        ],
        byPaymentMethod: [
          { method: 'cash', totalUsd: 350, count: 2 },
          { method: 'card', totalUsd: 85.5, count: 1 },
        ],
        byHour: [
          { hour: 10, totalUsd: 150, count: 1 },
          { hour: 14, totalUsd: 85.5, count: 1 },
          { hour: 16, totalUsd: 200, count: 1 },
        ],
        byProduct: [
          {
            productId: 'p1',
            productName: 'Harina Pan 1kg',
            quantity: 5,
            totalUsd: 250,
          },
          {
            productId: 'p2',
            productName: 'Arroz 1kg',
            quantity: 3,
            totalUsd: 185.5,
          },
        ],
        unconvertedSales: 0,
      });

      // PASO 1: Cargar reporte
      const reportData = await getSalesReport(mockStoreId, mockDateRange);

      // PASO 2: Totales (vienen del backend, en USD)
      expect(reportData.totalSales).toBe(435.5);
      expect(reportData.totalTransactions).toBe(3);
      expect(reportData.averageTicket).toBeCloseTo(145.17, 2);
      expect(reportData.topProduct?.name).toBe('Harina Pan 1kg');

      // PASO 3: Ventas por día, con todos los días del rango
      expect(reportData.salesByDay).toHaveLength(7); // 01-07 agosto
      const day5 = reportData.salesByDay.find((d) => d.date.includes('05'));
      expect(day5?.total).toBe(150.0);
      expect(day5?.transactions).toBe(1);

      // PASO 4: Ventas por método de pago
      const cashSales = reportData.salesByPaymentMethod.find(
        (pm) => pm.method === 'cash'
      );
      expect(cashSales?.total).toBe(350.0); // 150 + 200
      expect(cashSales?.transactions).toBe(2);

      const cardSales = reportData.salesByPaymentMethod.find(
        (pm) => pm.method === 'card'
      );
      expect(cardSales?.total).toBe(85.5);
      expect(cardSales?.transactions).toBe(1);

      // PASO 5: Detalle por producto y ventas por hora
      expect(reportData.salesByProduct).toHaveLength(2);
      expect(reportData.salesByHour).toHaveLength(24);
      expect(reportData.salesByHour[14].transactions).toBe(1);

      // PASO 6: Exportar a Excel
      await exportSalesReportToExcel(reportData, mockDateRange);

      // PASO 7: Validar exportación
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('Flujo con datos vacíos', () => {
    it('debe manejar correctamente cuando no hay ventas en el rango', async () => {
      mockGet.mockResolvedValue({
        summary: { totalUsd: 0, count: 0, averageUsd: 0 },
        topProduct: null,
        byDay: [],
        byPaymentMethod: [],
        byHour: [],
        byProduct: [],
        unconvertedSales: 0,
      });

      const reportData = await getSalesReport(mockStoreId, mockDateRange);

      expect(reportData.totalSales).toBe(0);
      expect(reportData.totalTransactions).toBe(0);
      expect(reportData.averageTicket).toBe(0);
      expect(reportData.topProduct).toBeNull();

      expect(reportData.salesByDay).toHaveLength(7);
      reportData.salesByDay.forEach((day) => {
        expect(day.total).toBe(0);
        expect(day.transactions).toBe(0);
      });

      await expect(
        exportSalesReportToExcel(reportData, mockDateRange)
      ).resolves.not.toThrow();
    });
  });

  describe('Flujo con volumen alto de datos', () => {
    it('debe manejar 1000 ventas y muchos productos sin fallar', async () => {
      const products = Array.from({ length: 500 }, (_, i) => ({
        productId: `p${i}`,
        productName: `Producto ${i}`,
        quantity: i + 1,
        totalUsd: (i + 1) * 2,
      }));

      mockGet.mockResolvedValue({
        summary: { totalUsd: 250000, count: 1000, averageUsd: 250 },
        topProduct: products[products.length - 1],
        byDay: [{ date: '2026-08-05', totalUsd: 250000, count: 1000 }],
        byPaymentMethod: [
          { method: 'cash', totalUsd: 125000, count: 500 },
          { method: 'card', totalUsd: 125000, count: 500 },
        ],
        byHour: [{ hour: 10, totalUsd: 250000, count: 1000 }],
        byProduct: products,
        unconvertedSales: 0,
      });

      const reportData = await getSalesReport(mockStoreId, mockDateRange);

      expect(reportData.totalTransactions).toBe(1000);
      expect(reportData.salesByProduct).toHaveLength(500);
      await expect(
        exportSalesReportToExcel(reportData, mockDateRange)
      ).resolves.not.toThrow();
    });
  });
});
