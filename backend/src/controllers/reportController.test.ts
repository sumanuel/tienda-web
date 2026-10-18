import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../config/prisma';
import {
  getDashboardSummary,
  getFinancialReport,
  getSalesReport,
} from './reportController';
import {
  mockReq,
  mockRes,
  restoreStubs,
  silenceConsoleError,
  stubPrisma,
} from '../test/http';

const periodQuery = {
  storeId: 'store-1',
  startDate: '2026-08-01',
  endDate: '2026-10-31',
};

const stubStore = (found = true) =>
  stubPrisma(prisma.store, 'findFirst', async () =>
    found ? { id: 'store-1' } : null
  );

afterEach(() => restoreStubs());

// Comportamiento común de los dos reportes con período
for (const [name, handler] of [
  ['getFinancialReport', getFinancialReport],
  ['getSalesReport', getSalesReport],
] as const) {
  describe(`${name}: validaciones`, () => {
    it('401 sin sesión, sin consultar la base de datos', async () => {
      const store = stubStore();
      const res = mockRes();

      await handler(mockReq(periodQuery, null), res);

      assert.equal(res.statusCode, 401);
      assert.equal(store.mock.callCount(), 0);
    });

    it('400 si falta el período', async () => {
      const store = stubStore();
      const res = mockRes();

      await handler(mockReq({ storeId: 'store-1' }), res);

      assert.equal(res.statusCode, 400);
      assert.equal(store.mock.callCount(), 0);
    });

    it('400 si falta la tienda', async () => {
      const res = mockRes();

      await handler(
        mockReq({ startDate: '2026-01-01', endDate: '2026-01-31' }),
        res
      );

      assert.equal(res.statusCode, 400);
    });

    it('400 si una fecha es inválida', async () => {
      const res = mockRes();

      await handler(
        mockReq({ ...periodQuery, startDate: 'no-es-fecha' }),
        res
      );

      assert.equal(res.statusCode, 400);
    });

    it('400 si el inicio es posterior al fin', async () => {
      const res = mockRes();

      await handler(
        mockReq({
          ...periodQuery,
          startDate: '2026-10-31',
          endDate: '2026-10-01',
        }),
        res
      );

      assert.equal(res.statusCode, 400);
    });

    it('403 si la tienda no pertenece al usuario', async () => {
      const store = stubStore(false);
      const res = mockRes();

      await handler(mockReq(periodQuery), res);

      assert.equal(res.statusCode, 403);
      assert.deepEqual(store.mock.calls[0].arguments[0].where, {
        id: 'store-1',
        userId: 'user-1',
      });
    });

    it('500 con mensaje genérico si la base de datos falla', async () => {
      stubStore();
      silenceConsoleError();
      stubPrisma(prisma.sale, 'findMany', async () => {
        throw new Error('conexión caída');
      });
      stubPrisma(prisma.purchase, 'findMany', async () => []);
      stubPrisma(prisma.purchaseReturn, 'findMany', async () => []);
      const res = mockRes();

      await handler(mockReq(periodQuery), res);

      assert.equal(res.statusCode, 500);
      assert.doesNotMatch(JSON.stringify(res.body), /conexión caída/);
    });
  });
}

describe('getFinancialReport', () => {
  it('400 si el período supera 120 meses', async () => {
    stubStore();
    const sales = stubPrisma(prisma.sale, 'findMany', async () => []);
    const res = mockRes();

    await getFinancialReport(
      mockReq({ ...periodQuery, startDate: '2010-01-01' }),
      res
    );

    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /120 meses/);
    assert.equal(sales.mock.callCount(), 0);
  });

  it('consulta solo ventas, compras y devoluciones completadas de la tienda y el período', async () => {
    stubStore();
    const sales = stubPrisma(prisma.sale, 'findMany', async () => []);
    const purchases = stubPrisma(prisma.purchase, 'findMany', async () => []);
    const returns = stubPrisma(
      prisma.purchaseReturn,
      'findMany',
      async () => []
    );
    const res = mockRes();

    await getFinancialReport(mockReq(periodQuery), res);

    assert.equal(res.statusCode, 200);
    for (const stub of [sales, purchases, returns]) {
      const where = stub.mock.calls[0].arguments[0].where;
      assert.equal(where.storeId, 'store-1');
      assert.equal(where.status, 'completed');
      assert.deepEqual(where.createdAt.gte, new Date(2026, 7, 1));
      assert.deepEqual(
        where.createdAt.lte,
        new Date(2026, 9, 31, 23, 59, 59, 999)
      );
    }
  });

  it('responde ingresos, egresos y resultado mensual en USD', async () => {
    stubStore();
    stubPrisma(prisma.sale, 'findMany', async () => [
      {
        createdAt: new Date(2026, 9, 5, 10),
        total: 854.1,
        totalReference: 1,
        exchangeRate: 854.1,
        paymentMethod: 'cash',
      },
    ]);
    stubPrisma(prisma.purchase, 'findMany', async () => [
      {
        createdAt: new Date(2026, 9, 2, 10),
        total: 4200,
        totalReference: 4.2,
        exchangeRate: 1000,
      },
    ]);
    stubPrisma(prisma.purchaseReturn, 'findMany', async () => [
      {
        createdAt: new Date(2026, 9, 9, 10),
        total: 3100,
        totalReference: 3.1,
        exchangeRate: 1000,
      },
    ]);
    const res = mockRes();

    await getFinancialReport(mockReq(periodQuery), res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(
      res.body.months.map((m: any) => m.month),
      ['2026-08', '2026-09', '2026-10']
    );
    assert.deepEqual(res.body.totals, {
      revenueUsd: 1,
      expensesUsd: 1.1,
      profitUsd: -0.1,
    });
    assert.deepEqual(res.body.byPaymentMethod, [
      { method: 'cash', revenueUsd: 1, count: 1 },
    ]);
  });
});

describe('getSalesReport', () => {
  it('consulta las ventas completadas de la tienda con sus líneas', async () => {
    stubStore();
    const sales = stubPrisma(prisma.sale, 'findMany', async () => []);
    const res = mockRes();

    await getSalesReport(mockReq(periodQuery), res);

    assert.equal(res.statusCode, 200);
    const args = sales.mock.calls[0].arguments[0];
    assert.equal(args.where.storeId, 'store-1');
    assert.equal(args.where.status, 'completed');
    assert.ok(args.select.items);
    assert.deepEqual(res.body.summary, {
      totalUsd: 0,
      count: 0,
      averageUsd: 0,
    });
    assert.equal(res.body.topProduct, null);
  });

  it('responde los totales en USD y el producto más vendido', async () => {
    stubStore();
    stubPrisma(prisma.sale, 'findMany', async () => [
      {
        createdAt: new Date(2026, 9, 18, 9),
        total: 2562.3,
        totalReference: 3,
        exchangeRate: 854.1,
        paymentMethod: 'cash',
        items: [
          {
            productId: 'p1',
            productName: 'Harina Juana',
            quantity: 3,
            subtotal: 2562.3,
            subtotalLocal: 2562.3,
            subtotalReference: 3,
          },
        ],
      },
    ]);
    const res = mockRes();

    await getSalesReport(mockReq(periodQuery), res);

    assert.deepEqual(res.body.summary, {
      totalUsd: 3,
      count: 1,
      averageUsd: 3,
    });
    assert.equal(res.body.topProduct.productName, 'Harina Juana');
    assert.equal(res.body.topProduct.quantity, 3);
  });
});

describe('getDashboardSummary', () => {
  const stubCounts = () => {
    stubPrisma(prisma.product, 'count', async () => 4);
    stubPrisma(prisma.customer, 'count', async () => 1);
  };

  it('401 sin sesión', async () => {
    const res = mockRes();

    await getDashboardSummary(mockReq({ storeId: 'store-1' }, null), res);

    assert.equal(res.statusCode, 401);
  });

  it('400 si falta la tienda', async () => {
    const res = mockRes();

    await getDashboardSummary(mockReq({}), res);

    assert.equal(res.statusCode, 400);
  });

  it('403 si la tienda no es del usuario', async () => {
    stubStore(false);
    const res = mockRes();

    await getDashboardSummary(mockReq({ storeId: 'store-1' }), res);

    assert.equal(res.statusCode, 403);
  });

  it('consulta ventas completadas de la tienda desde el inicio de la ventana', async () => {
    stubStore();
    stubCounts();
    const sales = stubPrisma(prisma.sale, 'findMany', async () => []);
    const res = mockRes();
    const before = Date.now();

    await getDashboardSummary(mockReq({ storeId: 'store-1' }), res);

    assert.equal(res.statusCode, 200);
    const where = sales.mock.calls[0].arguments[0].where;
    assert.equal(where.storeId, 'store-1');
    assert.equal(where.status, 'completed');
    assert.ok(where.createdAt.gte instanceof Date);
    assert.ok(where.createdAt.gte.getTime() <= before);
  });

  it('responde ventas en USD, conteos de productos y clientes y 30 días de tendencia', async () => {
    stubStore();
    stubCounts();
    stubPrisma(prisma.sale, 'findMany', async () => [
      {
        createdAt: new Date(),
        total: 854.1,
        totalReference: 1,
        exchangeRate: 854.1,
      },
    ]);
    const res = mockRes();

    await getDashboardSummary(mockReq({ storeId: 'store-1' }), res);

    assert.deepEqual(res.body.today, { totalUsd: 1, count: 1 });
    assert.equal(res.body.products, 4);
    assert.equal(res.body.customers, 1);
    assert.equal(res.body.byDay.length, 30);
  });
});
