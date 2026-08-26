import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface Sale {
  id: string;
  saleNumber: string;
  storeId: string;
  customerId?: string;
  userId: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  localCurrency: string;
  referenceCurrency: string;
  exchangeRate: number;
  totalReference?: number;
  paymentMethod: string;
  referenceNumber?: string;
  paid: number;
  change: number;
  status: string;
  notes?: string;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  monetarySnapshot?: any;
  createdAt: string;
  updatedAt: string;
  items?: SaleItem[];
  customer?: {
    id: string;
    name: string;
    documentNumber?: string;
    phone?: string;
  };
  cashier?: {
    id: string;
    name: string;
    email: string;
  };
  receivable?: Receivable;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  localPrice: number;
  referencePrice: number;
  subtotal: number;
  subtotalLocal: number;
  subtotalReference: number;
  priceSnapshot?: any;
  iva: number;
  product?: {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
  };
}

export interface Receivable {
  id: string;
  storeId: string;
  saleId?: string;
  customerId: string;
  customerName: string;
  documentNumber?: string;
  amount: number;
  baseCurrency: string;
  referenceAmount: number;
  exchangeRateAtCreation: number;
  amountPaid: number;
  balance: number;
  description?: string;
  dueDate?: string;
  invoiceNumber?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  payments?: ReceivablePayment[];
}

export interface ReceivablePayment {
  id: string;
  receivableId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateSaleData {
  storeId: string;
  customerId?: string;
  customerDocument?: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    localPrice: number;
    referencePrice: number;
    subtotal: number;
    subtotalLocal: number;
    subtotalReference: number;
    priceSnapshot?: any;
    iva?: number;
  }[];
  paymentMethod: string;
  referenceNumber?: string;
  subtotal: number;
  tax: number;
  total: number;
  currency?: string;
  localCurrency?: string;
  referenceCurrency?: string;
  exchangeRate?: number;
  totalReference?: number;
  paid?: number;
  change?: number;
  notes?: string;
  monetarySnapshot?: any;
}

export interface SalesFilters {
  storeId: string;
  customerId?: string;
  paymentMethod?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SalesResponse {
  sales: Sale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SalesStats {
  totalRevenue: number;
  totalTax: number;
  averageSale: number;
  salesCount: number;
  salesByPaymentMethod: {
    paymentMethod: string;
    count: number;
    total: number;
  }[];
}

export function useSales() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Crear una nueva venta
   */
  const createSale = useCallback(
    async (data: CreateSaleData): Promise<Sale | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.post<{ message: string; sale: Sale }>(
          '/sales',
          data
        );
        return response.sale;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || err.message || 'Error al crear la venta';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Obtener lista de ventas con filtros
   */
  const getSales = useCallback(
    async (filters: SalesFilters): Promise<SalesResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });

        const response = await apiClient.get<SalesResponse>(
          `/sales?${params.toString()}`
        );
        return response;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || err.message || 'Error al obtener ventas';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Obtener detalle de una venta
   */
  const getSaleById = useCallback(async (id: string): Promise<Sale | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ sale: Sale }>(`/sales/${id}`);
      return response.sale;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || err.message || 'Error al obtener la venta';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cancelar una venta
   */
  const cancelSale = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await apiClient.delete(`/sales/${id}`, { reason });
        return true;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          'Error al cancelar la venta';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Obtener estadísticas de ventas
   */
  const getSalesStats = useCallback(
    async (filters: {
      storeId: string;
      startDate?: string;
      endDate?: string;
    }): Promise<SalesStats | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });

        const response = await apiClient.get<SalesStats>(
          `/sales/stats/summary?${params.toString()}`
        );
        return response;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          'Error al obtener estadísticas';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    createSale,
    getSales,
    getSaleById,
    cancelSale,
    getSalesStats,
  };
}
