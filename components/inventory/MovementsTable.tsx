'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { PaginationControls } from '@/components/common/PaginationControls';
import type { PageInfo } from '@/hooks/usePagedList';
import { InventoryMovement, MovementType } from '@/types/inventory';
import { Search, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { StatusPill, StatusPillTone } from '@/components/common/StatusPill';

interface MovementsTableProps {
  movements: InventoryMovement[];
  pagination: PageInfo;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const typeMeta: Record<MovementType, { label: string; tone: StatusPillTone }> =
  {
    entry: { label: 'Entrada', tone: 'ok' },
    exit: { label: 'Salida', tone: 'crit' },
    sale: { label: 'Venta', tone: 'info' },
    adjustment: { label: 'Ajuste', tone: 'mute' },
    purchase: { label: 'Compra', tone: 'ok' },
    purchase_return: { label: 'Dev. Compra', tone: 'crit' },
  };

export default function MovementsTable({
  movements,
  pagination,
  onPageChange,
  search,
  onSearchChange,
}: MovementsTableProps) {
  const columns = useMemo<ColumnDef<InventoryMovement>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Fecha',
        cell: (info) => (
          <span className="font-mono text-sm whitespace-nowrap text-gray-700 dark:text-slate-300">
            {format(info.getValue() as Date, 'dd/MM/yyyy HH:mm')}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Tipo',
        cell: (info) => {
          const meta = typeMeta[info.getValue() as MovementType];
          return <StatusPill tone={meta.tone}>{meta.label}</StatusPill>;
        },
      },
      {
        header: 'Producto',
        accessorFn: (row) => `${row.productCode} - ${row.productName}`,
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-slate-100">
              {info.row.original.productName}
            </span>
            <span className="font-mono text-xs text-gray-500 dark:text-slate-500">
              {info.row.original.productCode || '—'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Cantidad',
        cell: (info) => {
          const qty = info.getValue() as number;
          return (
            <span
              className={
                qty > 0
                  ? 'text-tsuma-primary-dark font-mono text-sm font-semibold tabular-nums'
                  : 'font-mono text-sm font-semibold text-red-600 tabular-nums dark:text-red-400'
              }
            >
              {qty > 0 ? '+' : ''}
              {qty}
            </span>
          );
        },
      },
      {
        accessorKey: 'stockBefore',
        header: 'Stock Anterior',
        cell: (info) => (
          <span className="font-mono text-sm text-gray-600 tabular-nums dark:text-slate-400">
            {info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'stockAfter',
        header: 'Stock Nuevo',
        cell: (info) => (
          <span className="font-mono text-sm font-semibold text-gray-900 tabular-nums dark:text-slate-100">
            {info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Razón',
        cell: (info) => (
          <span className="text-sm text-gray-600 dark:text-slate-400">
            {(info.getValue() as string) || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'userName',
        header: 'Usuario',
        cell: (info) => (
          <span className="text-sm text-gray-600 dark:text-slate-400">
            {info.getValue() as string}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: movements,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    rowCount: pagination.total,
  });

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200">
            Registro de movimientos
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Entradas, salidas, ventas y ajustes de tu inventario.
          </p>
        </div>
        <div className="rounded-full bg-gray-100 px-3 py-1 font-mono text-xs font-medium text-gray-600 dark:bg-slate-800 dark:text-slate-400">
          {pagination.total} registros
        </div>
      </div>

      <div className="relative">
        <Search
          className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 dark:text-slate-500"
          size={20}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar movimientos..."
          className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-4 pl-10 text-sm focus:bg-white focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm dark:border-slate-800">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-950">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border-b border-gray-200 px-4 py-2.5 text-left font-mono text-[0.65rem] font-semibold tracking-widest whitespace-nowrap text-gray-500 uppercase dark:border-slate-800 dark:text-slate-500"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-center">
                    <ArrowRightLeft className="mb-4 h-12 w-12 text-gray-300 dark:text-slate-700" />
                    <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
                      {search
                        ? 'No se encontraron movimientos'
                        : 'No hay movimientos registrados'}
                    </p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
                      {search
                        ? 'Prueba con otro criterio de búsqueda.'
                        : 'Registra tu primer movimiento de inventario.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls
        pagination={pagination}
        onPageChange={onPageChange}
        label="movimientos"
      />
    </div>
  );
}
