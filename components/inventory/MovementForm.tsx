'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InventoryMovementFormData, MovementType } from '@/types/inventory';
import { Product } from '@/types/product';

const movementSchema = z.object({
  productId: z.string().min(1, 'Producto es requerido'),
  type: z.enum(['entry', 'exit', 'adjustment']),
  quantity: z.number().min(1, 'Cantidad debe ser mayor a 0'),
  unitCost: z.number().min(0).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type MovementFormValues = z.infer<typeof movementSchema>;

interface MovementFormProps {
  products: Product[];
  onSubmit: (data: InventoryMovementFormData) => Promise<void>;
  onCancel: () => void;
}

export default function MovementForm({
  products,
  onSubmit,
  onCancel,
}: MovementFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: 'entry',
      quantity: 1,
    },
  });

  const movementType = watch('type');
  const productId = watch('productId');

  // Actualizar producto seleccionado
  useEffect(() => {
    if (productId) {
      const product = products.find((p) => p.id === productId);
      setSelectedProduct(product || null);
    }
  }, [productId, products]);

  const handleFormSubmit = async (data: MovementFormValues) => {
    setLoading(true);
    try {
      await onSubmit(data as InventoryMovementFormData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Tipo de Movimiento */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Tipo de Movimiento *
        </label>
        <select
          {...register('type')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="entry">Entrada (Compra/Ajuste Positivo)</option>
          <option value="exit">Salida (Merma/Ajuste Negativo)</option>
          <option value="adjustment">Ajuste General</option>
        </select>
      </div>

      {/* Producto */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Producto *
        </label>
        <select
          {...register('productId')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Seleccionar producto</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.code} - {product.name} (Stock actual: {product.stock})
            </option>
          ))}
        </select>
        {errors.productId && (
          <p className="mt-1 text-sm text-red-600">
            {errors.productId.message}
          </p>
        )}
      </div>

      {/* Info del Producto Seleccionado */}
      {selectedProduct && (
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-gray-700">
            <strong>Stock Actual:</strong> {selectedProduct.stock} unidades
          </p>
          <p className="text-sm text-gray-700">
            <strong>Stock Mínimo:</strong> {selectedProduct.stockMin} unidades
          </p>
          <p className="text-sm text-gray-700">
            <strong>Costo Unitario:</strong> ${selectedProduct.cost.toFixed(2)}
          </p>
        </div>
      )}

      {/* Cantidad */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Cantidad *
        </label>
        <input
          {...register('quantity', { valueAsNumber: true })}
          type="number"
          min="1"
          step="1"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        {errors.quantity && (
          <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
        )}
      </div>

      {/* Costo Unitario (solo para entradas) */}
      {movementType === 'entry' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Costo Unitario (opcional)
          </label>
          <input
            {...register('unitCost', { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            placeholder={selectedProduct ? `${selectedProduct.cost}` : '0.00'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* Razón */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Razón
        </label>
        <input
          {...register('reason')}
          type="text"
          placeholder="Ej: Compra a proveedor, Producto dañado, Ajuste de inventario"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Notas */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Notas
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Registrando...' : 'Registrar Movimiento'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
