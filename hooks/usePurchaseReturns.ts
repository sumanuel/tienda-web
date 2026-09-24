import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface PurchaseReturnItem {
  id: string;
  purchaseReturnId: string;
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
  subtotal: number;
  purchaseItemId?: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
  };
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  storeId: string;
  supplierId: string;
  purchaseId?: string;
  userId: string;
  reason: string;
  subtotal: number;
  total: number;
  currency: string;
  localCurrency: string;
  referenceCurrency: string;
  exchangeRate: number;
  totalReference?: number;
  status: string;
  createdAt: string;
  items?: PurchaseReturnItem[];
  supplier?: {
    id: string;
    name: string;
    taxId?: string;
  };
  purchase?: {
    id: string;
    purchaseNumber: string;
    invoiceNumber?: string;
  };
}

export interface CreatePurchaseReturnData {
  storeId: string;
  supplierId: string;
  purchaseId?: string;
  reason: string;
  items: {
    productId: string;
    quantity: number;
    cost: number;
    subtotal: number;
    purchaseItemId?: string;
  }[];
  subtotal: number;
  total: number;
  currency?: string;
  localCurrency?: string;
  referenceCurrency?: string;
  exchangeRate?: number;
  totalReference?: number;
}

export interface PurchaseReturnsFilters {
  storeId: string;
  supplierId?: string;
  page?: number;
  limit?: number;
}

export interface PurchaseReturnsResponse {
  purchaseReturns: PurchaseReturn[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function usePurchaseReturns() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPurchaseReturn = useCallback(
    async (data: CreatePurchaseReturnData): Promise<PurchaseReturn | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.post<{
          message: string;
          purchaseReturn: PurchaseReturn;
        }>('/api/purchase-returns', data);
        return response.purchaseReturn;
      } catch (err: any) {
        const errorMessage = err.message || 'Error al crear la devolución';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getPurchaseReturns = useCallback(
    async (
      filters: PurchaseReturnsFilters
    ): Promise<PurchaseReturnsResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });

        const response = await apiClient.get<PurchaseReturnsResponse>(
          `/api/purchase-returns?${params.toString()}`
        );
        return response;
      } catch (err: any) {
        const errorMessage =
          err.message || 'Error al obtener devoluciones de compra';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getPurchaseReturnById = useCallback(
    async (id: string): Promise<PurchaseReturn | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<{
          purchaseReturn: PurchaseReturn;
        }>(`/api/purchase-returns/${id}`);
        return response.purchaseReturn;
      } catch (err: any) {
        const errorMessage = err.message || 'Error al obtener la devolución';
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
    createPurchaseReturn,
    getPurchaseReturns,
    getPurchaseReturnById,
  };
}
