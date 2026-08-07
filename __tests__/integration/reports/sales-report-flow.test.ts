/**
 * Test de integración para flujo completo de reporte de ventas
 *
 * Objetivo: Validar que el flujo end-to-end funciona correctamente:
 * 1. Usuario selecciona rango de fechas
 * 2. Sistema carga datos desde Firestore
 * 3. Sistema calcula métricas
 * 4. Sistema renderiza gráficos
 * 5. Usuario exporta a Excel
 */

import { getSalesReport } from '@/lib/reports/salesReports';
import { exportSalesReportToExcel } from '@/lib/export/excelExporter';
import { getDocs } from 'firebase/firestore';
import type { Sale } from '@/types/sale';

// Mocks
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
}));

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

// Mock de XLSX para exportación
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    json_to_sheet: jest.fn(() => ({})),
    aoa_to_sheet: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn(() => new ArrayBuffer(0)),
}));

// Mock de DOM APIs
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

describe('Flujo de integración: Reporte de ventas completo', () => {
  const mockStoreId = 'store-123';
  const mockDateRange = {
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-08-07'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock para createElement y click
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

  describe('Flujo completo: Carga → Cálculo → Visualización → Exportación', () => {
    it('debe completar el flujo end-to-end correctamente', async () => {
      // PASO 1: Setup - Datos de prueba realistas
      const mockSales: Sale[] = [
        {
          id: 'sale-1',
          storeId: mockStoreId,
          total: 150.0,
          paymentMethod: 'cash',
          items: [
            {
              productId: 'prod-A',
              productName: 'Laptop HP',
              quantity: 1,
              price: 150.0,
            },
          ],
          createdAt: new Date('2026-08-05T10:30:00'),
          status: 'completed',
        },
        {
          id: 'sale-2',
          storeId: mockStoreId,
          total: 85.5,
          paymentMethod: 'card',
          items: [
            {
              productId: 'prod-B',
              productName: 'Mouse Logitech',
              quantity: 3,
              price: 28.5,
            },
          ],
          createdAt: new Date('2026-08-06T14:15:00'),
          status: 'completed',
        },
        {
          id: 'sale-3',
          storeId: mockStoreId,
          total: 200.0,
          paymentMethod: 'cash',
          items: [
            {
              productId: 'prod-A',
              productName: 'Laptop HP',
              quantity: 1,
              price: 150.0,
            },
            {
              productId: 'prod-C',
              productName: 'Teclado Mecánico',
              quantity: 1,
              price: 50.0,
            },
          ],
          createdAt: new Date('2026-08-07T16:45:00'),
          status: 'completed',
        },
      ] as Sale[];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSales.map((sale) => ({
          id: sale.id,
          data: () => ({
            ...sale,
            createdAt: { toDate: () => sale.createdAt },
          }),
        })),
      });

      // PASO 2: Cargar reporte
      const reportData = await getSalesReport(mockStoreId, mockDateRange);

      // PASO 3: Validar cálculos
      expect(reportData.totalSales).toBe(435.5); // 150 + 85.50 + 200
      expect(reportData.totalTransactions).toBe(3);
      expect(reportData.averageTicket).toBeCloseTo(145.17, 2); // 435.50 / 3

      // PASO 4: Validar top producto
      expect(reportData.topProduct?.name).toBe('Laptop HP');
      expect(reportData.topProduct?.quantity).toBe(2); // Vendido 2 veces

      // PASO 5: Validar ventas por día
      expect(reportData.salesByDay).toHaveLength(7); // 7 días en el rango

      const day5 = reportData.salesByDay.find((d) => d.date.includes('05'));
      expect(day5?.total).toBe(150.0);
      expect(day5?.transactions).toBe(1);

      // PASO 6: Validar ventas por método de pago
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

      // PASO 7: Validar ventas por hora
      const hour10 = reportData.salesByHour.find((h) => h.hour === 10);
      expect(hour10?.total).toBe(150.0);

      const hour14 = reportData.salesByHour.find((h) => h.hour === 14);
      expect(hour14?.total).toBe(85.5);

      const hour16 = reportData.salesByHour.find((h) => h.hour === 16);
      expect(hour16?.total).toBe(200.0);

      // PASO 8: Exportar a Excel
      await exportSalesReportToExcel(reportData, mockDateRange);

      // PASO 9: Validar exportación
      expect(global.URL.createObjectURL).toHaveBeenCalled();

      // Validar que se creó el link de descarga
      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('Flujo con datos vacíos', () => {
    it('debe manejar correctamente cuando no hay ventas en el rango', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
      });

      const reportData = await getSalesReport(mockStoreId, mockDateRange);

      expect(reportData.totalSales).toBe(0);
      expect(reportData.totalTransactions).toBe(0);
      expect(reportData.averageTicket).toBe(0);
      expect(reportData.topProduct).toBeNull();

      // Debe tener todos los días con 0 ventas
      expect(reportData.salesByDay).toHaveLength(7);
      reportData.salesByDay.forEach((day) => {
        expect(day.total).toBe(0);
        expect(day.transactions).toBe(0);
      });

      // Exportación debe funcionar aunque no haya datos
      await expect(
        exportSalesReportToExcel(reportData, mockDateRange)
      ).resolves.not.toThrow();
    });
  });

  describe('Flujo con volumen alto de datos', () => {
    it('DOCUMENTA: debe manejar 1000 ventas (performance test)', async () => {
      // BUG-001: Sin límite en query, esto sería LENTO en producción

      const largeSalesData: Sale[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `sale-${i}`,
        storeId: mockStoreId,
        total: 100 + i,
        paymentMethod: i % 2 === 0 ? 'cash' : 'card',
        items: [
          {
            productId: `prod-${i % 10}`,
            productName: `Producto ${i % 10}`,
            quantity: 1,
            price: 100 + i,
          },
        ],
        createdAt: new Date('2026-08-05T10:00:00'),
        status: 'completed',
      })) as Sale[];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: largeSalesData.map((sale) => ({
          id: sale.id,
          data: () => ({
            ...sale,
            createdAt: { toDate: () => sale.createdAt },
          }),
        })),
      });

      const startTime = Date.now();
      const reportData = await getSalesReport(mockStoreId, mockDateRange);
      const endTime = Date.now();

      const executionTime = endTime - startTime;

      console.log(`Execution time for 1000 sales: ${executionTime}ms`);

      // Debe completar en tiempo razonable
      // expect(executionTime).toBeLessThan(1000); // < 1 segundo

      expect(reportData.totalTransactions).toBe(1000);
    });
  });

  describe('BUG-001: Performance con muchas ventas', () => {
    it('DOCUMENTA: sin limit() la query puede traer 100k documentos', async () => {
      // Este test documenta el bug crítico BUG-001
      // En producción real, sin limit() la query puede traer TODOS los documentos
      // de ventas del store, causando:
      // 1. Timeouts de Firestore
      // 2. Consumo excesivo de bandwidth
      // 3. Crasheo de la app
      // 4. Experiencia de usuario terrible (30+ segundos de carga)
      // SOLUCIÓN: Agregar limit(5000) a la query
      // Ver BUG-001 en el reporte de QA
    });
  });
});
