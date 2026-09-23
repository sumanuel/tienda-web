/**
 * Tabla de Clientes con búsqueda, ordenamiento y paginación
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
import { Customer } from '@/types/customer';
import { Search, Edit, Trash2, Eye, Users } from 'lucide-react';
import { StatusPill } from '@/components/common/StatusPill';

interface CustomersTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onView: (customer: Customer) => void;
}

export default function CustomersTable({
  customers,
  onEdit,
  onDelete,
  onView,
}: CustomersTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: (info) => (
          <span className="font-medium text-gray-900 dark:text-slate-100">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'document',
        header: 'Documento',
        cell: (info) => (
          <span className="font-mono text-sm text-gray-700 dark:text-slate-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Teléfono',
        cell: (info) => (
          <span className="text-gray-600 dark:text-slate-400">
            {(info.getValue() as string) || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: (info) => (
          <span className="text-sm text-gray-600 dark:text-slate-400">
            {(info.getValue() as string) || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'balance',
        header: 'Por Cobrar',
        cell: (info) => {
          const balance = info.getValue() as number;
          return (
            <StatusPill tone={balance > 0 ? 'warn' : 'ok'}>
              ${balance.toFixed(2)}
            </StatusPill>
          );
        },
      },
      {
        accessorKey: 'creditLimit',
        header: 'Límite Crédito',
        cell: (info) => {
          const limit = info.getValue() as number | undefined;
          return (
            <span className="font-mono text-sm text-gray-600 dark:text-slate-400">
              {limit ? `$${limit.toFixed(2)}` : '—'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => onView(row.original)}
              className="hover:border-tsuma-primary hover:text-tsuma-primary flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors dark:border-slate-700 dark:text-slate-300"
              title="Ver historial"
            >
              <Eye size={13} />
            </button>
            <button
              onClick={() => onEdit(row.original)}
              className="hover:border-tsuma-primary hover:text-tsuma-primary flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors dark:border-slate-700 dark:text-slate-300"
              title="Editar"
            >
              <Edit size={13} />
            </button>
            <button
              onClick={() => {
                if (confirm(`¿Eliminar cliente ${row.original.name}?`)) {
                  onDelete(row.original.id);
                }
              }}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-300"
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete, onView]
  );

  const table = useReactTable({
    data: customers,
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
            Base de clientes
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Busca, consulta historial y edita datos clave.
          </p>
        </div>
        <div className="rounded-full bg-gray-100 px-3 py-1 font-mono text-xs font-medium text-gray-600 dark:bg-slate-800 dark:text-slate-400">
          {customers.length} registros
        </div>
      </div>

      <div className="relative">
        <Search
          className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 dark:text-slate-500"
          size={20}
        />
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar por nombre, documento, teléfono o email..."
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
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Users className="mb-4 h-12 w-12 text-gray-300 dark:text-slate-700" />
                    <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
                      {globalFilter
                        ? 'No se encontraron clientes'
                        : 'No hay clientes registrados'}
                    </p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
                      {globalFilter
                        ? 'Prueba con otro criterio de búsqueda.'
                        : 'Agrega tu primer cliente para empezar a vender a crédito.'}
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

      {/* Paginación */}
      {table.getRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Mostrando {table.getRowModel().rows.length} de {customers.length}{' '}
            clientes
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
      )}
    </div>
  );
}
