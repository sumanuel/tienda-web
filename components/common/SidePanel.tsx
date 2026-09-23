'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function SidePanel({
  open,
  onClose,
  title,
  subtitle,
  children,
}: SidePanelProps) {
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      {/* Scrim */}
      <div
        className={cn(
          'fixed inset-0 z-[80] bg-black/55 transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-panel-title"
        className={cn(
          'fixed top-0 right-0 z-[90] flex h-screen w-full max-w-[780px] flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-gray-200 p-5 dark:border-slate-800">
          <div className="min-w-0 flex-1">
            <h2
              id="side-panel-title"
              className="text-lg font-bold text-gray-900 dark:text-slate-100"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="-mt-1 -mr-1 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Cerrar panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </>
  );
}
