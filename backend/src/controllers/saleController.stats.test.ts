import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../config/prisma';
import { getSalesStats } from './saleController';
import {
  mockReq,
  mockRes,
  restoreStubs,
  silenceConsoleError,
  stubPrisma,
} from '../test/http';

const stubStore = (found = true) =>
  stubPrisma(prisma.store, 'findFirst', async () =>
    found ? { id: 'store-1' } : null
  );

const sale = (overrides: Record<string, unknown> = {}) => ({
  total: 854.1,
  tax: 0,
  totalReference: 1,
  exchangeRate: 854.1,
  paymentMethod: 'cash',
  ...overrides,
});

afterEach(() => restoreStubs());

describe('getSalesStats (GET /api/sales/stats/summary)', () => {
  it('401 sin sesión', async () => {
    const res = mockRes();

    await getSalesStats(mockReq({ storeId: 'store-1' }, null), res);

    assert.equal(res.statusCode, 401);
  });

  it('403 si la tienda no pertenece al usuario, sin consultar ventas', async () => {
    stubStore(false);
    const sales = stubPrisma(prisma.sale, 'findMany', async () => []);
    const res = mockRes();

    await getSalesStats(mockReq({ storeId: 'store-ajena' }), res);

    assert.equal(res.statusCode, 403);
    assert.equal(sales.mock.callCount(), 0);
  });

  it('solo cuenta ventas completadas de tiendas del usuario', async () => {
    stubStore();
    const sales = stubPrisma(prisma.sale, 'findMany', async () => []);
    const res = mockRes();

    await getSalesStats(mockReq({ storeId: 'store-1' }), res);

    const where = sales.mock.calls[0].arguments[0].where;
    assert.equal(where.status, 'completed');
    assert.equal(where.storeId, 'store-1');
    assert.deepEqual(where.store, { userId: 'user-1' });
  });

  it('aplica las fechas, el método de pago y el cliente del historial', async () => {
    stubStore();
    const sales = stubPrisma(prisma.sale, 'findMany', async () => []);
    const res = mockRes();

    await getSalesStats(
      mockReq({
        storeId: 'store-1',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        paymentMethod: 'card',
        customerId: 'cliente-1',
      }),
      res
    );

    const where = sales.mock.calls[0].arguments[0].where;
    assert.equal(where.paymentMethod, 'card');
    assert.equal(where.customerId, 'cliente-1');
    assert.deepEqual(where.createdAt.gte, new Date(2026, 9, 1));
    assert.deepEqual(
      where.createdAt.lte,
      new Date(2026, 9, 31, 23, 59, 59, 999)
    );
  });

  it('sin filtros opcionales no agrega condiciones de más', async () => {
    stubStore();
    const sales = stubPrisma(prisma.sale, 'findMany', async () => []);
    const res = mockRes();

    await getSalesStats(mockReq({ storeId: 'store-1' }), res);

    const where = sales.mock.calls[0].arguments[0].where;
    assert.equal('paymentMethod' in where, false);
    assert.equal('customerId' in where, false);
    assert.equal('createdAt' in where, false);
  });

  it('responde los totales en USD, no el total en VES de las ventas', async () => {
    stubStore();
    stubPrisma(prisma.sale, 'findMany', async () => [
      sale(),
      sale({ total: 2562.3, totalReference: 3, paymentMethod: 'card' }),
    ]);
    const res = mockRes();

    await getSalesStats(mockReq({ storeId: 'store-1' }), res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.totalRevenue, 4);
    assert.equal(res.body.averageSale, 2);
    assert.equal(res.body.salesCount, 2);
    assert.deepEqual(res.body.salesByPaymentMethod, [
      { paymentMethod: 'cash', count: 1, total: 1 },
      { paymentMethod: 'card', count: 1, total: 3 },
    ]);
  });

  it('informa las ventas sin conversión posible', async () => {
    stubStore();
    stubPrisma(prisma.sale, 'findMany', async () => [
      sale({ total: 1.15, totalReference: null, exchangeRate: 0 }),
    ]);
    const res = mockRes();

    await getSalesStats(mockReq({ storeId: 'store-1' }), res);

    assert.equal(res.body.unconvertedSales, 1);
    assert.equal(res.body.totalRevenue, 0);
  });

  it('500 con mensaje genérico si la base de datos falla', async () => {
    stubStore();
    silenceConsoleError();
    stubPrisma(prisma.sale, 'findMany', async () => {
      throw new Error('conexión caída');
    });
    const res = mockRes();

    await getSalesStats(mockReq({ storeId: 'store-1' }), res);

    assert.equal(res.statusCode, 500);
    assert.doesNotMatch(JSON.stringify(res.body), /conexión caída/);
  });
});
