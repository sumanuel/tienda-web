/**
 * Test de integración para exportación Excel
 *
 * Objetivo: Validar que la exportación genera archivos correctos
 */

import {
  exportSalesReportToExcel,
  exportInventoryReportToExcel,
  exportFinancialReportToExcel,
} from '@/lib/export/excelExporter';
import * as XLSX from 'xlsx';
import type { SalesReportData } from '@/types/reports';

// Mock de XLSX
jest.mock('xlsx', () => {
  const actualXLSX = jest.requireActual('xlsx');
  return {
    ...actualXLSX,
    utils: {
      ...actualXLSX.utils,
      book_new: jest.fn(() => ({ SheetNames: [], Sheets: {} })),
      json_to_sheet: jest.fn(() => ({})),
      aoa_to_sheet: jest.fn(() => ({})),
      book_append_sheet: jest.fn(),
    },
    write: jest.fn(() => new ArrayBuffer(0)),
  };
});

// Mock de DOM APIs
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();
global.Blob = jest.fn() as any;

describe('Integración: Exportación Excel', () => {
  let mockLink: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
    };

    document.createElement = jest.fn((tag) => {
      if (tag === 'a') {
        return mockLink;
      }
      return {} as any;
    });
  });

  describe('exportSalesReportToExcel()', () => {
    const mockReportData: SalesReportData = {
      totalSales: 1000,
      totalTransactions: 10,
      averageTicket: 100,
      topProduct: {
        id: 'prod-1',
        name: 'Laptop HP',
        quantity: 5,
        total: 750,
      },
      salesByDay: [
        { date: '05 ago', total: 500, transactions: 5 },
        { date: '06 ago', total: 500, transactions: 5 },
      ],
      salesByProduct: [
        {
          productId: 'prod-1',
          productName: 'Laptop HP',
          quantity: 5,
          total: 750,
        },
        { productId: 'prod-2', productName: 'Mouse', quantity: 10, total: 250 },
      ],
      salesByPaymentMethod: [
        { method: 'cash', total: 600, transactions: 6 },
        { method: 'card', total: 400, transactions: 4 },
      ],
      salesByHour: [
        { hour: 10, total: 300, transactions: 3 },
        { hour: 14, total: 700, transactions: 7 },
      ],
    };

    const mockDateRange = {
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-07'),
    };

    it('debe crear un nuevo workbook', async () => {
      await exportSalesReportToExcel(mockReportData, mockDateRange);

      expect(XLSX.utils.book_new).toHaveBeenCalled();
    });

    it('debe crear 4 hojas (Resumen, Ventas por Día, Ventas por Producto, Métodos de Pago)', async () => {
      await exportSalesReportToExcel(mockReportData, mockDateRange);

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(4);
    });

    it('debe crear hoja de Resumen con datos correctos', async () => {
      await exportSalesReportToExcel(mockReportData, mockDateRange);

      const resumeCall = (XLSX.utils.aoa_to_sheet as jest.Mock).mock
        .calls[0][0];

      expect(resumeCall).toContainEqual(['Total Ventas', 1000]);
      expect(resumeCall).toContainEqual(['Total Transacciones', 10]);
      expect(resumeCall).toContainEqual(['Ticket Promedio', 100]);
      expect(resumeCall).toContainEqual(['Producto Más Vendido', 'Laptop HP']);
    });

    it('debe crear hoja de Ventas por Día', async () => {
      await exportSalesReportToExcel(mockReportData, mockDateRange);

      const dailySalesCall = (
        XLSX.utils.json_to_sheet as jest.Mock
      ).mock.calls.find((call) => call[0][0]?.Fecha);

      expect(dailySalesCall).toBeDefined();
      expect(dailySalesCall[0]).toHaveLength(2); // 2 días
    });

    it('debe crear hoja de Ventas por Producto', async () => {
      await exportSalesReportToExcel(mockReportData, mockDateRange);

      const productSalesCall = (
        XLSX.utils.json_to_sheet as jest.Mock
      ).mock.calls.find((call) => call[0][0]?.Producto);

      expect(productSalesCall).toBeDefined();
      expect(productSalesCall[0]).toHaveLength(2); // 2 productos
    });

    it('BUG-010: métodos de pago NO están traducidos (bug alto)', async () => {
      await exportSalesReportToExcel(mockReportData, mockDateRange);

      const paymentCall = (
        XLSX.utils.json_to_sheet as jest.Mock
      ).mock.calls.find((call) => call[0][0]?.['Método de Pago']);

      // BUG: Exporta 'cash', 'card' en vez de 'Efectivo', 'Tarjeta'
      expect(paymentCall[0][0]['Método de Pago']).toBe('cash');
      // DEBERÍA ser 'Efectivo'

      // Este test DOCUMENTA el bug BUG-010
    });

    it('debe generar Blob con tipo correcto', async () => {
      await exportSalesReportToExcel(mockReportData, mockDateRange);

      expect(global.Blob).toHaveBeenCalledWith(expect.any(ArrayBuffer), {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    });

    it('debe crear link de descarga con nombre descriptivo', async () => {
      await exportSalesReportToExcel(mockReportData, mockDateRange);

      expect(mockLink.download).toMatch(
        /^reporte-ventas_\d{4}-\d{2}-\d{2}_\d{4}\.xlsx$/
      );
    });

    it('debe triggear descarga (click en link)', async () => {
      await exportSalesReportToExcel(mockReportData, mockDateRange);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it('debe revocar URL después de descarga', async () => {
      await exportSalesReportToExcel(mockReportData, mockDateRange);

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
    });
  });

  describe('exportInventoryReportToExcel()', () => {
    const mockInventoryData = {
      totalValue: 5000,
      totalProducts: 50,
      lowStockProducts: 5,
      outOfStockProducts: 2,
      inventoryTurnover: 0,
      valueByCategory: [
        { category: 'Electrónica', quantity: 20, value: 3000 },
        { category: 'Ropa', quantity: 30, value: 2000 },
      ],
      stockDistribution: [],
      recentMovements: [],
      topRotation: [],
    };

    it('debe crear workbook con 2 hojas', async () => {
      await exportInventoryReportToExcel(mockInventoryData);

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
    });

    it('debe incluir resumen de inventario', async () => {
      await exportInventoryReportToExcel(mockInventoryData);

      const resumeCall = (XLSX.utils.aoa_to_sheet as jest.Mock).mock
        .calls[0][0];

      expect(resumeCall).toContainEqual(['Valor Total', 5000]);
      expect(resumeCall).toContainEqual(['Total Productos', 50]);
      expect(resumeCall).toContainEqual(['Stock Bajo', 5]);
      expect(resumeCall).toContainEqual(['Sin Stock', 2]);
    });
  });

  describe('exportFinancialReportToExcel()', () => {
    const mockFinancialData = {
      totalRevenue: 10000,
      totalExpenses: 0, // BUG-007
      grossProfit: 10000,
      profitMargin: 100, // BUG-009
      accountsReceivable: 2000,
      accountsPayable: 1500,
      incomeStatement: [],
      revenueDistribution: [
        { source: 'Efectivo', amount: 6000 },
        { source: 'Tarjeta', amount: 4000 },
      ],
    };

    const mockDateRange = {
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-31'),
    };

    it('debe crear workbook con 2 hojas', async () => {
      await exportFinancialReportToExcel(mockFinancialData, mockDateRange);

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
    });

    it('BUG-007 y BUG-009: datos financieros incorrectos en Excel', async () => {
      await exportFinancialReportToExcel(mockFinancialData, mockDateRange);

      const resumeCall = (XLSX.utils.aoa_to_sheet as jest.Mock).mock
        .calls[0][0];

      // BUG-007: Total Egresos = 0
      expect(resumeCall).toContainEqual(['Total Egresos', 0]);
      // DEBERÍA ser > 0

      // BUG-009: Margen de Utilidad = 100%
      const marginRow = resumeCall.find((row: any[]) =>
        row[0]?.includes('Margen de Utilidad')
      );
      expect(marginRow[1]).toBe('100.00');
      // DEBERÍA ser < 100%

      // Este test DOCUMENTA los bugs críticos
    });

    it('debe incluir cuentas por cobrar/pagar', async () => {
      await exportFinancialReportToExcel(mockFinancialData, mockDateRange);

      const resumeCall = (XLSX.utils.aoa_to_sheet as jest.Mock).mock
        .calls[0][0];

      expect(resumeCall).toContainEqual(['Cuentas por Cobrar', 2000]);
      expect(resumeCall).toContainEqual(['Cuentas por Pagar', 1500]);
    });
  });

  describe('BUG-011: Memory leak - URL no se revoca correctamente', () => {
    it('DOCUMENTA: URL se revoca pero sin timeout (leak menor)', async () => {
      const mockReportData: SalesReportData = {
        totalSales: 1000,
        totalTransactions: 10,
        averageTicket: 100,
        topProduct: null,
        salesByDay: [],
        salesByProduct: [],
        salesByPaymentMethod: [],
        salesByHour: [],
      };

      const mockDateRange = {
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-07'),
      };

      await exportSalesReportToExcel(mockReportData, mockDateRange);

      // BUG-011: URL se revoca inmediatamente después de click
      // DEBERÍA tener un timeout para asegurar que la descarga comenzó
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-blob-url');

      // SOLUCIÓN: Agregar setTimeout(() => revokeObjectURL(), 100)
    });
  });
});
