import { apiClient } from '@/lib/api';

// Todos los montos están en USD: el backend convierte cada venta con su monto
// de referencia o su tasa, porque Sale.total está en la moneda de la venta
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
  // Ventas antiguas sin monto en USD ni tasa: no entran en los totales
  unconvertedSales: number;
}

export interface SalesStatsFilters {
  storeId: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  customerId?: string;
}

/** Estadísticas de las ventas completadas que cumplen los filtros */
export async function getSalesStats(
  filters: SalesStatsFilters
): Promise<SalesStats> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  return apiClient.get<SalesStats>(`/api/sales/stats/summary?${params}`);
}
