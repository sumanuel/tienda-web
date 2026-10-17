/**
 * Tabla de Proveedores con búsqueda, ordenamiento y paginación
 */

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
import { Supplier } from '@/types/supplier';
import { Search, Edit, Trash2, Eye, TruckIcon } from 'lucide-react';
import { useConfirm } from '@/hooks/useConfirm';
import { DualCurrency } from '@/components/common/DualCurrency';

interface SuppliersTableProps {
  suppliers: Supplier[];
  pagination: PageInfo;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
  onView: (supplier: Supplier) => void;
  exchangeRate?: number;
}

export default function SuppliersTable({
  suppliers,
  pagination,
  onPageChange,
  search,
  onSearchChange,
  onEdit,
  onDelete,
  onView,
  exchangeRate,
}: SuppliersTableProps) {
  const { confirm, dialog } = useConfirm();

  const columns = useMemo<ColumnDef<Supplier>[]>(
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
        accessorKey: 'rif',
        header: 'RIF/NIT',
        cell: (info) => (
          <span className="font-mono text-sm text-gray-700 dark:text-slate-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'contactPerson',
        header: 'Contacto',
        cell: (info) => (
          <span className="text-gray-600 dark:text-slate-400">
            {(info.getValue() as string) || '—'}
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
        header: 'Por Pagar',
        cell: (info) => {
          const balance = info.getValue() as number;
          return (
            <DualCurrency
              usd={balance}
              exchangeRate={exchangeRate}
              size="sm"
              primaryClassName={
                balance > 0
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-tsuma-primary-dark'
              }
            />
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
              title="Ver productos"
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
              onClick={async () => {
                const ok = await confirm({
                  title: `¿Eliminar proveedor ${row.original.name}?`,
                  description: 'Esta acción no se puede deshacer.',
                  confirmLabel: 'Eliminar',
                  destructive: true,
                });
                if (ok) onDelete(row.original.id);
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
    [onEdit, onDelete, onView, exchangeRate, confirm]
  );

  const table = useReactTable({
    data: suppliers,
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
            Directorio de proveedores
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Consulta contactos, deudas y productos asociados.
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
          placeholder="Buscar por nombre, RIF, contacto, teléfono o email..."
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
                    <TruckIcon className="mb-4 h-12 w-12 text-gray-300 dark:text-slate-700" />
                    <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
                      {search
                        ? 'No se encontraron proveedores'
                        : 'No hay proveedores registrados'}
                    </p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
                      {search
                        ? 'Prueba con otro criterio de búsqueda.'
                        : 'Agrega tu primer proveedor para organizar compras y pagos.'}
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
      <PaginationControls
        pagination={pagination}
        onPageChange={onPageChange}
        label="proveedores"
      />
      {dialog}
    </div>
  );
}
