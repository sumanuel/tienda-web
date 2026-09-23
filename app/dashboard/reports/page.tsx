'use client';

import Link from 'next/link';
import { BarChart3, Package, DollarSign, TrendingUp } from 'lucide-react';
import { IconChip, type IconChipTone } from '@/components/common/IconChip';

const reports: {
  id: string;
  title: string;
  description: string;
  icon: typeof BarChart3;
  href: string;
  tone: IconChipTone;
}[] = [
  {
    id: 'sales',
    title: 'Reporte de Ventas',
    description: 'Análisis detallado de ventas por período, producto y cliente',
    icon: BarChart3,
    href: '/dashboard/reports/sales',
    tone: 'accent',
  },
  {
    id: 'inventory',
    title: 'Reporte de Inventario',
    description: 'Valorización, stock y movimientos de inventario',
    icon: Package,
    href: '/dashboard/reports/inventory',
    tone: 'warning',
  },
  {
    id: 'financial',
    title: 'Reporte Financiero',
    description: 'Estado de resultados, rentabilidad y flujo de caja',
    icon: DollarSign,
    href: '/dashboard/reports/financial',
    tone: 'info',
  },
];

export default function ReportsPage() {
  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <IconChip icon={TrendingUp} tone="accent" className="h-11 w-11" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Reportes
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Analiza el rendimiento de tu negocio con reportes detallados.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon;

          return (
            <Link
              key={report.id}
              href={report.href}
              className="group hover:border-tsuma-primary flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <IconChip
                icon={Icon}
                tone={report.tone}
                className="h-12 w-12 rounded-xl"
                iconClassName="h-6 w-6"
              />

              <div className="flex-1">
                <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-slate-100">
                  {report.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {report.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
