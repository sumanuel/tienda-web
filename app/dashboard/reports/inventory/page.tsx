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
import { Package, DollarSign, AlertTriangle, XCircle } from 'lucide-react';

const COLORS = [
  '#3b82f6',
  '#10b981',
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
          Reporte de Inventario
        </h1>
        <div className="flex items-center justify-end">
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
            <span className="text-sm text-gray-600">Valor Total</span>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${reportData?.totalValue.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Productos</span>
            <Package className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {reportData?.totalProducts || 0}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">Stock Bajo</span>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {reportData?.lowStockProducts || 0}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">Sin Stock</span>
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {reportData?.outOfStockProducts || 0}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Valor por categoría */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Valor por Categoría
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.valueByCategory || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" name="Valor ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución de stock */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
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
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="border-b p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Valorización por Categoría
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoría
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Valor ($)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData?.valueByCategory.map((category, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {category.category}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {category.quantity}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    ${category.value.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
