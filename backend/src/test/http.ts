import { mock } from 'node:test';
import type { Response } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware';

/** Respuesta falsa de Express que guarda el estado y el cuerpo enviados */
export function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as any,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  return res as typeof res & Response;
}

/** Petición autenticada (por defecto) con la query indicada */
export function mockReq(
  query: Record<string, unknown> = {},
  user: { userId: string } | null = { userId: 'user-1' }
) {
  return { query, user: user ?? undefined } as unknown as AuthRequest;
}

const restorers: (() => void)[] = [];

/**
 * Sustituye un método de un delegado de Prisma por una función falsa, sin
 * tocar la base de datos. Los delegados son proxies (mock.method no los ve),
 * por eso se asigna directamente. Devuelve el mock para revisar las llamadas;
 * restoreStubs() deja todo como estaba.
 */
export function stubPrisma<T extends object, K extends keyof T>(
  delegate: T,
  method: K,
  impl: (...args: any[]) => unknown
) {
  const target = delegate as any;
  const original = target[method];
  const fn = mock.fn(impl);
  target[method] = fn;
  restorers.push(() => {
    target[method] = original;
  });
  return fn;
}

export function restoreStubs() {
  while (restorers.length > 0) restorers.pop()?.();
  mock.restoreAll();
}

/** Silencia console.error mientras un test provoca un error a propósito */
export function silenceConsoleError() {
  return mock.method(console, 'error', () => undefined);
}
