'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useReportsStore } from '@/store/reportsStore';
import { getPurchasesReport } from '@/lib/reports/purchaseReports';
import { exportPurchasesReportToExcel } from '@/lib/export/excelExporter';
import { exportPurchasesReportToPDF } from '@/lib/export/pdfExporter';
import { formatCurrency } from '@/lib/currency';
import { PurchasesReportData } from '@/types/reports';
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
  ShoppingBag,
  Receipt,
  Clock,
  Undo2,
  DollarSign,
  Package,
  Truck,
} from 'lucide-react';
import { IconChip } from '@/components/common/IconChip';
import { DualCurrency } from '@/components/common/DualCurrency';
import { toast } from 'react-hot-toast';

const COLORS = ['#1f7a59', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  credito: 'Crédito',
};

const cardClass =
  'rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900';
const thClass =
  'border-b border-gray-200 px-4 py-2.5 font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500';

const formatVes = (value: unknown) => formatCurrency(Number(value), 'VES');

export default function PurchasesReportPage() {
  const { profile } = useAuthStore();
  const { dateRange, setDateRange } = useReportsStore();
  const [reportData, setReportData] = useState<PurchasesReportData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      if (!profile?.storeId) return;

      setLoading(true);
      try {
        setReportData(await getPurchasesReport(profile.storeId, dateRange));
      } catch (error) {
        console.error('Error loading purchases report:', error);
        toast.error('Error al generar el reporte de compras');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [dateRange, profile?.storeId]);

  function handleExportExcel() {
    if (!reportData) return;
    exportPurchasesReportToExcel(reportData, dateRange);
  }

  async function handleExportPDF() {
    if (!reportData) return;
    try {
      await exportPurchasesReportToPDF(reportData, dateRange);
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('No se pudo generar el PDF');
    }
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

  const data = reportData;
  const hasPurchases = (data?.purchasesCount ?? 0) > 0;

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <IconChip icon={ShoppingBag} tone="warning" className="h-11 w-11" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Reporte de Compras
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Compras a proveedores por período, proveedor y producto.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
          <ExportButtons
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            disabled={!data}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={cardClass}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Total Compras
            </span>
            <IconChip icon={DollarSign} tone="accent" className="h-9 w-9" />
          </div>
          <DualCurrency
            ves={data?.totalLocal ?? 0}
            usd={data?.totalReference ?? 0}
            size="lg"
            align="left"
          />
        </div>

        <div className={cardClass}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Número de Compras
            </span>
            <IconChip icon={Receipt} tone="info" className="h-9 w-9" />
          </div>
          <p className="font-mono text-2xl font-bold text-gray-900 tabular-nums dark:text-slate-100">
            {data?.purchasesCount ?? 0}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Promedio: {formatVes(data?.averageLocal ?? 0)}
          </p>
        </div>

        <div className={cardClass}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Compras a Crédito
            </span>
            <IconChip icon={Clock} tone="warning" className="h-9 w-9" />
          </div>
          <DualCurrency
            ves={data?.creditLocal ?? 0}
            usd={data?.creditReference ?? 0}
            size="lg"
            align="left"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            {data?.creditCount ?? 0} compras
          </p>
        </div>

        <div className={cardClass}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              Devoluciones
            </span>
            <IconChip icon={Undo2} tone="danger" className="h-9 w-9" />
          </div>
          <DualCurrency
            ves={data?.returnsLocal ?? 0}
            usd={data?.returnsReference ?? 0}
            size="lg"
            align="left"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            {data?.returnsCount ?? 0} devoluciones · Neto{' '}
            {formatVes(data?.netLocal ?? 0)}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={cardClass}>
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-slate-200">
            Compras por Día
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.byDay ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={formatVes} />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalLocal"
                stroke="#1f7a59"
                name="Compras (VES)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={cardClass}>
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-slate-200">
            Top Proveedores
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={(data?.bySupplier ?? []).slice(0, 5)}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={110} />
              <Tooltip formatter={formatVes} />
              <Legend />
              <Bar dataKey="totalLocal" fill="#1f7a59" name="Compras (VES)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={cardClass}>
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-slate-200">
            Métodos de Pago
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={(data?.byPaymentMethod ?? []).map((method) => ({
                  ...method,
                  label: PAYMENT_METHOD_LABELS[method.method] ?? method.method,
                }))}
                dataKey="totalLocal"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {(data?.byPaymentMethod ?? []).map((method, index) => (
                  <Cell
                    key={method.method}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={formatVes} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={cardClass}>
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-slate-200">
            Número de Compras por Día
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.byDay ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#f59e0b" name="Compras" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detalle por proveedor */}
      <div className={`space-y-4 ${cardClass}`}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200">
          Detalle por Proveedor
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm dark:border-slate-800">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-950">
              <tr>
                <th className={`${thClass} text-left`}>Proveedor</th>
                <th className={`${thClass} text-right`}>Compras</th>
                <th className={`${thClass} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {!hasPurchases ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center">
                    <Truck className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-slate-700" />
                    <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
                      No hay compras en este período
                    </p>
                  </td>
                </tr>
              ) : (
                data!.bySupplier.map((supplier) => (
                  <tr
                    key={supplier.supplierId}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">
                      {supplier.name}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 tabular-nums dark:text-slate-100">
                      {supplier.count}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DualCurrency
                        ves={supplier.totalLocal}
                        usd={supplier.totalReference}
                        size="sm"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle por producto */}
      <div className={`space-y-4 ${cardClass}`}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200">
          Productos Más Comprados
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm dark:border-slate-800">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-950">
              <tr>
                <th className={`${thClass} text-left`}>Producto</th>
                <th className={`${thClass} text-right`}>Cantidad</th>
                <th className={`${thClass} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {!hasPurchases ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center">
                    <Package className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-slate-700" />
                    <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
                      No hay datos para este período
                    </p>
                  </td>
                </tr>
              ) : (
                data!.byProduct.map((product) => (
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
                    <td className="px-4 py-3 text-right">
                      <DualCurrency
                        ves={product.totalLocal}
                        usd={product.totalReference}
                        size="sm"
                      />
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
