/**
 * Tests unitarios para lib/reports/inventoryReports.ts
 *
 * Objetivo: Validar cálculos de valorización, stock y categorías
 */

import { getInventoryReport } from '@/lib/reports/inventoryReports';
import { getDocs } from 'firebase/firestore';
import type { Product } from '@/types/product';

// Mock de Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

describe('inventoryReports.ts - getInventoryReport()', () => {
  const mockStoreId = 'store-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Valor total', () => {
    it('debe calcular totalValue correctamente (cost * stock)', async () => {
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Producto A',
          stock: 10,
          cost: 50,
          price: 100,
        } as Product,
        {
          id: '2',
          name: 'Producto B',
          stock: 5,
          cost: 30,
          price: 60,
        } as Product,
        {
          id: '3',
          name: 'Producto C',
          stock: 20,
          cost: 10,
          price: 20,
        } as Product,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockProducts.map((product) => ({
          id: product.id,
          data: () => product,
        })),
      });

      const result = await getInventoryReport(mockStoreId);

      // (10*50) + (5*30) + (20*10) = 500 + 150 + 200 = 850
      expect(result.totalValue).toBe(850);
    });

    it('debe manejar cost = null/undefined como 0', async () => {
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Producto A',
          stock: 10,
          cost: null as any,
          price: 100,
        } as Product,
        {
          id: '2',
          name: 'Producto B',
          stock: 5,
          cost: undefined,
          price: 60,
        } as Product,
        {
          id: '3',
          name: 'Producto C',
          stock: 20,
          cost: 10,
          price: 20,
        } as Product,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockProducts.map((product) => ({
          id: product.id,
          data: () => product,
        })),
      });

      const result = await getInventoryReport(mockStoreId);

      // Solo Producto C contribuye: 20*10 = 200
      expect(result.totalValue).toBe(200);
    });

    it('debe manejar inventario vacío', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
      });

      const result = await getInventoryReport(mockStoreId);

      expect(result.totalValue).toBe(0);
      expect(result.totalProducts).toBe(0);
    });
  });

  describe('Contadores de stock', () => {
    it('debe contar lowStockProducts correctamente (< 10 && >= 5)', async () => {
      const mockProducts: Product[] = [
        { id: '1', stock: 9 } as Product, // Low stock
        { id: '2', stock: 5 } as Product, // Low stock
        { id: '3', stock: 10 } as Product, // Normal
        { id: '4', stock: 4 } as Product, // Out of stock
        { id: '5', stock: 7 } as Product, // Low stock
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockProducts.map((product) => ({
          id: product.id,
          data: () => product,
        })),
      });

      const result = await getInventoryReport(mockStoreId);

      expect(result.lowStockProducts).toBe(3); // 9, 5, 7
    });

    it('debe contar outOfStockProducts correctamente (< 5)', async () => {
      const mockProducts: Product[] = [
        { id: '1', stock: 4 } as Product, // Out of stock
        { id: '2', stock: 0 } as Product, // Out of stock
        { id: '3', stock: 5 } as Product, // Low (NOT out)
        { id: '4', stock: 2 } as Product, // Out of stock
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockProducts.map((product) => ({
          id: product.id,
          data: () => product,
        })),
      });

      const result = await getInventoryReport(mockStoreId);

      expect(result.outOfStockProducts).toBe(3); // 4, 0, 2
    });

    it('debe contar totalProducts correctamente', async () => {
      const mockProducts: Product[] = [
        { id: '1' } as Product,
        { id: '2' } as Product,
        { id: '3' } as Product,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockProducts.map((product) => ({
          id: product.id,
          data: () => product,
        })),
      });

      const result = await getInventoryReport(mockStoreId);

      expect(result.totalProducts).toBe(3);
    });
  });

  describe('Valor por categoría', () => {
    it('debe agrupar valor por categoría correctamente', async () => {
      const mockProducts: Product[] = [
        {
          id: '1',
          category: 'Electrónica',
          stock: 10,
          cost: 100,
        } as Product,
        {
          id: '2',
          category: 'Electrónica',
          stock: 5,
          cost: 200,
        } as Product,
        {
          id: '3',
          category: 'Ropa',
          stock: 20,
          cost: 30,
        } as Product,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockProducts.map((product) => ({
          id: product.id,
          data: () => product,
        })),
      });

      const result = await getInventoryReport(mockStoreId);

      const electronica = result.valueByCategory.find(
        (c) => c.category === 'Electrónica'
      );
      // (10*100) + (5*200) = 1000 + 1000 = 2000
      expect(electronica?.value).toBe(2000);
      expect(electronica?.quantity).toBe(15); // 10 + 5

      const ropa = result.valueByCategory.find((c) => c.category === 'Ropa');
      // 20*30 = 600
      expect(ropa?.value).toBe(600);
      expect(ropa?.quantity).toBe(20);
    });

    it('debe manejar productos sin categoría', async () => {
      const mockProducts: Product[] = [
        {
          id: '1',
          category: undefined,
          stock: 10,
          cost: 50,
        } as Product,
        {
          id: '2',
          category: null as any,
          stock: 5,
          cost: 30,
        } as Product,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockProducts.map((product) => ({
          id: product.id,
          data: () => product,
        })),
      });

      const result = await getInventoryReport(mockStoreId);

      const sinCategoria = result.valueByCategory.find(
        (c) => c.category === 'Sin Categoría'
      );

      expect(sinCategoria).toBeDefined();
      expect(sinCategoria?.value).toBe(650); // (10*50) + (5*30)
      expect(sinCategoria?.quantity).toBe(15);
    });

    it('debe ordenar por valor descendente', async () => {
      const mockProducts: Product[] = [
        { id: '1', category: 'A', stock: 10, cost: 10 } as Product, // 100
        { id: '2', category: 'B', stock: 10, cost: 50 } as Product, // 500
        { id: '3', category: 'C', stock: 10, cost: 30 } as Product, // 300
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockProducts.map((product) => ({
          id: product.id,
          data: () => product,
        })),
      });

      const result = await getInventoryReport(mockStoreId);

      expect(result.valueByCategory[0].category).toBe('B'); // Mayor valor
      expect(result.valueByCategory[1].category).toBe('C');
      expect(result.valueByCategory[2].category).toBe('A'); // Menor valor
    });
  });

  describe('Distribución de stock', () => {
    it('debe calcular distribución por categoría', async () => {
      const mockProducts: Product[] = [
        { id: '1', category: 'Electrónica', stock: 10 } as Product,
        { id: '2', category: 'Electrónica', stock: 5 } as Product,
        { id: '3', category: 'Ropa', stock: 20 } as Product,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockProducts.map((product) => ({
          id: product.id,
          data: () => product,
        })),
      });

      const result = await getInventoryReport(mockStoreId);

      const electronica = result.stockDistribution.find(
        (c) => c.category === 'Electrónica'
      );
      expect(electronica?.count).toBe(15); // 10 + 5

      const ropa = result.stockDistribution.find((c) => c.category === 'Ropa');
      expect(ropa?.count).toBe(20);
    });

    it('debe ordenar por cantidad descendente', async () => {
      const mockProducts: Product[] = [
        { id: '1', category: 'A', stock: 10 } as Product,
        { id: '2', category: 'B', stock: 50 } as Product,
        { id: '3', category: 'C', stock: 30 } as Product,
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockProducts.map((product) => ({
          id: product.id,
          data: () => product,
        })),
      });

      const result = await getInventoryReport(mockStoreId);

      expect(result.stockDistribution[0].category).toBe('B'); // Mayor stock
      expect(result.stockDistribution[1].category).toBe('C');
      expect(result.stockDistribution[2].category).toBe('A');
    });
  });

  describe('TODOs sin implementar', () => {
    it('inventoryTurnover debe ser 0 (TODO)', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
      });

      const result = await getInventoryReport(mockStoreId);

      expect(result.inventoryTurnover).toBe(0);
    });

    it('recentMovements debe ser array vacío (TODO)', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
      });

      const result = await getInventoryReport(mockStoreId);

      expect(result.recentMovements).toEqual([]);
    });

    it('topRotation debe ser array vacío (TODO)', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
      });

      const result = await getInventoryReport(mockStoreId);

      expect(result.topRotation).toEqual([]);
    });
  });
});
