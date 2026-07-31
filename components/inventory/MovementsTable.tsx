'use client';

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { InventoryMovement } from '@/types/inventory';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

interface MovementsTableProps {
  movements: InventoryMovement[];
}

export default function MovementsTable({ movements }: MovementsTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<InventoryMovement>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Fecha',
        cell: (info) => format(info.getValue() as Date, 'dd/MM/yyyy HH:mm'),
      },
      {
        accessorKey: 'type',
        header: 'Tipo',
        cell: (info) => {
          const type = info.getValue() as string;
          const badge =
            type === 'entry'
              ? 'bg-green-100 text-green-700'
              : type === 'exit'
                ? 'bg-red-100 text-red-700'
                : type === 'sale'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700';

          const label =
            type === 'entry'
              ? 'Entrada'
              : type === 'exit'
                ? 'Salida'
                : type === 'sale'
                  ? 'Venta'
                  : 'Ajuste';

          return (
            <span className={`rounded px-2 py-1 text-xs font-medium ${badge}`}>
              {label}
            </span>
          );
        },
      },
      {
        header: 'Producto',
        accessorFn: (row) => `${row.productCode} - ${row.productName}`,
        cell: (info) => {
          const value = info.getValue() as string;
          return <span className="font-medium">{value}</span>;
        },
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
                  ? 'font-semibold text-green-600'
                  : 'font-semibold text-red-600'
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
      },
      {
        accessorKey: 'stockAfter',
        header: 'Stock Nuevo',
      },
      {
        accessorKey: 'reason',
        header: 'Razón',
        cell: (info) => info.getValue() || '—',
      },
      {
        accessorKey: 'userName',
        header: 'Usuario',
      },
    ],
    []
  );

  const table = useReactTable({
    data: movements,
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
        pageSize: 20,
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
            placeholder="Buscar movimientos..."
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
          Mostrando {table.getRowModel().rows.length} de {movements.length}{' '}
          movimientos
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
