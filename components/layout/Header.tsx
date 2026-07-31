'use client';

import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { LogOut, User } from 'lucide-react';

export function Header() {
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
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* User menu */}
        <div className="group relative">
          <button className="flex items-center space-x-2 rounded-lg px-3 py-2 hover:bg-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
              {initials}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{profile?.name}</p>
              <p className="text-xs text-slate-500">{profile?.role}</p>
            </div>
          </button>

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 hidden w-56 rounded-md border bg-white shadow-lg group-hover:block">
            <div className="p-2">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center rounded px-3 py-2 text-sm hover:bg-slate-100"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
