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
import { Pencil, Trash2, Search } from 'lucide-react';
import Link from 'next/link';

interface ProductTableProps {
  products: Product[];
  onDelete: (productId: string) => void;
}

export default function ProductTable({
  products,
  onDelete,
}: ProductTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Código',
        cell: (info) => (
          <span className="font-mono text-sm">{info.getValue() as string}</span>
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
      },
      {
        header: 'Precio (USD)',
        accessorFn: (row) => row.prices.USD,
        cell: (info) => {
          const price = info.getValue() as number | null;
          return price ? `$${price.toFixed(2)}` : '—';
        },
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: (info) => {
          const stock = info.getValue() as number;
          const min = info.row.original.stockMin;
          const isLow = stock <= min;

          return (
            <span
              className={`rounded px-2 py-1 text-sm font-medium ${
                isLow
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {stock}
              {isLow && ' ⚠️'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: (info) => (
          <div className="flex gap-2">
            <Link
              href={`/dashboard/products/${info.row.original.id}/edit`}
              className="rounded p-1 text-blue-600 hover:bg-blue-50"
            >
              <Pencil size={18} />
            </Link>
            <button
              onClick={() => {
                if (
                  confirm(`¿Eliminar producto "${info.row.original.name}"?`)
                ) {
                  onDelete(info.row.original.id);
                }
              }}
              className="rounded p-1 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    [onDelete]
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
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
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
          <tbody className="divide-y divide-gray-200 bg-white">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-gray-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Mostrando {table.getRowModel().rows.length} de {products.length}{' '}
          productos
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:bg-gray-300"
          >
            Anterior
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:bg-gray-300"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
