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

const inputClass =
  'focus:border-brand-primary focus:ring-brand-primary w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900';

const labelClass =
  'mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300';

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
        <label className={labelClass}>Tipo de Movimiento *</label>
        <select {...register('type')} className={inputClass}>
          <option value="entry">Entrada (Compra/Ajuste Positivo)</option>
          <option value="exit">Salida (Merma/Ajuste Negativo)</option>
          <option value="adjustment">Ajuste General</option>
        </select>
      </div>

      {/* Producto */}
      <div>
        <label className={labelClass}>Producto *</label>
        <select {...register('productId')} className={inputClass}>
          <option value="">Seleccionar producto</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.code} - {product.name} (Stock actual: {product.stock})
            </option>
          ))}
        </select>
        {errors.productId && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.productId.message}
          </p>
        )}
      </div>

      {/* Info del Producto Seleccionado */}
      {selectedProduct && (
        <div className="bg-tsuma-primary-light rounded-xl p-4">
          <p className="text-tsuma-primary-dark text-sm">
            <strong>Stock Actual:</strong> {selectedProduct.stock} unidades
          </p>
          <p className="text-tsuma-primary-dark text-sm">
            <strong>Stock Mínimo:</strong> {selectedProduct.stockMin} unidades
          </p>
          <p className="text-tsuma-primary-dark text-sm">
            <strong>Costo Unitario:</strong> ${selectedProduct.cost.toFixed(2)}
          </p>
        </div>
      )}

      {/* Cantidad */}
      <div>
        <label className={labelClass}>Cantidad *</label>
        <input
          {...register('quantity', { valueAsNumber: true })}
          type="number"
          min="1"
          step="1"
          className={inputClass}
        />
        {errors.quantity && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.quantity.message}
          </p>
        )}
      </div>

      {/* Costo Unitario (solo para entradas) */}
      {movementType === 'entry' && (
        <div>
          <label className={labelClass}>Costo Unitario (opcional)</label>
          <input
            {...register('unitCost', { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            placeholder={selectedProduct ? `${selectedProduct.cost}` : '0.00'}
            className={inputClass}
          />
        </div>
      )}

      {/* Razón */}
      <div>
        <label className={labelClass}>Razón</label>
        <input
          {...register('reason')}
          type="text"
          placeholder="Ej: Compra a proveedor, Producto dañado, Ajuste de inventario"
          className={inputClass}
        />
      </div>

      {/* Notas */}
      <div>
        <label className={labelClass}>Notas</label>
        <textarea {...register('notes')} rows={3} className={inputClass} />
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-primary hover:bg-brand-primary-dark rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-slate-700"
        >
          {loading ? 'Registrando...' : 'Registrar Movimiento'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
