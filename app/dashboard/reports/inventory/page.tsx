'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getInventoryReport } from '@/lib/reports/inventoryReports';
import { exportInventoryReportToExcel } from '@/lib/export/excelExporter';
import { InventoryReportData } from '@/types/reports';
import ExportButtons from '@/components/reports/ExportButtons';
import {
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
  Package,
  DollarSign,
  AlertTriangle,
  XCircle,
  PackageSearch,
  Boxes,
} from 'lucide-react';
import { IconChip } from '@/components/common/IconChip';

const COLORS = [
  '#1f7a59',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
];

export default function InventoryReportPage() {
  const { profile } = useAuthStore();
  const [reportData, setReportData] = useState<InventoryReportData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [profile?.storeId]);

  async function loadReport() {
    if (!profile?.storeId) return;

    setLoading(true);
    try {
      const data = await getInventoryReport(profile.storeId);
      setReportData(data);
    } catch (error) {
      console.error('Error loading inventory report:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleExportExcel() {
    if (!reportData) return;
    exportInventoryReportToExcel(reportData);
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
          <IconChip icon={PackageSearch} tone="warning" className="h-11 w-11" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Reporte de Inventario
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Valorización, stock y movimientos de inventario.
            </p>
          </div>
        </div>
        <ExportButtons
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          disabled={!reportData}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Valor Total
            </span>
            <IconChip icon={DollarSign} tone="info" className="h-9 w-9" />
          </div>
          <p className="font-mono text-2xl font-bold text-gray-900 tabular-nums dark:text-slate-100">
            ${reportData?.totalValue.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Total Productos
            </span>
            <IconChip icon={Package} tone="accent" className="h-9 w-9" />
          </div>
          <p className="font-mono text-2xl font-bold text-gray-900 tabular-nums dark:text-slate-100">
            {reportData?.totalProducts || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Stock Bajo
            </span>
            <IconChip icon={AlertTriangle} tone="warning" className="h-9 w-9" />
          </div>
          <p className="font-mono text-2xl font-bold text-gray-900 tabular-nums dark:text-slate-100">
            {reportData?.lowStockProducts || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Sin Stock
            </span>
            <IconChip icon={XCircle} tone="danger" className="h-9 w-9" />
          </div>
          <p className="font-mono text-2xl font-bold text-gray-900 tabular-nums dark:text-slate-100">
            {reportData?.outOfStockProducts || 0}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Valor por categoría */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-slate-200">
            Valor por Categoría
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.valueByCategory || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#1f7a59" name="Valor ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución de stock */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-slate-200">
            Distribución de Stock
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData?.stockDistribution || []}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {(reportData?.stockDistribution || []).map((entry, index) => (
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
      </div>

      {/* Tabla de valorización */}
      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200">
          Valorización por Categoría
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm dark:border-slate-800">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-950">
              <tr>
                <th className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                  Categoría
                </th>
                <th className="border-b border-gray-200 px-4 py-2.5 text-right font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                  Cantidad
                </th>
                <th className="border-b border-gray-200 px-4 py-2.5 text-right font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500">
                  Valor ($)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {!reportData || reportData.valueByCategory.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Boxes className="mb-4 h-12 w-12 text-gray-300 dark:text-slate-700" />
                      <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
                        No hay productos con inventario rastreado
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                reportData.valueByCategory.map((category, index) => (
                  <tr
                    key={index}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">
                      {category.category}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 tabular-nums dark:text-slate-100">
                      {category.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900 tabular-nums dark:text-slate-100">
                      ${category.value.toFixed(2)}
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
