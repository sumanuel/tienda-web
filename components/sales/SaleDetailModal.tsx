'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CancelSaleButton } from './CancelSaleButton';
import { StatusPill } from '@/components/common/StatusPill';
import { formatCurrency, type Currency } from '@/lib/currency';
import {
  Calendar,
  User,
  CreditCard,
  Package,
  DollarSign,
  FileText,
  Clock,
} from 'lucide-react';
import type { Sale } from '@/hooks/useSales';

interface SaleDetailModalProps {
  sale: Sale;
  open: boolean;
  onClose: () => void;
  onCancelSuccess?: () => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  pago_movil: 'Pago Móvil',
  por_cobrar: 'Por Cobrar',
};

export function SaleDetailModal({
  sale,
  open,
  onClose,
  onCancelSuccess,
}: SaleDetailModalProps) {
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
              Venta {sale.saleNumber}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(sale.status)}
              {sale.status === 'completed' && (
                <CancelSaleButton
                  saleId={sale.id}
                  saleNumber={sale.saleNumber}
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
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400 dark:text-slate-400 dark:text-slate-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Fecha
                  </p>
                  <p className="font-medium">{formatDate(sale.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-gray-400 dark:text-slate-400 dark:text-slate-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Cajero
                  </p>
                  <p className="font-medium">{sale.cashier?.name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-gray-400 dark:text-slate-400 dark:text-slate-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Cliente
                  </p>
                  <p className="font-medium">
                    {sale.customer?.name || 'Cliente Genérico'}
                  </p>
                  {sale.customer?.documentNumber &&
                    sale.customer.documentNumber !== '1' && (
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Doc: {sale.customer.documentNumber}
                      </p>
                    )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-5 w-5 text-gray-400 dark:text-slate-400 dark:text-slate-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Método de Pago
                  </p>
                  <p className="font-medium">
                    {PAYMENT_METHOD_LABELS[sale.paymentMethod] ||
                      sale.paymentMethod}
                  </p>
                  {sale.referenceNumber && (
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Ref: {sale.referenceNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Items de la venta */}
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
                        Precio Unit.
                      </th>
                      <th className="p-3 text-right text-sm font-medium text-gray-600 dark:text-slate-400">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items?.map((item) => (
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
                          {formatCurrency(
                            item.price,
                            sale.currency as Currency
                          )}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(
                            item.subtotal,
                            sale.currency as Currency
                          )}
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

              <div className="space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-slate-950">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-slate-400">
                    Subtotal:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(sale.subtotal, sale.currency as Currency)}
                  </span>
                </div>

                {sale.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">
                      IVA:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(sale.tax, sale.currency as Currency)}
                    </span>
                  </div>
                )}

                {sale.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">
                      Descuento:
                    </span>
                    <span className="font-medium text-red-600">
                      -
                      {formatCurrency(sale.discount, sale.currency as Currency)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-brand-primary text-2xl font-bold">
                    {formatCurrency(sale.total, sale.currency as Currency)}
                  </span>
                </div>

                {sale.totalReference && sale.currency !== 'USD' && (
                  <div className="text-center text-sm text-gray-500 dark:text-slate-400">
                    ≈ {formatCurrency(sale.totalReference, 'USD')}
                  </div>
                )}

                <div className="mt-2 flex justify-between text-sm text-gray-600 dark:text-slate-400">
                  <span>Tasa de cambio:</span>
                  <span>1 USD = {sale.exchangeRate.toFixed(2)} VES</span>
                </div>
              </div>
            </div>

            {/* Cuenta por cobrar */}
            {sale.receivable && (
              <>
                <Separator />
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                      Cuenta por Cobrar
                    </h3>
                  </div>

                  <div className="space-y-2 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-slate-400">
                        Monto original:
                      </span>
                      <span className="font-medium">
                        {formatCurrency(
                          sale.receivable.amount,
                          sale.receivable.baseCurrency as Currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-slate-400">
                        Monto pagado:
                      </span>
                      <span className="font-medium">
                        {formatCurrency(
                          sale.receivable.amountPaid,
                          sale.receivable.baseCurrency as Currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Saldo pendiente:</span>
                      <span className="font-bold text-orange-700 dark:text-orange-400">
                        {formatCurrency(
                          sale.receivable.balance,
                          sale.receivable.baseCurrency as Currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-slate-400">
                        Estado:
                      </span>
                      <Badge
                        variant={
                          sale.receivable.status === 'paid'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {sale.receivable.status === 'paid'
                          ? 'Pagada'
                          : sale.receivable.status === 'pending'
                            ? 'Pendiente'
                            : 'Parcial'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Información de cancelación */}
            {sale.status === 'cancelled' && (
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
                    {sale.cancelReason && (
                      <div>
                        <p className="mb-1 text-sm text-gray-600 dark:text-slate-400">
                          Razón:
                        </p>
                        <p className="text-sm">{sale.cancelReason}</p>
                      </div>
                    )}
                    {sale.cancelledAt && (
                      <div className="text-sm text-gray-600 dark:text-slate-400">
                        Cancelada el: {formatDate(sale.cancelledAt)}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Notas */}
            {sale.notes && (
              <>
                <Separator />
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                    <h3 className="font-semibold">Notas</h3>
                  </div>
                  <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-slate-950 dark:text-slate-400">
                    {sale.notes}
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
