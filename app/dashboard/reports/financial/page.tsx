'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useReportsStore } from '@/store/reportsStore';
import { getFinancialReport } from '@/lib/reports/financialReports';
import { exportFinancialReportToExcel } from '@/lib/export/excelExporter';
import { FinancialReportData } from '@/types/reports';
import DateRangePicker from '@/components/reports/DateRangePicker';
import ExportButtons from '@/components/reports/ExportButtons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Percent } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function FinancialReportPage() {
  const { profile } = useAuthStore();
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
      <div className="p-8">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="mb-8 h-4 w-1/3 rounded bg-gray-200"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Reporte Financiero
        </h1>
        <div className="flex items-center justify-between">
          <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
          <ExportButtons
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            disabled={!reportData}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">Ingresos Totales</span>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${reportData?.totalRevenue.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">Egresos Totales</span>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${reportData?.totalExpenses.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">Utilidad Bruta</span>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${reportData?.grossProfit.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">Margen de Utilidad</span>
            <Percent className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {reportData?.profitMargin.toFixed(1) || '0.0'}%
          </p>
        </div>
      </div>

      {/* Cuentas por Cobrar/Pagar */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Cuentas por Cobrar
          </h3>
          <p className="text-4xl font-bold text-green-600">
            ${reportData?.accountsReceivable.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Cuentas por Pagar
          </h3>
          <p className="text-4xl font-bold text-red-600">
            ${reportData?.accountsPayable.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Distribución de Ingresos */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
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
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Resumen Financiero
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-gray-600">Ingresos</span>
              <span className="text-lg font-semibold text-green-600">
                ${reportData?.totalRevenue.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-gray-600">Egresos</span>
              <span className="text-lg font-semibold text-red-600">
                ${reportData?.totalExpenses.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-semibold text-gray-600">
                Utilidad Bruta
              </span>
              <span className="text-xl font-bold text-blue-600">
                ${reportData?.grossProfit.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Margen</span>
              <span className="text-lg font-semibold text-purple-600">
                {reportData?.profitMargin.toFixed(1) || '0.0'}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
