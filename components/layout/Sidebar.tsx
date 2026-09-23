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
  DollarSign,
  ChevronDown,
  ChevronRight,
  Receipt,
  ArrowRightLeft,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconChip, type IconChipTone } from '@/components/common/IconChip';

interface MenuItemConfig {
  href?: string;
  icon: typeof LayoutDashboard;
  label: string;
  tone: IconChipTone;
  submenu?: { href: string; label: string }[];
}

interface MenuSection {
  label?: string;
  items: MenuItemConfig[];
}

const menuSections: MenuSection[] = [
  {
    items: [
      {
        href: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        tone: 'accent',
      },
    ],
  },
  {
    label: 'Ventas',
    items: [
      {
        href: '/dashboard/pos',
        icon: ShoppingCart,
        label: 'Punto de Venta',
        tone: 'accent',
      },
      {
        href: '/dashboard/sales',
        icon: Receipt,
        label: 'Historial de Ventas',
        tone: 'accent',
      },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      {
        href: '/dashboard/products',
        icon: Package,
        label: 'Productos',
        tone: 'warning',
      },
      {
        label: 'Inventario',
        icon: PackageSearch,
        tone: 'warning',
        submenu: [
          { href: '/dashboard/inventory/movements', label: 'Movimientos' },
          { href: '/dashboard/inventory/kardex', label: 'Kardex' },
          { href: '/dashboard/inventory/valuation', label: 'Valorización' },
        ],
      },
    ],
  },
  {
    label: 'Contactos',
    items: [
      {
        href: '/dashboard/customers',
        icon: Users,
        label: 'Clientes',
        tone: 'neutral',
      },
      {
        href: '/dashboard/suppliers',
        icon: TruckIcon,
        label: 'Proveedores',
        tone: 'neutral',
      },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      {
        label: 'Cuentas',
        icon: DollarSign,
        tone: 'info',
        submenu: [
          { href: '/dashboard/accounts-receivable', label: 'Cuentas x Cobrar' },
          { href: '/dashboard/accounts-payable', label: 'Cuentas x Pagar' },
        ],
      },
      {
        href: '/dashboard/exchange-rates',
        icon: ArrowRightLeft,
        label: 'Tasas de Cambio',
        tone: 'info',
      },
    ],
  },
  {
    label: 'Sistema',
    items: [
      {
        href: '/dashboard/reports',
        icon: BarChart3,
        label: 'Reportes',
        tone: 'info',
      },
      {
        href: '/dashboard/settings',
        icon: Settings,
        label: 'Configuración',
        tone: 'info',
      },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
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
    <>
      {/* Backdrop (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-gray-200 bg-white shadow-sm transition-transform duration-300 md:static md:translate-x-0 md:shadow-sm dark:border-slate-800 dark:bg-slate-900',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="from-tsuma-primary to-tsuma-primary-dark flex h-16 items-center justify-between border-b border-gray-200 bg-gradient-to-r px-6 dark:border-slate-800">
          <div className="flex items-center">
            <Store className="mr-2 h-7 w-7 text-white drop-shadow-md" />
            <span className="text-2xl font-bold text-white drop-shadow-md">
              T-Suma
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.label ?? `section-${sectionIndex}`}>
              {section.label && (
                <p className="px-3 pt-4 pb-1.5 font-mono text-[0.62rem] font-semibold tracking-[0.14em] text-gray-400 uppercase first:pt-1 dark:text-slate-500">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  // Si tiene submenu, renderizar con expansión
                  if (item.submenu) {
                    const isExpanded = expandedMenus[item.label];
                    const hasActiveSubmenu = item.submenu.some(
                      (sub) => pathname === sub.href
                    );

                    return (
                      <div key={item.label}>
                        <button
                          onClick={() => toggleMenu(item.label)}
                          className={cn(
                            'group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                            hasActiveSubmenu
                              ? 'bg-tsuma-primary-light text-tsuma-primary-dark'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                          )}
                        >
                          <div className="flex items-center">
                            <IconChip
                              icon={Icon}
                              tone={item.tone}
                              className="mr-3 h-8 w-8 rounded-lg"
                              iconClassName="h-4 w-4"
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
                          <div className="relative mt-1 ml-[1.65rem] space-y-0.5 overflow-hidden border-l border-gray-200 pl-3.5 dark:border-slate-700">
                            {item.submenu.map((subItem, index) => {
                              const isActive = pathname === subItem.href;
                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  onClick={onClose}
                                  className={cn(
                                    'flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200',
                                    'animate-slide-up',
                                    isActive
                                      ? 'bg-tsuma-primary text-white shadow-sm'
                                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                                  )}
                                  style={{ animationDelay: `${index * 0.05}s` }}
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
                      onClick={onClose}
                      className={cn(
                        'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-tsuma-primary scale-[1.02] text-white shadow-md'
                          : 'text-gray-700 hover:scale-[1.01] hover:bg-gray-100 hover:text-gray-900 active:scale-[0.98] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                      )}
                    >
                      {isActive ? (
                        <Icon className="mr-3 h-5 w-5 text-white" />
                      ) : (
                        <IconChip
                          icon={Icon}
                          tone={item.tone}
                          className="mr-3 h-8 w-8 rounded-lg"
                          iconClassName="h-4 w-4"
                        />
                      )}
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer decorativo */}
        <div className="from-tsuma-primary-bg border-t border-gray-200 bg-gradient-to-r to-white p-3 dark:border-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-slate-800">
            <Store className="text-tsuma-primary h-5 w-5" />
            <p className="truncate text-sm font-medium text-gray-700 dark:text-slate-300">
              T-Suma Dashboard
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
