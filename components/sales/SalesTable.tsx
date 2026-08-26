'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { SaleDetailModal } from './SaleDetailModal';
import { CancelSaleButton } from './CancelSaleButton';
import { formatCurrency, type Currency } from '@/lib/currency';
import type { Sale } from '@/hooks/useSales';

interface SalesTableProps {
  sales: Sale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  pago_movil: 'Pago Móvil',
  por_cobrar: 'Por Cobrar'
};

export function SalesTable({ sales, pagination, onPageChange, onRefresh }: SalesTableProps) {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleViewDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const handleCancelSuccess = () => {
    setShowDetailModal(false);
    setSelectedSale(null);
    onRefresh();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (sales.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500 text-lg">No se encontraron ventas</p>
        <p className="text-gray-400 text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Tabla */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Venta</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Método de Pago</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formatDate(sale.createdAt)}
                </TableCell>
                <TableCell>
                  {sale.customer ? (
                    <div>
                      <p className="font-medium text-sm">{sale.customer.name}</p>
                      {sale.customer.documentNumber && sale.customer.documentNumber !== '1' && (
                        <p className="text-xs text-gray-500">
                          Doc: {sale.customer.documentNumber}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Cliente Genérico</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod}
                  </span>
                  {sale.referenceNumber && (
                    <p className="text-xs text-gray-500">
                      Ref: {sale.referenceNumber}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold">
                      {formatCurrency(sale.total, sale.currency as Currency)}
                    </p>
                    {sale.totalReference && sale.currency !== 'USD' && (
                      <p className="text-xs text-gray-500">
                        ≈ {formatCurrency(sale.totalReference, 'USD')}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(sale.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetail(sale)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {sale.status === 'completed' && (
                      <CancelSaleButton
                        saleId={sale.id}
                        saleNumber={sale.saleNumber}
                        onSuccess={handleCancelSuccess}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-gray-600">
          Mostrando {(pagination.page - 1) * pagination.limit + 1} -{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} ventas
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPageChange(1)}
            disabled={pagination.page === 1}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-sm px-3">
            Página {pagination.page} de {pagination.pages}
          </span>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPageChange(pagination.pages)}
            disabled={pagination.page >= pagination.pages}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Modal de detalle */}
      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSale(null);
          }}
          onCancelSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}
