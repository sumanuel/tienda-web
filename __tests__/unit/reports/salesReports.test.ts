/**
 * Tests unitarios para lib/reports/salesReports.ts
 *
 * Objetivo: Validar que todos los cálculos matemáticos sean correctos
 * y que se manejen correctamente los edge cases.
 */

import { getSalesReport } from '@/lib/reports/salesReports';
import { getDocs } from 'firebase/firestore';
import type { Sale } from '@/types/sale';

// Mock de Firestore
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

describe('salesReports.ts - getSalesReport()', () => {
  const mockStoreId = 'store-123';
  const mockDateRange = {
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-08-07'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cálculos básicos', () => {
    it('debe calcular totalSales correctamente', async () => {
      const mockSales: Sale[] = [
        {
          id: '1',
          storeId: mockStoreId,
          total: 100,
          paymentMethod: 'cash',
          items: [],
          createdAt: new Date('2026-08-05'),
          status: 'completed',
        },
        {
          id: '2',
          storeId: mockStoreId,
          total: 250.5,
          paymentMethod: 'card',
          items: [],
          createdAt: new Date('2026-08-06'),
          status: 'completed',
        },
        {
          id: '3',
          storeId: mockStoreId,
          total: 75.25,
          paymentMethod: 'cash',
          items: [],
          createdAt: new Date('2026-08-07'),
          status: 'completed',
        },
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSales.map((sale) => ({
          id: sale.id,
          data: () => ({
            ...sale,
            createdAt: { toDate: () => sale.createdAt },
          }),
        })),
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      expect(result.totalSales).toBe(425.75);
    });

    it('debe calcular totalTransactions correctamente', async () => {
      const mockSales: Sale[] = [
        { id: '1', total: 100, items: [], createdAt: new Date() } as Sale,
        { id: '2', total: 200, items: [], createdAt: new Date() } as Sale,
        { id: '3', total: 300, items: [], createdAt: new Date() } as Sale,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSales.map((sale) => ({
          id: sale.id,
          data: () => ({
            ...sale,
            createdAt: { toDate: () => sale.createdAt },
          }),
        })),
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      expect(result.totalTransactions).toBe(3);
    });

    it('debe calcular averageTicket correctamente', async () => {
      const mockSales: Sale[] = [
        { id: '1', total: 100, items: [], createdAt: new Date() } as Sale,
        { id: '2', total: 200, items: [], createdAt: new Date() } as Sale,
        { id: '3', total: 300, items: [], createdAt: new Date() } as Sale,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSales.map((sale) => ({
          id: sale.id,
          data: () => ({
            ...sale,
            createdAt: { toDate: () => sale.createdAt },
          }),
        })),
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      expect(result.averageTicket).toBe(200); // (100 + 200 + 300) / 3
    });
  });

  describe('Edge cases', () => {
    it('debe manejar ventas vacías (0 transacciones)', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      expect(result.totalSales).toBe(0);
      expect(result.totalTransactions).toBe(0);
      expect(result.averageTicket).toBe(0); // División por cero manejada
      expect(result.topProduct).toBeNull();
    });

    it('debe manejar división por cero en averageTicket', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      expect(result.averageTicket).toBe(0);
      expect(isNaN(result.averageTicket)).toBe(false);
    });

    it('debe manejar ventas con total = 0', async () => {
      const mockSales: Sale[] = [
        { id: '1', total: 0, items: [], createdAt: new Date() } as Sale,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSales.map((sale) => ({
          id: sale.id,
          data: () => ({
            ...sale,
            createdAt: { toDate: () => sale.createdAt },
          }),
        })),
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      expect(result.totalSales).toBe(0);
      expect(result.totalTransactions).toBe(1);
      expect(result.averageTicket).toBe(0);
    });
  });

  describe('Ventas por día', () => {
    it('debe incluir TODOS los días del rango incluso sin ventas', async () => {
      // Solo 1 venta el 2026-08-05
      const mockSales: Sale[] = [
        {
          id: '1',
          total: 100,
          items: [],
          createdAt: new Date('2026-08-05T10:00:00'),
        } as Sale,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSales.map((sale) => ({
          id: sale.id,
          data: () => ({
            ...sale,
            createdAt: { toDate: () => sale.createdAt },
          }),
        })),
      });

      const dateRange = {
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-07'),
      };

      const result = await getSalesReport(mockStoreId, dateRange);

      // Debe tener 7 días (01-07 agosto)
      expect(result.salesByDay).toHaveLength(7);

      // Día con venta
      const dayWithSale = result.salesByDay.find((d) => d.date.includes('05'));
      expect(dayWithSale?.total).toBe(100);
      expect(dayWithSale?.transactions).toBe(1);

      // Días sin ventas deben tener total = 0
      const daysWithoutSales = result.salesByDay.filter(
        (d) => !d.date.includes('05')
      );
      daysWithoutSales.forEach((day) => {
        expect(day.total).toBe(0);
        expect(day.transactions).toBe(0);
      });
    });
  });

  describe('Top producto', () => {
    it('debe identificar el producto más vendido por cantidad', async () => {
      const mockSales: Sale[] = [
        {
          id: '1',
          total: 100,
          items: [
            {
              productId: 'prod-A',
              productName: 'Producto A',
              quantity: 10,
              price: 5,
            },
          ],
          createdAt: new Date(),
        } as Sale,
        {
          id: '2',
          total: 200,
          items: [
            {
              productId: 'prod-B',
              productName: 'Producto B',
              quantity: 5,
              price: 20,
            },
          ],
          createdAt: new Date(),
        } as Sale,
        {
          id: '3',
          total: 150,
          items: [
            {
              productId: 'prod-A',
              productName: 'Producto A',
              quantity: 20,
              price: 5,
            },
          ],
          createdAt: new Date(),
        } as Sale,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSales.map((sale) => ({
          id: sale.id,
          data: () => ({
            ...sale,
            createdAt: { toDate: () => sale.createdAt },
          }),
        })),
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      // Producto A vendió 10 + 20 = 30 unidades
      // Producto B vendió 5 unidades
      expect(result.topProduct?.id).toBe('prod-A');
      expect(result.topProduct?.name).toBe('Producto A');
      expect(result.topProduct?.quantity).toBe(30);
      expect(result.topProduct?.total).toBe(250); // (10*5) + (20*5)
    });

    it('debe retornar null cuando no hay productos vendidos', async () => {
      const mockSales: Sale[] = [
        {
          id: '1',
          total: 0,
          items: [],
          createdAt: new Date(),
        } as Sale,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSales.map((sale) => ({
          id: sale.id,
          data: () => ({
            ...sale,
            createdAt: { toDate: () => sale.createdAt },
          }),
        })),
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      expect(result.topProduct).toBeNull();
    });
  });

  describe('Ventas por método de pago', () => {
    it('debe agregar correctamente por método de pago', async () => {
      const mockSales: Sale[] = [
        {
          id: '1',
          total: 100,
          paymentMethod: 'cash',
          items: [],
          createdAt: new Date(),
        } as Sale,
        {
          id: '2',
          total: 200,
          paymentMethod: 'cash',
          items: [],
          createdAt: new Date(),
        } as Sale,
        {
          id: '3',
          total: 150,
          paymentMethod: 'card',
          items: [],
          createdAt: new Date(),
        } as Sale,
        {
          id: '4',
          total: 75,
          paymentMethod: 'transfer',
          items: [],
          createdAt: new Date(),
        } as Sale,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSales.map((sale) => ({
          id: sale.id,
          data: () => ({
            ...sale,
            createdAt: { toDate: () => sale.createdAt },
          }),
        })),
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      const cashSales = result.salesByPaymentMethod.find(
        (pm) => pm.method === 'cash'
      );
      expect(cashSales?.total).toBe(300); // 100 + 200
      expect(cashSales?.transactions).toBe(2);

      const cardSales = result.salesByPaymentMethod.find(
        (pm) => pm.method === 'card'
      );
      expect(cardSales?.total).toBe(150);
      expect(cardSales?.transactions).toBe(1);

      const transferSales = result.salesByPaymentMethod.find(
        (pm) => pm.method === 'transfer'
      );
      expect(transferSales?.total).toBe(75);
      expect(transferSales?.transactions).toBe(1);
    });
  });

  describe('Ventas por hora', () => {
    it('debe extraer la hora correctamente y filtrar horas sin ventas', async () => {
      const mockSales: Sale[] = [
        {
          id: '1',
          total: 100,
          items: [],
          createdAt: new Date('2026-08-05T09:30:00'), // 9 AM
        } as Sale,
        {
          id: '2',
          total: 200,
          items: [],
          createdAt: new Date('2026-08-05T09:45:00'), // 9 AM
        } as Sale,
        {
          id: '3',
          total: 150,
          items: [],
          createdAt: new Date('2026-08-05T14:20:00'), // 2 PM
        } as Sale,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSales.map((sale) => ({
          id: sale.id,
          data: () => ({
            ...sale,
            createdAt: { toDate: () => sale.createdAt },
          }),
        })),
      });

      const result = await getSalesReport(mockStoreId, mockDateRange);

      // Solo debe retornar horas con transacciones
      expect(result.salesByHour).toHaveLength(2); // Hora 9 y hora 14

      const hour9 = result.salesByHour.find((h) => h.hour === 9);
      expect(hour9?.total).toBe(300); // 100 + 200
      expect(hour9?.transactions).toBe(2);

      const hour14 = result.salesByHour.find((h) => h.hour === 14);
      expect(hour14?.total).toBe(150);
      expect(hour14?.transactions).toBe(1);
    });
  });

  describe('Validaciones', () => {
    it('debe manejar ventas sin createdAt (no debe crashear)', async () => {
      const mockSales = [
        {
          id: '1',
          total: 100,
          items: [],
          // createdAt: undefined
        },
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSales.map((sale) => ({
          id: sale.id,
          data: () => ({
            ...sale,
            createdAt: null, // Venta sin fecha
          }),
        })),
      });

      // BUG-003: Esto DEBERÍA crashear actualmente
      // Después de la corrección, NO debería crashear
      await expect(
        getSalesReport(mockStoreId, mockDateRange)
      ).rejects.toThrow();
    });
  });
});
