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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/pos', icon: ShoppingCart, label: 'Punto de Venta' },
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
    <div className="flex h-screen w-64 flex-col border-r bg-slate-50">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Store className="mr-2 h-6 w-6 text-blue-600" />
        <span className="text-xl font-bold text-slate-900">TiendaWeb</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
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
                    'flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    hasActiveSubmenu
                      ? 'bg-slate-200 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-200'
                  )}
                >
                  <div className="flex items-center">
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-1 ml-4 space-y-1">
                    {item.submenu.map((subItem) => {
                      const isActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            'flex items-center rounded-lg px-4 py-2 text-sm transition-colors',
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 hover:bg-slate-200'
                          )}
                        >
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
                'flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-200'
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
