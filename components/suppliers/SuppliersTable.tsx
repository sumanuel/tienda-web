/**
 * Tabla de Proveedores con búsqueda, ordenamiento y paginación
 */

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
import { Supplier } from '@/types/supplier';
import { Search, Edit, Trash2, Eye } from 'lucide-react';

interface SuppliersTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
  onView: (supplier: Supplier) => void;
}

export default function SuppliersTable({
  suppliers,
  onEdit,
  onDelete,
  onView,
}: SuppliersTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: (info) => (
          <span className="font-medium text-gray-900">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'rif',
        header: 'RIF/NIT',
        cell: (info) => (
          <span className="text-gray-700">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'contactPerson',
        header: 'Contacto',
        cell: (info) => (
          <span className="text-gray-600">
            {(info.getValue() as string) || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Teléfono',
        cell: (info) => (
          <span className="text-gray-600">
            {(info.getValue() as string) || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: (info) => (
          <span className="text-sm text-gray-600">
            {(info.getValue() as string) || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'balance',
        header: 'Por Pagar',
        cell: (info) => {
          const balance = info.getValue() as number;
          return (
            <span
              className={
                balance > 0 ? 'font-semibold text-red-600' : 'text-gray-600'
              }
            >
              ${balance.toFixed(2)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => onView(row.original)}
              className="text-blue-600 transition-colors hover:text-blue-800"
              title="Ver productos"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={() => onEdit(row.original)}
              className="text-blue-600 transition-colors hover:text-blue-800"
              title="Editar"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => {
                if (confirm(`¿Eliminar proveedor ${row.original.name}?`)) {
                  onDelete(row.original.id);
                }
              }}
              className="text-red-600 transition-colors hover:text-red-800"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete, onView]
  );

  const table = useReactTable({
    data: suppliers,
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
      <div className="relative">
        <Search
          className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar por nombre, RIF, contacto, teléfono o email..."
          className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  {globalFilter
                    ? 'No se encontraron proveedores con ese criterio'
                    : 'No hay proveedores registrados'}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm text-gray-900"
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

      {/* Paginación */}
      {table.getRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {table.getRowModel().rows.length} de {suppliers.length}{' '}
            proveedores
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Anterior
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
