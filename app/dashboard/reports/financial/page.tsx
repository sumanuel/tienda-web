'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useReportsStore } from '@/store/reportsStore';
import { getFinancialReport } from '@/lib/reports/financialReports';
import { exportFinancialReportToExcel } from '@/lib/export/excelExporter';
import { FinancialReportData } from '@/types/reports';
import DateRangePicker from '@/components/reports/DateRangePicker';
import ExportButtons from '@/components/reports/ExportButtons';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Wallet,
} from 'lucide-react';
import { IconChip } from '@/components/common/IconChip';
import { DualCurrency } from '@/components/common/DualCurrency';

const COLORS = ['#1f7a59', '#3b82f6', '#f59e0b', '#ef4444'];

export default function FinancialReportPage() {
  const { profile } = useAuthStore();
  const { activeRate } = useExchangeRates(profile?.storeId || '');
  const exchangeRate = activeRate?.usdToVes;
  const { dateRange, setDateRange } = useReportsStore();
  const [reportData, setReportData] = useState<FinancialReportData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [dateRange, profile?.storeId]);

  async function loadReport() {
    if (!profile?.storeId) return;

    setLoading(true);
    try {
      const data = await getFinancialReport(profile.storeId, dateRange);
      setReportData(data);
    } catch (error) {
      console.error('Error loading financial report:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleExportExcel() {
    if (!reportData) return;
    exportFinancialReportToExcel(reportData, dateRange);
  }

  function handleExportPDF() {
    alert('Exportación a PDF en desarrollo');
  }

  if (loading) {
    return (
      <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-7 w-48 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="mt-3 h-4 w-72 rounded bg-gray-100 dark:bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <IconChip icon={Wallet} tone="info" className="h-11 w-11" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Reporte Financiero
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Estado de resultados, rentabilidad y flujo de caja.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
          <ExportButtons
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            disabled={!reportData}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Ingresos Totales
            </span>
            <IconChip icon={TrendingUp} tone="accent" className="h-9 w-9" />
          </div>
          <DualCurrency
            usd={reportData?.totalRevenue ?? 0}
            exchangeRate={exchangeRate}
            size="lg"
            align="left"
            primaryClassName="text-tsuma-primary-dark"
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Egresos Totales
            </span>
            <IconChip icon={TrendingDown} tone="danger" className="h-9 w-9" />
          </div>
          <DualCurrency
            usd={reportData?.totalExpenses ?? 0}
            exchangeRate={exchangeRate}
            size="lg"
            align="left"
            primaryClassName="text-red-600 dark:text-red-400"
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Utilidad Bruta
            </span>
            <IconChip icon={DollarSign} tone="info" className="h-9 w-9" />
          </div>
          <DualCurrency
            usd={reportData?.grossProfit ?? 0}
            exchangeRate={exchangeRate}
            size="lg"
            align="left"
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Margen de Utilidad
            </span>
            <IconChip icon={Percent} tone="neutral" className="h-9 w-9" />
          </div>
          <p className="font-mono text-2xl font-bold text-gray-900 tabular-nums dark:text-slate-100">
            {reportData?.profitMargin.toFixed(1) || '0.0'}%
          </p>
        </div>
      </div>

      {/* Cuentas por Cobrar/Pagar */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-slate-200">
            Cuentas por Cobrar
          </h3>
          <DualCurrency
            usd={reportData?.accountsReceivable ?? 0}
            exchangeRate={exchangeRate}
            size="lg"
            align="left"
            primaryClassName="text-tsuma-primary-dark text-3xl"
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-slate-200">
            Cuentas por Pagar
          </h3>
          <DualCurrency
            usd={reportData?.accountsPayable ?? 0}
            exchangeRate={exchangeRate}
            size="lg"
            align="left"
            primaryClassName="text-3xl text-red-600 dark:text-red-400"
          />
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Distribución de Ingresos */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-slate-200">
            Distribución de Ingresos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData?.revenueDistribution || []}
                dataKey="amount"
                nameKey="source"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {(reportData?.revenueDistribution || []).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Resumen Financiero */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-slate-200">
            Resumen Financiero
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
              <span className="text-gray-600 dark:text-slate-400">
                Ingresos
              </span>
              <DualCurrency
                usd={reportData?.totalRevenue ?? 0}
                exchangeRate={exchangeRate}
                size="sm"
                primaryClassName="text-tsuma-primary-dark"
              />
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
              <span className="text-gray-600 dark:text-slate-400">Egresos</span>
              <DualCurrency
                usd={reportData?.totalExpenses ?? 0}
                exchangeRate={exchangeRate}
                size="sm"
                primaryClassName="text-red-600 dark:text-red-400"
              />
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
              <span className="font-semibold text-gray-600 dark:text-slate-400">
                Utilidad Bruta
              </span>
              <DualCurrency
                usd={reportData?.grossProfit ?? 0}
                exchangeRate={exchangeRate}
                size="md"
                primaryClassName="text-blue-600 dark:text-blue-400"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-slate-400">Margen</span>
              <span className="font-mono text-lg font-semibold text-purple-600 tabular-nums dark:text-purple-400">
                {reportData?.profitMargin.toFixed(1) || '0.0'}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
