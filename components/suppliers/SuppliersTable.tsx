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
import { Search, Edit, Trash2, Eye, TruckIcon } from 'lucide-react';

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
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                balance > 0
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
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
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onView(row.original)}
              className="hover:text-brand-primary rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
              title="Ver productos"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={() => onEdit(row.original)}
              className="hover:text-brand-primary rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
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
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
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
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Directorio de proveedores
          </h2>
          <p className="text-sm text-gray-500">
            Consulta contactos, deudas y productos asociados.
          </p>
        </div>
        <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {suppliers.length} registros
        </div>
      </div>

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
          className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-4 pl-10 text-sm focus:bg-white focus:ring-1 focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase"
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
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-center">
                    <TruckIcon className="mb-4 h-12 w-12 text-gray-300" />
                    <p className="text-lg font-medium text-gray-700">
                      {globalFilter
                        ? 'No se encontraron proveedores'
                        : 'No hay proveedores registrados'}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      {globalFilter
                        ? 'Prueba con otro criterio de búsqueda.'
                        : 'Agrega tu primer proveedor para organizar compras y pagos.'}
                    </p>
                  </div>
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
          <div className="text-sm text-gray-600">
            Mostrando {table.getRowModel().rows.length} de {suppliers.length}{' '}
            proveedores
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              Anterior
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="bg-brand-primary hover:bg-brand-primary-dark rounded-lg px-3 py-1.5 text-sm text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
