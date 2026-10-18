/**
 * Tests unitarios para lib/dashboard.ts y lib/salesStats.ts
 *
 * Los dos servicios son delgados: arman la petición al backend (que calcula
 * todo en USD) y devuelven la respuesta tal cual.
 */

import { getDashboardSummary } from '@/lib/dashboard';
import { getSalesStats } from '@/lib/salesStats';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api', () => ({ apiClient: { get: jest.fn() } }));

const mockGet = apiClient.get as jest.Mock;

describe('lib/dashboard.ts - getDashboardSummary()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pide el resumen de la tienda', async () => {
    mockGet.mockResolvedValue({ products: 4 });

    await getDashboardSummary('store-123');

    expect(mockGet).toHaveBeenCalledWith(
      '/api/reports/dashboard?storeId=store-123'
    );
  });

  it('codifica el id de la tienda en la URL', async () => {
    mockGet.mockResolvedValue({});

    await getDashboardSummary('a b&c=d');

    expect(mockGet).toHaveBeenCalledWith(
      '/api/reports/dashboard?storeId=a%20b%26c%3Dd'
    );
  });

  it('devuelve la respuesta del servidor sin modificarla', async () => {
    const summary = {
      today: { totalUsd: 1, count: 1 },
      month: { totalUsd: 4, count: 3 },
      previousMonth: { totalUsd: 0, count: 0 },
      products: 4,
      customers: 1,
      byDay: [{ date: '2026-10-18', totalUsd: 1, count: 1 }],
    };
    mockGet.mockResolvedValue(summary);

    await expect(getDashboardSummary('store-123')).resolves.toBe(summary);
  });

  it('propaga el error si el servidor falla', async () => {
    mockGet.mockRejectedValue(new Error('500'));

    await expect(getDashboardSummary('store-123')).rejects.toThrow('500');
  });
});

describe('lib/salesStats.ts - getSalesStats()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ salesCount: 0 });
  });

  const queryOf = () => {
    const url = mockGet.mock.calls[0][0] as string;
    expect(url.startsWith('/api/sales/stats/summary?')).toBe(true);
    return new URLSearchParams(url.split('?')[1]);
  };

  it('envía la tienda y los filtros indicados', async () => {
    await getSalesStats({
      storeId: 'store-123',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      paymentMethod: 'card',
      customerId: 'cliente-1',
    });

    const params = queryOf();
    expect(params.get('storeId')).toBe('store-123');
    expect(params.get('startDate')).toBe('2026-10-01');
    expect(params.get('endDate')).toBe('2026-10-31');
    expect(params.get('paymentMethod')).toBe('card');
    expect(params.get('customerId')).toBe('cliente-1');
  });

  it('omite los filtros vacíos o sin definir', async () => {
    await getSalesStats({
      storeId: 'store-123',
      startDate: '',
      paymentMethod: undefined,
      customerId: '',
    });

    const params = queryOf();
    expect([...params.keys()]).toEqual(['storeId']);
  });

  it('devuelve las estadísticas del servidor', async () => {
    const stats = {
      totalRevenue: 4,
      totalTax: 0,
      averageSale: 1.33,
      salesCount: 3,
      salesByPaymentMethod: [],
      unconvertedSales: 0,
    };
    mockGet.mockResolvedValue(stats);

    await expect(getSalesStats({ storeId: 'store-123' })).resolves.toBe(stats);
  });

  it('propaga el error si el servidor falla', async () => {
    mockGet.mockRejectedValue(new Error('403'));

    await expect(getSalesStats({ storeId: 'store-123' })).rejects.toThrow(
      '403'
    );
  });
});
