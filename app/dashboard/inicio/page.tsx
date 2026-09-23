'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Receipt,
  Package,
  PackageSearch,
  Users,
  TruckIcon,
  DollarSign,
  ArrowRightLeft,
  BarChart3,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { IconChip, type IconChipTone } from '@/components/common/IconChip';

interface LaunchCard {
  href: string;
  icon: typeof ShoppingCart;
  tone: IconChipTone;
  title: string;
  description: string;
}

const cards: LaunchCard[] = [
  {
    href: '/dashboard/pos',
    icon: ShoppingCart,
    tone: 'accent',
    title: 'Punto de Venta',
    description: 'Registra ventas rápidas y cobra con la tasa activa.',
  },
  {
    href: '/dashboard/sales',
    icon: Receipt,
    tone: 'accent',
    title: 'Historial de Ventas',
    description: 'Consulta y administra todas las ventas realizadas.',
  },
  {
    href: '/dashboard/products',
    icon: Package,
    tone: 'warning',
    title: 'Productos',
    description: 'Administra catálogo, precios y control de inventario.',
  },
  {
    href: '/dashboard/inventory/movements',
    icon: PackageSearch,
    tone: 'warning',
    title: 'Inventario',
    description: 'Movimientos, kardex y valorización de tu stock.',
  },
  {
    href: '/dashboard/customers',
    icon: Users,
    tone: 'neutral',
    title: 'Clientes',
    description: 'Datos de contacto, saldos pendientes e historial.',
  },
  {
    href: '/dashboard/suppliers',
    icon: TruckIcon,
    tone: 'neutral',
    title: 'Proveedores',
    description: 'Contactos, productos asociados y compromisos de pago.',
  },
  {
    href: '/dashboard/accounts-receivable',
    icon: DollarSign,
    tone: 'info',
    title: 'Cuentas',
    description: 'Cuentas por cobrar y por pagar de tu negocio.',
  },
  {
    href: '/dashboard/exchange-rates',
    icon: ArrowRightLeft,
    tone: 'info',
    title: 'Tasas de Cambio',
    description: 'Revisa y actualiza la tasa de cambio activa.',
  },
  {
    href: '/dashboard/reports',
    icon: BarChart3,
    tone: 'info',
    title: 'Reportes',
    description: 'Analiza el rendimiento de tu negocio en detalle.',
  },
  {
    href: '/dashboard/settings',
    icon: Settings,
    tone: 'info',
    title: 'Configuración',
    description: 'Ajusta las preferencias generales del sistema.',
  },
];

export default function InicioPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const now = new Date();
  const fecha = now.toLocaleDateString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const hora = now.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6 dark:bg-slate-950">
      {/* Hero */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            Buenas, {profile?.name || 'bienvenido'}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-slate-400">
            Panel de inicio de T-Suma. Entra al módulo que necesites: cada
            tarjeta te lleva directo a su pantalla.
          </p>
        </div>
        <div className="text-right font-mono text-xs tracking-wide text-gray-400 uppercase dark:text-slate-500">
          <p>{profile?.role || 'Usuario'}</p>
          <p className="capitalize">
            {fecha} · {hora}
          </p>
        </div>
      </div>

      {/* Grid de accesos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.href}
              onClick={() => router.push(card.href)}
              className="group hover:border-tsuma-primary relative flex min-h-[168px] flex-col gap-3 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="bg-tsuma-primary absolute top-0 bottom-0 left-0 w-[3px] origin-left scale-y-0 transition-transform duration-150 group-hover:scale-y-100" />

              <IconChip
                icon={Icon}
                tone={card.tone}
                className="h-11 w-11 rounded-xl"
                iconClassName="h-5 w-5"
              />

              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-slate-400">
                  {card.description}
                </p>
              </div>

              <span className="text-tsuma-primary mt-auto flex items-center gap-1 font-mono text-xs font-semibold tracking-wide uppercase">
                Entrar
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
