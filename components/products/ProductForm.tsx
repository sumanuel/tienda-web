'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProductFormData } from '@/types/product';
import { useState } from 'react';
import { Upload } from 'lucide-react';
import Image from 'next/image';

const productSchema = z.object({
  code: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(1, 'Nombre es requerido'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoría es requerida'),
  priceVES: z.number().optional(),
  priceUSD: z.number().min(0, 'Precio debe ser positivo').optional(),
  priceEUR: z.number().optional(),
  cost: z.number().min(0, 'Costo debe ser positivo'),
  costCurrency: z.enum(['VES', 'USD', 'EUR']),
  stock: z.number().min(0, 'Stock debe ser positivo'),
  stockMin: z.number().min(0, 'Stock mínimo debe ser positivo'),
  trackInventory: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: initialData?.code || '',
      barcode: initialData?.barcode || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      priceUSD: initialData?.priceUSD || 0,
      cost: initialData?.cost || 0,
      costCurrency: (initialData?.costCurrency || 'USD') as
        'USD' | 'VES' | 'EUR',
      stock: initialData?.stock || 0,
      stockMin: initialData?.stockMin || 5,
      trackInventory: initialData?.trackInventory ?? true,
    },
  });

  const trackInventory = watch('trackInventory');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ✅ Validar tipo MIME
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen');
        return;
      }

      // ✅ Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande (máximo 5MB)');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (data: ProductFormValues) => {
    setLoading(true);
    try {
      const formData: ProductFormData = {
        ...data,
        image: imageFile || undefined,
      };
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Imagen */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Imagen del Producto
        </label>
        <div className="flex items-center gap-4">
          {imagePreview && (
            <div className="relative h-24 w-24">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="rounded object-cover"
              />
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
            <Upload size={20} />
            <span className="text-sm">Subir Imagen</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Información Básica */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Código (auto-generado si vacío)
          </label>
          <input
            {...register('code')}
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Código de Barras
          </label>
          <input
            {...register('barcode')}
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Nombre *
        </label>
        <input
          {...register('name')}
          type="text"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Categoría *
        </label>
        <select
          {...register('category')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Seleccionar categoría</option>
          <option value="Electrónica">Electrónica</option>
          <option value="Alimentos">Alimentos</option>
          <option value="Ropa">Ropa</option>
          <option value="Hogar">Hogar</option>
          <option value="Otros">Otros</option>
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      {/* Precios */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="mb-4 font-semibold text-gray-700">Precios de Venta</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Precio USD *
            </label>
            <input
              {...register('priceUSD', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Costo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Costo *
          </label>
          <input
            {...register('cost', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {errors.cost && (
            <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Moneda del Costo
          </label>
          <select
            {...register('costCurrency')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="USD">USD</option>
            <option value="VES">VES</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      {/* Inventario */}
      <div className="rounded-lg border border-gray-200 p-4">
        <div className="mb-4 flex items-center gap-2">
          <input
            {...register('trackInventory')}
            type="checkbox"
            id="trackInventory"
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <label
            htmlFor="trackInventory"
            className="text-sm font-medium text-gray-700"
          >
            Controlar inventario
          </label>
        </div>

        {trackInventory && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Stock Actual *
              </label>
              <input
                {...register('stock', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.stock.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Stock Mínimo *
              </label>
              <input
                {...register('stockMin', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              {errors.stockMin && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.stockMin.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading
            ? 'Guardando...'
            : initialData
              ? 'Actualizar'
              : 'Crear Producto'}
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
