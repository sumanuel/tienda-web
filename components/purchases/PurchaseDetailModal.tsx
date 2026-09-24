'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CancelPurchaseButton } from './CancelPurchaseButton';
import { StatusPill } from '@/components/common/StatusPill';
import { DualCurrency } from '@/components/common/DualCurrency';
import { formatCurrency } from '@/lib/currency';
import {
  Calendar,
  Truck,
  CreditCard,
  Package,
  DollarSign,
  FileText,
  Clock,
} from 'lucide-react';
import type { Purchase } from '@/hooks/usePurchases';

interface PurchaseDetailModalProps {
  purchase: Purchase;
  open: boolean;
  onClose: () => void;
  onCancelSuccess?: () => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  credito: 'Crédito',
};

export function PurchaseDetailModal({
  purchase,
  open,
  onClose,
  onCancelSuccess,
}: PurchaseDetailModalProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <StatusPill tone="ok">Completada</StatusPill>;
      case 'cancelled':
        return <StatusPill tone="crit">Cancelada</StatusPill>;
      default:
        return <StatusPill tone="mute">{status}</StatusPill>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              Compra {purchase.purchaseNumber}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(purchase.status)}
              {purchase.status === 'completed' && (
                <CancelPurchaseButton
                  purchaseId={purchase.id}
                  purchaseNumber={purchase.purchaseNumber}
                  onSuccess={() => {
                    onCancelSuccess?.();
                    onClose();
                  }}
                />
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Información general */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Fecha
                  </p>
                  <p className="font-medium">
                    {formatDate(purchase.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Proveedor
                  </p>
                  <p className="font-medium">
                    {purchase.supplier?.name || 'N/A'}
                  </p>
                  {purchase.invoiceNumber && (
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Factura: {purchase.invoiceNumber}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-5 w-5 text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Método de Pago
                  </p>
                  <p className="font-medium">
                    {PAYMENT_METHOD_LABELS[purchase.paymentMethod] ||
                      purchase.paymentMethod}
                  </p>
                </div>
              </div>

              {purchase.dueDate && (
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-gray-400 dark:text-slate-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Fecha de Vencimiento
                    </p>
                    <p className="font-medium">
                      {formatDueDate(purchase.dueDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Items de la compra */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                <h3 className="font-semibold">Productos</h3>
              </div>

              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-950">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-gray-600 dark:text-slate-400">
                        Producto
                      </th>
                      <th className="p-3 text-center text-sm font-medium text-gray-600 dark:text-slate-400">
                        Cantidad
                      </th>
                      <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-slate-400">
                        Costo Unit.
                      </th>
                      <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-slate-400">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.items?.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">
                          <p className="font-medium">{item.productName}</p>
                          {item.product?.sku && (
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                              SKU: {item.product.sku}
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">
                          {formatCurrency(item.localCost, 'VES')}
                        </td>
                        <td className="p-3 text-right">
                          <DualCurrency
                            ves={item.subtotalLocal}
                            usd={item.subtotalReference}
                            size="sm"
                            align="right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            {/* Totales */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                <h3 className="font-semibold">Totales</h3>
              </div>

              <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-slate-950">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-slate-400">
                    Subtotal:
                  </span>
                  <DualCurrency
                    ves={purchase.subtotal}
                    exchangeRate={purchase.exchangeRate}
                    size="sm"
                    align="right"
                  />
                </div>

                {purchase.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">
                      IVA:
                    </span>
                    <DualCurrency
                      ves={purchase.tax}
                      exchangeRate={purchase.exchangeRate}
                      size="sm"
                      align="right"
                    />
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total:</span>
                  <DualCurrency
                    ves={purchase.total}
                    usd={purchase.totalReference}
                    exchangeRate={purchase.exchangeRate}
                    size="lg"
                    align="right"
                  />
                </div>

                <div className="mt-2 flex justify-between text-sm text-gray-600 dark:text-slate-400">
                  <span>Tasa de cambio:</span>
                  <span>1 USD = {purchase.exchangeRate.toFixed(2)} VES</span>
                </div>
              </div>
            </div>

            {/* Información de cancelación */}
            {purchase.status === 'cancelled' && (
              <>
                <Separator />
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <h3 className="font-semibold text-red-700 dark:text-red-400">
                      Cancelación
                    </h3>
                  </div>

                  <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
                    {purchase.cancelReason && (
                      <div>
                        <p className="mb-1 text-sm text-gray-600 dark:text-slate-400">
                          Razón:
                        </p>
                        <p className="text-sm">{purchase.cancelReason}</p>
                      </div>
                    )}
                    {purchase.cancelledAt && (
                      <div className="text-sm text-gray-600 dark:text-slate-400">
                        Cancelada el: {formatDate(purchase.cancelledAt)}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Notas */}
            {purchase.notes && (
              <>
                <Separator />
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                    <h3 className="font-semibold">Notas</h3>
                  </div>
                  <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-slate-950 dark:text-slate-400">
                    {purchase.notes}
                  </p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
