'use client';

import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { LogOut, Menu } from 'lucide-react';
import { IconChip } from '@/components/common/IconChip';
import { ThemeToggle } from '@/components/common/ThemeToggle';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const initials =
    profile?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?';

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-brand-primary text-2xl font-bold">T-Suma</h1>
      </div>

      <div className="flex items-center space-x-2">
        <ThemeToggle />

        {/* User menu */}
        <div className="group relative">
          <button className="flex items-center space-x-2 rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <div className="bg-tsuma-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium dark:text-slate-100">
                {profile?.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {profile?.role}
              </p>
            </div>
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 hidden w-56 rounded-md border bg-white shadow-lg group-hover:block dark:border-slate-700 dark:bg-slate-900">
            <div className="p-2">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <IconChip icon={LogOut} tone="danger" className="h-7 w-7" />
                <span className="dark:text-slate-200">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
