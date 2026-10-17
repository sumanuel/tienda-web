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
import { Product } from '@/types/product';
import { Pencil, Trash2, Search, Package } from 'lucide-react';
import { useConfirm } from '@/hooks/useConfirm';
import { StatusPill } from '@/components/common/StatusPill';
import { DualCurrency } from '@/components/common/DualCurrency';

interface ProductTableProps {
  products: Product[];
  pagination: PageInfo;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export default function ProductTable({
  products,
  pagination,
  onPageChange,
  search,
  onSearchChange,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const { confirm, dialog } = useConfirm();

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Código',
        cell: (info) => (
          <span className="font-mono text-sm whitespace-nowrap text-gray-700 dark:text-slate-300">
            {(info.getValue() as string) || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: (info) => (
          <div className="flex items-center gap-2">
            {info.row.original.imageUrl && (
              <img
                src={info.row.original.imageUrl}
                alt={info.getValue() as string}
                className="h-10 w-10 rounded object-cover"
              />
            )}
            <span className="font-medium">{info.getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Categoría',
        cell: (info) => (
          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-slate-800 dark:text-slate-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        id: 'price',
        header: 'Precio',
        accessorFn: (row) => row.prices.USD,
        cell: (info) => {
          const product = info.row.original;
          const usd = product.prices.USD;
          const ves = product.prices.VES;
          if (!usd && !ves) {
            return <span className="font-mono text-sm">—</span>;
          }
          return <DualCurrency ves={ves ?? 0} usd={usd ?? 0} size="sm" />;
        },
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: (info) => {
          const stock = info.getValue() as number;
          const min = info.row.original.stockMin;
          const isLow = stock <= min;

          if (stock <= 0) {
            return <StatusPill tone="crit">Agotado</StatusPill>;
          }
          if (isLow) {
            return <StatusPill tone="warn">{stock} und · bajo</StatusPill>;
          }
          return <StatusPill tone="ok">{stock} und</StatusPill>;
        },
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: (info) => (
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => onEdit(info.row.original)}
              className="hover:border-tsuma-primary hover:text-tsuma-primary flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors dark:border-slate-700 dark:text-slate-300"
            >
              <Pencil size={13} />
              Editar
            </button>
            <button
              onClick={async () => {
                const ok = await confirm({
                  title: `¿Eliminar producto "${info.row.original.name}"?`,
                  description: 'Esta acción no se puede deshacer.',
                  confirmLabel: 'Eliminar',
                  destructive: true,
                });
                if (ok) onDelete(info.row.original.id);
              }}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-300"
            >
              <Trash2 size={13} />
              Eliminar
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete, confirm]
  );

  const table = useReactTable({
    data: products,
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
            Catálogo
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Busca rápido por código, nombre o categoría.
          </p>
        </div>
        <div className="rounded-full bg-gray-100 px-3 py-1 font-mono text-xs font-medium text-gray-600 dark:bg-slate-800 dark:text-slate-400">
          {pagination.total} productos totales
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 dark:text-slate-500"
            size={20}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar productos..."
            className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-4 pl-10 text-sm focus:bg-white focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-800">
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
            {table.getRowModel().rows.length > 0 ? (
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
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Package className="mb-4 h-12 w-12 text-gray-300 dark:text-slate-700" />
                    <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
                      No hay productos para mostrar
                    </p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
                      Ajusta la búsqueda o agrega tu primer producto.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls
        pagination={pagination}
        onPageChange={onPageChange}
        label="productos"
      />
      {dialog}
    </div>
  );
}
