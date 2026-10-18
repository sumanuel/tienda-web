import { apiClient } from '@/lib/api';

interface SalesTotal {
  totalUsd: number;
  count: number;
}

// Montos en USD; el panel los muestra en VES con la tasa activa
export interface DashboardSummary {
  today: SalesTotal;
  month: SalesTotal;
  // Mismo tramo (del día 1 al día de hoy) del mes anterior
  previousMonth: SalesTotal;
  products: number;
  customers: number;
  // Últimos 30 días, uno por día (yyyy-MM-dd), con ceros donde no hubo ventas
  byDay: (SalesTotal & { date: string })[];
}

export async function getDashboardSummary(
  storeId: string
): Promise<DashboardSummary> {
  return apiClient.get<DashboardSummary>(
    `/api/reports/dashboard?storeId=${encodeURIComponent(storeId)}`
  );
}
