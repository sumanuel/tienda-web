import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { BusinessError, sendError } from '../utils/errors';
import { parsePagination } from '../utils/pagination';
import { lockSupplier } from '../utils/ledgerLock';
import { round2 } from '../utils/money';

// Tolerancia para comparar montos con decimales
const EPSILON = 0.005;

interface NoteRow {
  amountUsd: number;
  refundedUsd: number;
  supplierId: string;
}

// El libro del proveedor (USD) es la verdad del saldo: el crédito disponible
// es el saldo negativo vigente
async function availableCreditBySupplier(supplierIds: string[]) {
  if (supplierIds.length === 0) return new Map<string, number>();

  const sums = await prisma.supplierTransaction.groupBy({
    by: ['supplierId'],
    where: { supplierId: { in: supplierIds } },
    _sum: { amount: true },
  });

  return new Map(
    sums.map((row) => [row.supplierId, Math.max(0, -(row._sum.amount || 0))])
  );
}

function withStatus<T extends NoteRow>(
  note: T,
  availableCredit: Map<string, number>
) {
  const remainingUsd = round2(note.amountUsd - note.refundedUsd);
  const available = round2(availableCredit.get(note.supplierId) ?? 0);

  return {
    ...note,
    remainingUsd,
    status: remainingUsd > EPSILON ? 'issued' : 'refunded',
    availableCredit: available,
    maxRefund: round2(Math.max(0, Math.min(remainingUsd, available))),
  };
}

const noteInclude = {
  supplier: { select: { id: true, name: true, taxId: true } },
  purchaseReturn: {
    select: {
      id: true,
      returnNumber: true,
      purchase: { select: { id: true, purchaseNumber: true } },
    },
  },
} as const;

/**
 * GET /api/credit-notes
 * Notas de crédito de la tienda, con el crédito disponible de cada proveedor
 */
export async function listCreditNotes(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { storeId, supplierId, status, page, limit } = req.query;

    if (!storeId || typeof storeId !== 'string') {
      throw new BusinessError('El ID de tienda es requerido');
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId: req.user.userId },
      select: { id: true },
    });
    if (!store) {
      return res.status(403).json({ error: 'No tienes acceso a esta tienda' });
    }

    const where: Record<string, unknown> = { storeId: store.id };
    if (typeof supplierId === 'string' && supplierId) {
      where.supplierId = supplierId;
    }

    // Prisma no compara dos columnas, así que el estado se resuelve con ids
    if (status === 'issued' || status === 'refunded') {
      const rows =
        status === 'issued'
          ? await prisma.$queryRaw<{ id: string }[]>`
              SELECT id FROM credit_notes
              WHERE "storeId" = ${store.id}
                AND "amountUsd" - "refundedUsd" > ${EPSILON}`
          : await prisma.$queryRaw<{ id: string }[]>`
              SELECT id FROM credit_notes
              WHERE "storeId" = ${store.id}
                AND "amountUsd" - "refundedUsd" <= ${EPSILON}`;
      where.id = { in: rows.map((row) => row.id) };
    }

    const pagination = parsePagination(page, limit);

    const [notes, total] = await Promise.all([
      prisma.creditNote.findMany({
        where,
        include: noteInclude,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.creditNote.count({ where }),
    ]);

    const credit = await availableCreditBySupplier([
      ...new Set(notes.map((note) => note.supplierId)),
    ]);

    return res.status(200).json({
      creditNotes: notes.map((note) => withStatus(note, credit)),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error) {
    return sendError(res, error, 'Error al listar notas de crédito');
  }
}

/**
 * GET /api/credit-notes/:id
 */
export async function getCreditNote(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params as { id: string };

    const note = await prisma.creditNote.findFirst({
      where: { id, store: { userId: req.user.userId } },
      include: { ...noteInclude, transactions: true },
    });
    if (!note) {
      throw new BusinessError('Nota de crédito no encontrada', 404);
    }

    const credit = await availableCreditBySupplier([note.supplierId]);
    return res.status(200).json({ creditNote: withStatus(note, credit) });
  } catch (error) {
    return sendError(res, error, 'Error al obtener la nota de crédito');
  }
}

/**
 * POST /api/credit-notes/:id/refund
 * Registra que el proveedor devolvió dinero por una nota de crédito (monto en
 * USD). No puede superar lo pendiente de la nota ni el saldo a favor vigente.
 */
export async function refundCreditNote(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { id } = req.params as { id: string };
    const amount = round2(Number(req.body?.amount));
    const notes =
      typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BusinessError('El monto debe ser mayor a 0');
    }

    const refunded = await prisma.$transaction(async (tx) => {
      const found = await tx.creditNote.findFirst({
        where: { id, store: { userId: req.user!.userId } },
        select: { id: true, supplierId: true },
      });
      if (!found) {
        throw new BusinessError('Nota de crédito no encontrada', 404);
      }

      // Con el proveedor bloqueado se lee el estado actual de la nota y del saldo
      await lockSupplier(tx, found.supplierId);
      const note = await tx.creditNote.findUniqueOrThrow({ where: { id } });

      const remaining = round2(note.amountUsd - note.refundedUsd);
      if (remaining <= EPSILON) {
        throw new BusinessError('La nota de crédito ya fue reembolsada', 409);
      }
      if (amount > remaining + EPSILON) {
        throw new BusinessError(
          `El monto supera lo pendiente de la nota (USD ${remaining.toFixed(2)})`,
          409
        );
      }

      const ledger = await tx.supplierTransaction.aggregate({
        where: { supplierId: note.supplierId },
        _sum: { amount: true },
      });
      const balance = ledger._sum.amount || 0;
      const available = Math.max(0, -balance);
      if (amount > available + EPSILON) {
        throw new BusinessError(
          `El saldo a favor vigente con el proveedor es de USD ${available.toFixed(2)}; ya se descontó de otras compras`,
          409
        );
      }

      await tx.supplierTransaction.create({
        data: {
          supplierId: note.supplierId,
          type: 'refund',
          amount,
          balance: balance + amount,
          notes: notes || `Reembolso de la nota ${note.noteNumber}`,
          creditNoteId: note.id,
        },
      });

      return tx.creditNote.update({
        where: { id: note.id },
        data: { refundedUsd: { increment: amount } },
        include: noteInclude,
      });
    });

    const credit = await availableCreditBySupplier([refunded.supplierId]);
    return res.status(200).json({
      message: 'Reembolso registrado',
      creditNote: withStatus(refunded, credit),
    });
  } catch (error) {
    return sendError(res, error, 'Error al registrar el reembolso');
  }
}
