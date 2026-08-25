'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProductFormData } from '@/types/product';
import { useState, useEffect } from 'react';
import { Upload, Calculator, DollarSign } from 'lucide-react';
import Image from 'next/image';
import {
  calculateProductPrices,
  formatPrice,
} from '@/lib/utils/priceCalculator';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useAuth } from '@/hooks/useAuth';

const productSchemaWithCalculations = z.object({
  code: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(1, 'Nombre es requerido'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoría es requerida'),
  cost: z
    .number()
    .min(0.01, 'Costo debe ser mayor a 0')
    .or(z.nan())
    .transform((val) => (isNaN(val) ? 0 : val)),
  costCurrency: z.enum(['VES', 'USD', 'EUR']),
  additionalCost: z
    .number()
    .min(0, 'Costo adicional debe ser mayor o igual a 0')
    .or(z.nan())
    .transform((val) => (isNaN(val) ? 0 : val)),
  margin: z
    .number()
    .min(0, 'Margen debe ser mayor o igual a 0')
    .max(1000, 'Margen debe ser menor a 1000%')
    .or(z.nan())
    .transform((val) => (isNaN(val) ? 30 : val)),
  iva: z
    .number()
    .min(0, 'IVA debe ser mayor o igual a 0')
    .max(100, 'IVA debe ser menor a 100%')
    .or(z.nan())
    .transform((val) => (isNaN(val) ? 0 : val)),
  stock: z
    .number()
    .min(0, 'Stock debe ser mayor o igual a 0')
    .or(z.nan())
    .transform((val) => (isNaN(val) ? 0 : val)),
  stockMin: z
    .number()
    .min(0, 'Stock mínimo debe ser mayor o igual a 0')
    .or(z.nan())
    .transform((val) => (isNaN(val) ? 0 : val)),
  trackInventory: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchemaWithCalculations>;

interface ProductFormWithCalculationsProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ProductFormWithCalculations({
  initialData,
  onSubmit,
  onCancel,
}: ProductFormWithCalculationsProps) {
  const { user } = useAuth();
  const { activeRate, loading: ratesLoading } = useExchangeRates(
    user?.activeStoreId || ''
  );

  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculatedPrices, setCalculatedPrices] = useState<{
    priceUSD: number;
    priceVES: number;
    priceEUR: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchemaWithCalculations),
    defaultValues: {
      code: initialData?.code || '',
      barcode: initialData?.barcode || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      cost: initialData?.cost || 0,
      costCurrency: (initialData?.costCurrency || 'USD') as
        'USD' | 'VES' | 'EUR',
      additionalCost: 0,
      margin: 30,
      iva: 0,
      stock: initialData?.stock || 0,
      stockMin: initialData?.stockMin || 5,
      trackInventory: initialData?.trackInventory ?? true,
    },
  });

  // Observar campos para cálculo en tiempo real
  const cost = useWatch({ control, name: 'cost' });
  const costCurrency = useWatch({ control, name: 'costCurrency' });
  const additionalCost = useWatch({ control, name: 'additionalCost' });
  const margin = useWatch({ control, name: 'margin' });
  const iva = useWatch({ control, name: 'iva' });
  const trackInventory = watch('trackInventory');

  // Calcular precios en tiempo real
  useEffect(() => {
    if (!activeRate || !cost || cost <= 0) {
      setCalculatedPrices(null);
      return;
    }

    try {
      const prices = calculateProductPrices({
        cost,
        additionalCost: additionalCost || 0,
        costCurrency: costCurrency || 'USD',
        margin: margin || 30,
        iva: iva || 0,
        exchangeRates: {
          usdToVes: activeRate.usdToVes,
          eurToVes: activeRate.eurToVes,
        },
      });

      setCalculatedPrices(prices);
    } catch (error) {
      console.error('Error calculando precios:', error);
      setCalculatedPrices(null);
    }
  }, [cost, costCurrency, additionalCost, margin, iva, activeRate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo MIME
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen');
        return;
      }

      // Validar tamaño (máx 5MB)
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
    if (!calculatedPrices) {
      alert('Por favor verifica los datos de costo y margen');
      return;
    }

    setLoading(true);
    try {
      const formData: ProductFormData = {
        ...data,
        // Agregar campos de cálculo automático
        additionalCost: data.additionalCost,
        margin: data.margin,
        iva: data.iva,
        // Agregar precios calculados
        priceVES: calculatedPrices.priceVES,
        priceUSD: calculatedPrices.priceUSD,
        priceEUR: calculatedPrices.priceEUR,
        image: imageFile || undefined,
      };
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  if (ratesLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Cargando tasas de cambio...</p>
      </div>
    );
  }

  if (!activeRate) {
    return (
      <div className="border-warning bg-warning/10 rounded-lg border p-6">
        <p className="text-warning text-sm">
          No hay tasas de cambio configuradas. Por favor configura la tasa USD →
          VES antes de crear productos.
        </p>
      </div>
    );
  }

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
            className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Código de Barras
          </label>
          <input
            {...register('barcode')}
            type="text"
            className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
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
          className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
        />
        {errors.name && (
          <p className="text-error mt-1 text-sm">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Categoría *
        </label>
        <select
          {...register('category')}
          className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
        >
          <option value="">Seleccionar categoría</option>
          <option value="Electrónica">Electrónica</option>
          <option value="Alimentos">Alimentos</option>
          <option value="Ropa">Ropa</option>
          <option value="Hogar">Hogar</option>
          <option value="Otros">Otros</option>
        </select>
        {errors.category && (
          <p className="text-error mt-1 text-sm">{errors.category.message}</p>
        )}
      </div>

      {/* Cálculo de Precios */}
      <div className="border-brand-primary bg-brand-primary-light rounded-lg border-2 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="text-brand-primary h-5 w-5" />
          <h3 className="text-brand-primary font-semibold">
            Cálculo Automático de Precios
          </h3>
        </div>

        <div className="space-y-4">
          {/* Costo */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Costo Base *
              </label>
              <input
                {...register('cost', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
              />
              {errors.cost && (
                <p className="text-error mt-1 text-sm">{errors.cost.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Moneda
              </label>
              <select
                {...register('costCurrency')}
                className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
              >
                <option value="USD">USD</option>
                <option value="VES">VES</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Costo Adicional */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Costo Adicional (Flete, Impuestos, etc.)
            </label>
            <input
              {...register('additionalCost', { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
            />
          </div>

          {/* Margen e IVA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Margen de Ganancia (%) *
              </label>
              <input
                {...register('margin', { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder="30"
                className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
              />
              {errors.margin && (
                <p className="text-error mt-1 text-sm">
                  {errors.margin.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                IVA (%)
              </label>
              <input
                {...register('iva', { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder="0"
                className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
              />
            </div>
          </div>

          {/* Precios Calculados */}
          {calculatedPrices && (
            <div className="border-brand-primary mt-6 rounded-lg border bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="text-brand-primary h-4 w-4" />
                <p className="text-sm font-semibold text-gray-700">
                  Precios de Venta Calculados
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">VES</p>
                  <p className="text-brand-primary text-lg font-bold">
                    {formatPrice(calculatedPrices.priceVES, 'VES')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">USD</p>
                  <p className="text-brand-primary text-lg font-bold">
                    {formatPrice(calculatedPrices.priceUSD, 'USD')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">EUR</p>
                  <p className="text-brand-primary text-lg font-bold">
                    {formatPrice(calculatedPrices.priceEUR, 'EUR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inventario */}
      <div className="rounded-lg border border-gray-200 p-4">
        <div className="mb-4 flex items-center gap-2">
          <input
            {...register('trackInventory')}
            type="checkbox"
            id="trackInventory"
            className="text-brand-primary focus:ring-brand-primary h-4 w-4 rounded border-gray-300"
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
                className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
              />
              {errors.stock && (
                <p className="text-error mt-1 text-sm">
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
                className="focus:border-brand-primary focus:ring-brand-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-1 focus:outline-none"
              />
              {errors.stockMin && (
                <p className="text-error mt-1 text-sm">
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
          disabled={loading || !calculatedPrices}
          className="bg-brand-primary hover:bg-brand-primary-dark rounded-lg px-6 py-2 text-white transition-colors disabled:bg-gray-400"
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
          className="rounded-lg border border-gray-300 px-6 py-2 transition-colors hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
