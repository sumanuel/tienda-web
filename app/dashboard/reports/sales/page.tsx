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
import { TrendingUp, ShoppingCart, DollarSign, Award } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
          Reporte de Ventas
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
            <span className="text-sm text-gray-600">Total Ventas</span>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${reportData?.totalSales.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">Transacciones</span>
            <ShoppingCart className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {reportData?.totalTransactions || 0}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">Ticket Promedio</span>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${reportData?.averageTicket.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">Top Producto</span>
            <Award className="h-5 w-5 text-orange-500" />
          </div>
          <p className="truncate text-sm font-semibold text-gray-900">
            {reportData?.topProduct?.name || 'N/A'}
          </p>
          <p className="text-xs text-gray-600">
            {reportData?.topProduct?.quantity || 0} unidades
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ventas por día */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
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
                stroke="#3b82f6"
                name="Ventas ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top productos */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Top 5 Productos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.salesByProduct.slice(0, 5) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="productName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#10b981" name="Ventas ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Métodos de pago */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
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
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
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
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="border-b p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Detalle por Producto
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Producto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total ($)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData?.salesByProduct.map((product) => (
                <tr key={product.productId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {product.productName}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {product.quantity}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    ${product.total.toFixed(2)}
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
