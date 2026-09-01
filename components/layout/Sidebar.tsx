'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  TruckIcon,
  BarChart3,
  Settings,
  Store,
  PackageSearch,
  History,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Receipt,
  CreditCard,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/pos', icon: ShoppingCart, label: 'Punto de Venta' },
  { href: '/dashboard/sales', icon: Receipt, label: 'Historial de Ventas' },
  { href: '/dashboard/products', icon: Package, label: 'Productos' },
  // Inventario como sección expandible
  {
    label: 'Inventario',
    icon: PackageSearch,
    submenu: [
      { href: '/dashboard/inventory/movements', label: 'Movimientos' },
      { href: '/dashboard/inventory/kardex', label: 'Kardex' },
      { href: '/dashboard/inventory/valuation', label: 'Valorización' },
    ],
  },
  { href: '/dashboard/customers', icon: Users, label: 'Clientes' },
  { href: '/dashboard/suppliers', icon: TruckIcon, label: 'Proveedores' },
  // Finanzas como sección expandible
  {
    label: 'Finanzas',
    icon: DollarSign,
    submenu: [
      { href: '/dashboard/accounts-receivable', label: 'Cuentas x Cobrar' },
      { href: '/dashboard/accounts-payable', label: 'Cuentas x Pagar' },
    ],
    Finanzas: true,
  },
  {
    href: '/dashboard/exchange-rates',
    icon: ArrowRightLeft,
    label: 'Tasas de Cambio',
  },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Reportes' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configuración' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Inventario: true, // Expandido por defecto
  });

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white shadow-sm">
      {/* Logo */}
      <div className="from-tsuma-primary to-tsuma-primary-dark flex h-16 items-center border-b border-gray-200 bg-gradient-to-r px-6">
        <Store className="mr-2 h-7 w-7 text-white drop-shadow-md" />
        <span className="text-2xl font-bold text-white drop-shadow-md">
          T-Suma
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;

          // Si tiene submenu, renderizar con expansión
          if ('submenu' in item && item.submenu) {
            const isExpanded = expandedMenus[item.label];
            const hasActiveSubmenu = item.submenu.some(
              (sub) => pathname === sub.href
            );

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    'group flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                    hasActiveSubmenu
                      ? 'bg-tsuma-primary-light text-tsuma-primary-dark'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <div className="flex items-center">
                    <Icon
                      className={cn(
                        'mr-3 h-5 w-5 transition-colors',
                        hasActiveSubmenu
                          ? 'text-tsuma-primary'
                          : 'text-gray-500 group-hover:text-gray-700'
                      )}
                    />
                    {item.label}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-1 ml-4 space-y-1 overflow-hidden">
                    {item.submenu.map((subItem, index) => {
                      const isActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            'flex items-center rounded-lg px-4 py-2.5 text-sm transition-all duration-200',
                            'animate-slide-up',
                            isActive
                              ? 'bg-tsuma-primary text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          )}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="mr-2 h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                          {subItem.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Item normal sin submenu
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                'group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-tsuma-primary scale-[1.02] text-white shadow-md'
                  : 'text-gray-700 hover:scale-[1.01] hover:bg-gray-100 hover:text-gray-900 active:scale-[0.98]'
              )}
            >
              <Icon
                className={cn(
                  'mr-3 h-5 w-5 transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-gray-500 group-hover:text-gray-700'
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer decorativo */}
      <div className="from-tsuma-primary-bg border-t border-gray-200 bg-gradient-to-r to-white p-3">
        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
          <Store className="text-tsuma-primary h-5 w-5" />
          <p className="truncate text-sm font-medium text-gray-700">
            T-Suma Dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
