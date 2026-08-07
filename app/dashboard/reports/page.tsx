'use client';

import Link from 'next/link';
import { BarChart3, Package, DollarSign, TrendingUp } from 'lucide-react';

const reports = [
  {
    id: 'sales',
    title: 'Reporte de Ventas',
    description: 'Análisis detallado de ventas por período, producto y cliente',
    icon: BarChart3,
    href: '/dashboard/reports/sales',
    color: 'bg-blue-500',
  },
  {
    id: 'inventory',
    title: 'Reporte de Inventario',
    description: 'Valorización, stock y movimientos de inventario',
    icon: Package,
    href: '/dashboard/reports/inventory',
    color: 'bg-purple-500',
  },
  {
    id: 'financial',
    title: 'Reporte Financiero',
    description: 'Estado de resultados, rentabilidad y flujo de caja',
    icon: DollarSign,
    href: '/dashboard/reports/financial',
    color: 'bg-green-500',
  },
  {
    id: 'cash-flow',
    title: 'Flujo de Caja',
    description: 'Ingresos, egresos y saldo detallado',
    icon: TrendingUp,
    href: '/dashboard/reports/cash-flow',
    color: 'bg-orange-500',
  },
];

export default function ReportsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="mt-2 text-gray-600">
          Analiza el rendimiento de tu negocio con reportes detallados
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon;

          return (
            <Link
              key={report.id}
              href={report.href}
              className="block rounded-lg border-2 border-gray-200 bg-white p-6 transition-colors hover:border-gray-400"
            >
              <div className="flex items-start gap-4">
                <div className={`${report.color} rounded-lg p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    {report.title}
                  </h3>
                  <p className="text-gray-600">{report.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
