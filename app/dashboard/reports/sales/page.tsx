'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useReportsStore } from '@/store/reportsStore';
import { getSalesReport } from '@/lib/reports/salesReports';
import { exportSalesReportToExcel } from '@/lib/export/excelExporter';
import { SalesReportData } from '@/types/reports';
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
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Award,
  BarChart3,
  Package,
} from 'lucide-react';
import { IconChip } from '@/components/common/IconChip';

const COLORS = ['#1f7a59', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SalesReportPage() {
  const { profile } = useAuthStore();
  const { dateRange, setDateRange } = useReportsStore();
  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [dateRange, profile?.storeId]);

  async function loadReport() {
    if (!profile?.storeId) return;

    setLoading(true);
    try {
      const data = await getSalesReport(profile.storeId, dateRange);
      setReportData(data);
    } catch (error) {
      console.error('Error loading sales report:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleExportExcel() {
    if (!reportData) return;
    exportSalesReportToExcel(reportData, dateRange);
  }

  function handleExportPDF() {
    // TODO: Implementar PDF
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
          <IconChip icon={BarChart3} tone="accent" className="h-11 w-11" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Reporte de Ventas
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Análisis detallado de ventas por período, producto y cliente.
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
              Total Ventas
            </span>
            <IconChip icon={DollarSign} tone="accent" className="h-9 w-9" />
          </div>
          <p className="font-mono text-2xl font-bold text-gray-900 tabular-nums dark:text-slate-100">
            ${reportData?.totalSales.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Transacciones
            </span>
            <IconChip icon={ShoppingCart} tone="info" className="h-9 w-9" />
          </div>
          <p className="font-mono text-2xl font-bold text-gray-900 tabular-nums dark:text-slate-100">
            {reportData?.totalTransactions || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Ticket Promedio
            </span>
            <IconChip icon={TrendingUp} tone="neutral" className="h-9 w-9" />
          </div>
          <p className="font-mono text-2xl font-bold text-gray-900 tabular-nums dark:text-slate-100">
            ${reportData?.averageTicket.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Top Producto
            </span>
            <IconChip icon={Award} tone="warning" className="h-9 w-9" />
          </div>
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-slate-100">
            {reportData?.topProduct?.name || 'N/A'}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {reportData?.topProduct?.quantity || 0} unidades
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Ventas por día */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-slate-200">
            Ventas por Día
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData?.salesByDay || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#1f7a59"
                name="Ventas ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top productos */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-slate-200">
            Top 5 Productos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.salesByProduct.slice(0, 5) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="productName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#1f7a59" name="Ventas ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Métodos de pago */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-slate-200">
            Métodos de Pago
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData?.salesByPaymentMethod || []}
                dataKey="total"
                nameKey="method"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {(reportData?.salesByPaymentMethod || []).map(
                  (entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  )
                )}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Ventas por hora */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-slate-200">
            Ventas por Hora
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.salesByHour || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="transactions" fill="#f59e0b" name="Transacciones" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200">
          Detalle por Producto
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm dark:border-slate-800">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-950">
              <tr>
                <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                  Producto
                </th>
                <th className="border-b border-gray-200 px-4 py-2.5 text-right font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                  Cantidad
                </th>
                <th className="border-b border-gray-200 px-4 py-2.5 text-right font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                  Total ($)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {!reportData || reportData.salesByProduct.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Package className="mb-4 h-12 w-12 text-gray-300 dark:text-slate-700" />
                      <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
                        No hay datos para este período
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                reportData.salesByProduct.map((product) => (
                  <tr
                    key={product.productId}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">
                      {product.productName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 tabular-nums dark:text-slate-100">
                      {product.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900 tabular-nums dark:text-slate-100">
                      ${product.total.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
