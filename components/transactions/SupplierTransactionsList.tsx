'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getSupplierTransactions } from '@/lib/supplierTransactions';
import type { SupplierTransaction } from '@/types/transaction';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface SupplierTransactionsListProps {
  supplierId: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

export function SupplierTransactionsList({
  supplierId,
}: SupplierTransactionsListProps) {
  const [transactions, setTransactions] = useState<SupplierTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        const data = await getSupplierTransactions(supplierId);
        setTransactions(data);
      } catch (error) {
        console.error('Error cargando transacciones:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [supplierId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No hay transacciones registradas
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Método</TableHead>
            <TableHead className="text-right">Balance Después</TableHead>
            <TableHead>Notas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const isOverdue =
              transaction.type === 'charge' &&
              transaction.dueDate &&
              transaction.dueDate < new Date();

            return (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {format(transaction.createdAt, 'dd/MM/yyyy HH:mm', {
                    locale: es,
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      transaction.type === 'charge' ? 'destructive' : 'default'
                    }
                  >
                    {transaction.type === 'charge' ? 'Cargo' : 'Pago'}
                  </Badge>
                  {isOverdue && (
                    <span className="ml-2 text-xs font-medium text-red-600">
                      VENCIDO
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${transaction.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  {transaction.paymentMethod
                    ? PAYMENT_METHOD_LABELS[transaction.paymentMethod] || '-'
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  ${transaction.balanceAfter.toFixed(2)}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate text-sm">
                  {transaction.notes || '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
