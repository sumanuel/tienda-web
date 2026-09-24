import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface Purchase {
  id: string;
  purchaseNumber: string;
  storeId: string;
  supplierId: string;
  userId: string;
  invoiceNumber?: string;
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
  dueDate?: string;
  paid: number;
  status: string;
  notes?: string;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
  items?: PurchaseItem[];
  supplier?: {
    id: string;
    name: string;
    taxId?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  transactions?: Array<{
    id: string;
    type: string;
    amount: number;
    balance: number;
    dueDate?: string;
    createdAt: string;
  }>;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
  localCost: number;
  referenceCost: number;
  subtotal: number;
  subtotalLocal: number;
  subtotalReference: number;
  product?: {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
  };
}

export interface CreatePurchaseData {
  storeId: string;
  supplierId: string;
  invoiceNumber?: string;
  items: {
    productId: string;
    quantity: number;
    cost: number;
    localCost: number;
    referenceCost: number;
    subtotal: number;
    subtotalLocal: number;
    subtotalReference: number;
  }[];
  paymentMethod: string;
  dueDate?: string;
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  currency?: string;
  localCurrency?: string;
  referenceCurrency?: string;
  exchangeRate?: number;
  totalReference?: number;
  paid?: number;
  notes?: string;
}

export interface PurchasesFilters {
  storeId: string;
  supplierId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PurchasesResponse {
  purchases: Purchase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PurchaseStats {
  totalSpent: number;
  totalTax: number;
  averagePurchase: number;
  purchasesCount: number;
  purchasesByPaymentMethod: {
    paymentMethod: string;
    count: number;
    total: number;
  }[];
}

export function usePurchases() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPurchase = useCallback(
    async (data: CreatePurchaseData): Promise<Purchase | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.post<{
          message: string;
          purchase: Purchase;
        }>('/api/purchases', data);
        return response.purchase;
      } catch (err: any) {
        const errorMessage =
          err.message || 'Error al crear la compra';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getPurchases = useCallback(
    async (filters: PurchasesFilters): Promise<PurchasesResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });

        const response = await apiClient.get<PurchasesResponse>(
          `/api/purchases?${params.toString()}`
        );
        return response;
      } catch (err: any) {
        const errorMessage = err.message || 'Error al obtener compras';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getPurchaseById = useCallback(
    async (id: string): Promise<Purchase | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<{ purchase: Purchase }>(
          `/api/purchases/${id}`
        );
        return response.purchase;
      } catch (err: any) {
        const errorMessage = err.message || 'Error al obtener la compra';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const cancelPurchase = useCallback(
    async (id: string, reason: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await apiClient.delete(`/api/purchases/${id}`, { reason });
        return true;
      } catch (err: any) {
        const errorMessage = err.message || 'Error al cancelar la compra';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getPurchaseStats = useCallback(
    async (filters: {
      storeId: string;
      startDate?: string;
      endDate?: string;
    }): Promise<PurchaseStats | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });

        const response = await apiClient.get<PurchaseStats>(
          `/api/purchases/stats/summary?${params.toString()}`
        );
        return response;
      } catch (err: any) {
        const errorMessage = err.message || 'Error al obtener estadísticas';
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
    createPurchase,
    getPurchases,
    getPurchaseById,
    cancelPurchase,
    getPurchaseStats,
  };
}
