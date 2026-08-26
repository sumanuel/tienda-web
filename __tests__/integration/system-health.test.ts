/**
 * Suite de pruebas de integración para identificar problemas en el sistema
 * Ejecutar con: npx jest __tests__/integration/system-health.test.ts
 */

import { apiClient } from '@/lib/api';

describe('System Health Tests', () => {
  describe('1. Backend Connectivity', () => {
    it('should connect to backend health endpoint', async () => {
      const response = await fetch('http://localhost:4000/health');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('ok');
    });
  });

  describe('2. API Client Configuration', () => {
    it('should have correct base URL configured', () => {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      expect(baseUrl).toBe('http://localhost:4000');
    });

    it('should handle authentication flow', async () => {
      // Este test debería fallar si no hay token
      try {
        await apiClient.get('/api/products');
        // Si llegamos aquí, el token está configurado
        expect(true).toBe(true);
      } catch (error: any) {
        // Esperamos un error 401 si no hay token
        expect(error.message).toContain('401');
      }
    });
  });

  describe('3. Library Functions', () => {
    it('should export calculateInventoryValuation from lib/inventory', async () => {
      const { calculateInventoryValuation } = await import('@/lib/inventory');
      expect(typeof calculateInventoryValuation).toBe('function');
    });

    it('should export getReceivablesSummary from lib/accountsReceivable', async () => {
      const { getReceivablesSummary } =
        await import('@/lib/accountsReceivable');
      expect(typeof getReceivablesSummary).toBe('function');
    });

    it('should export getPayablesSummary from lib/accountsReceivable', async () => {
      const { getPayablesSummary } = await import('@/lib/accountsReceivable');
      expect(typeof getPayablesSummary).toBe('function');
    });

    it('should export getCustomersWithBalance from lib/customers', async () => {
      const { getCustomersWithBalance } = await import('@/lib/customers');
      expect(typeof getCustomersWithBalance).toBe('function');
    });

    it('should export getSuppliersWithBalance from lib/suppliers', async () => {
      const { getSuppliersWithBalance } = await import('@/lib/suppliers');
      expect(typeof getSuppliersWithBalance).toBe('function');
    });
  });

  describe('4. Hooks Integration', () => {
    it('useCart should be importable', async () => {
      const { useCart } = await import('@/hooks/useCart');
      expect(typeof useCart).toBe('function');
    });

    it('useSales should be importable', async () => {
      const { useSales } = await import('@/hooks/useSales');
      expect(typeof useSales).toBe('function');
    });

    it('useAuth should be importable', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      expect(typeof useAuth).toBe('function');
    });
  });

  describe('5. UI Components', () => {
    const requiredUIComponents = [
      'alert',
      'badge',
      'button',
      'card',
      'dialog',
      'input',
      'label',
      'scroll-area',
      'select',
      'separator',
      'table',
      'textarea',
    ];

    requiredUIComponents.forEach((component) => {
      it(`should have ${component} UI component`, async () => {
        try {
          await import(`@/components/ui/${component}`);
          expect(true).toBe(true);
        } catch (error) {
          fail(`Missing UI component: ${component}`);
        }
      });
    });
  });

  describe('6. Sales Components', () => {
    const salesComponents = [
      'Cart',
      'CancelSaleButton',
      'CustomerSelector',
      'PaymentMethodSelector',
      'ProductCard',
      'ProductCatalog',
      'SaleDetailModal',
      'SalesFilters',
      'SalesTable',
    ];

    salesComponents.forEach((component) => {
      it(`should have ${component} sales component`, async () => {
        try {
          await import(`@/components/sales/${component}`);
          expect(true).toBe(true);
        } catch (error) {
          fail(`Missing sales component: ${component}`);
        }
      });
    });
  });
});
