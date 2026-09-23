'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Product } from '@/types/product';
import { Pencil, Trash2, Search, Package } from 'lucide-react';
import { StatusPill } from '@/components/common/StatusPill';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export default function ProductTable({
  products,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');

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
        header: 'Precio (USD)',
        accessorFn: (row) => row.prices.USD,
        cell: (info) => {
          const price = info.getValue() as number | null;
          return (
            <span className="font-mono text-sm tabular-nums">
              {price ? `$${price.toFixed(2)}` : '—'}
            </span>
          );
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
              onClick={() => {
                if (
                  confirm(`¿Eliminar producto "${info.row.original.name}"?`)
                ) {
                  onDelete(info.row.original.id);
                }
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
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data: products,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
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
          {products.length} productos totales
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
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-slate-400">
          Mostrando {table.getRowModel().rows.length} de {products.length}{' '}
          productos
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Anterior
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="bg-brand-primary hover:bg-brand-primary-dark rounded-lg px-3 py-1.5 text-sm text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-slate-700"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
