'use client';

import { KardexEntry } from '@/types/inventory';
import { format } from 'date-fns';

interface KardexViewProps {
  kardex: KardexEntry[];
  productName: string;
  productCode: string;
}

export default function KardexView({
  kardex,
  productName,
  productCode,
}: KardexViewProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Kardex de Producto</h2>
        <p className="text-gray-600">
          {productCode} - {productName}
        </p>
      </div>

      {kardex.length === 0 ? (
        <p className="py-8 text-center text-gray-500">
          No hay movimientos registrados para este producto
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Referencia
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Tipo
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Entrada
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Salida
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Saldo
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Costo Unit.
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kardex.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {format(entry.date, 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {entry.reference}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        entry.type === 'entry'
                          ? 'bg-green-100 text-green-700'
                          : entry.type === 'exit'
                            ? 'bg-red-100 text-red-700'
                            : entry.type === 'sale'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {entry.type === 'entry'
                        ? 'Entrada'
                        : entry.type === 'exit'
                          ? 'Salida'
                          : entry.type === 'sale'
                            ? 'Venta'
                            : 'Ajuste'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                    {entry.quantityIn > 0 ? entry.quantityIn : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-red-600">
                    {entry.quantityOut > 0 ? entry.quantityOut : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {entry.balance}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {entry.unitCost ? `$${entry.unitCost.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {entry.totalCost ? `$${entry.totalCost.toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
