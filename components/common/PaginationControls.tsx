'use client';

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import type { PageInfo } from '@/hooks/usePagedList';

interface PaginationControlsProps {
  pagination: PageInfo;
  onPageChange: (page: number) => void;
  // Nombre en plural para el texto "Mostrando 1 - 10 de 45 productos"
  label: string;
  className?: string;
}

const buttonClass =
  'rounded-lg border border-gray-200 p-1.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800';

export function PaginationControls({
  pagination,
  onPageChange,
  label,
  className,
}: PaginationControlsProps) {
  const { page, limit, total, pages } = pagination;
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className ?? ''}`}
    >
      <div className="text-sm text-gray-600 dark:text-slate-400">
        Mostrando {from} - {to} de {total} {label}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className={buttonClass}
          aria-label="Primera página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={buttonClass}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="px-2 font-mono text-xs text-gray-600 dark:text-slate-400">
          Página {page} de {pages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className={buttonClass}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(pages)}
          disabled={page >= pages}
          className={buttonClass}
          aria-label="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
