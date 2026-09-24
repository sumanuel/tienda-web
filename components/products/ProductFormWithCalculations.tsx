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

const inputClassName =
  'w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:border-brand-primary focus:bg-white dark:bg-slate-900 dark:focus:bg-slate-900 focus:ring-1 focus:ring-brand-primary focus:outline-none';

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
  const { profile } = useAuth();
  const { activeRate, loading: ratesLoading } = useExchangeRates(
    profile?.storeId || ''
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
      <div className="space-y-4">
        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-6 w-48 rounded bg-gray-200 dark:bg-slate-700" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="h-11 rounded bg-gray-100 dark:bg-slate-800" />
            <div className="h-11 rounded bg-gray-100 dark:bg-slate-800" />
            <div className="h-11 rounded bg-gray-100 md:col-span-2 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!activeRate || activeRate.usdToVes === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950">
          <div className="flex items-start gap-3">
            <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <p className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                ¡Tasa de cambio USD no configurada!
              </p>
              <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                Para crear productos necesitas configurar la tasa de cambio USD
                → VES. Esta tasa es <strong>obligatoria</strong> para calcular
                precios automáticamente y gestionar ventas, cuentas por pagar y
                cobrar.
              </p>
              <a
                href="/dashboard/exchange-rates"
                className="bg-brand-primary hover:bg-brand-primary-dark mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                Configurar Tasa USD → VES Ahora
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 font-semibold text-gray-700 dark:text-slate-300">
            ¿Por qué es obligatoria la tasa USD?
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-brand-primary mt-1">•</span>
              <span>
                <strong>Precios múltiples monedas:</strong> Los productos tienen
                precios en VES, USD y EUR calculados automáticamente
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-primary mt-1">•</span>
              <span>
                <strong>Ventas en cualquier moneda:</strong> Permite vender y
                cobrar en VES o USD
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-primary mt-1">•</span>
              <span>
                <strong>Cuentas por pagar/cobrar:</strong> Registra deudas y
                créditos en múltiples monedas
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-primary mt-1">•</span>
              <span>
                <strong>Reportes unificados:</strong> Consolida todas las
                operaciones con tasa actualizada
              </span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <fieldset className="space-y-5 rounded-2xl border border-gray-200 p-5 dark:border-slate-800">
        <legend className="px-1 text-sm font-semibold text-gray-700 dark:text-slate-300">
          Información general
        </legend>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Imagen del producto
            </label>
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-950">
              {imagePreview ? (
                <div className="relative h-full w-full overflow-hidden rounded-2xl">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="text-center text-sm text-gray-400 dark:text-slate-400 dark:text-slate-500">
                  <Upload className="mx-auto mb-2 h-7 w-7" />
                  Sin imagen
                </div>
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800">
              <Upload size={18} />
              Subir imagen
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Código
                </label>
                <input
                  {...register('code')}
                  type="text"
                  className={inputClassName}
                />
                <p className="mt-1 text-xs text-gray-400 dark:text-slate-400 dark:text-slate-500">
                  Se genera si lo dejas vacío.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Código de barras
                </label>
                <input
                  {...register('barcode')}
                  type="text"
                  className={inputClassName}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Nombre *
              </label>
              <input
                {...register('name')}
                type="text"
                className={inputClassName}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Descripción
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className={inputClassName}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Categoría *
              </label>
              <select {...register('category')} className={inputClassName}>
                <option value="">Seleccionar categoría</option>
                <option value="Electrónica">Electrónica</option>
                <option value="Alimentos">Alimentos</option>
                <option value="Ropa">Ropa</option>
                <option value="Hogar">Hogar</option>
                <option value="Otros">Otros</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.category.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className="border-brand-primary/30 bg-brand-primary-light/40 rounded-2xl border p-6">
        <legend className="text-brand-primary px-1 text-sm font-semibold">
          Precios y cálculo automático
        </legend>
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
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Costo Base *
              </label>
              <input
                {...register('cost', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className={inputClassName}
              />
              {errors.cost && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.cost.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Moneda
              </label>
              <select {...register('costCurrency')} className={inputClassName}>
                <option value="USD">USD</option>
                <option value="VES">VES</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Costo Adicional */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Costo Adicional (Flete, Impuestos, etc.)
            </label>
            <input
              {...register('additionalCost', { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="0.00"
              className={inputClassName}
            />
          </div>

          {/* Margen e IVA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Margen de Ganancia (%) *
              </label>
              <input
                {...register('margin', { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder="30"
                className={inputClassName}
              />
              {errors.margin && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.margin.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                IVA (%)
              </label>
              <input
                {...register('iva', { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder="0"
                className={inputClassName}
              />
            </div>
          </div>

          {/* Precios Calculados */}
          {calculatedPrices && (
            <div className="border-brand-primary mt-6 rounded-lg border bg-white p-4 dark:bg-slate-900">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="text-brand-primary h-4 w-4" />
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  Precios de Venta Calculados
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    VES
                  </p>
                  <p className="text-brand-primary text-lg font-bold">
                    {formatPrice(calculatedPrices.priceVES, 'VES')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    USD
                  </p>
                  <p className="text-brand-primary text-lg font-bold">
                    {formatPrice(calculatedPrices.priceUSD, 'USD')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    EUR
                  </p>
                  <p className="text-brand-primary text-lg font-bold">
                    {formatPrice(calculatedPrices.priceEUR, 'EUR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800">
        <legend className="px-1 text-sm font-semibold text-gray-700 dark:text-slate-300">
          Inventario
        </legend>
        <div className="mb-4 flex items-center gap-2">
          <input
            {...register('trackInventory')}
            type="checkbox"
            id="trackInventory"
            className="text-brand-primary focus:ring-brand-primary h-4 w-4 rounded border-gray-300 dark:border-slate-700"
          />
          <label
            htmlFor="trackInventory"
            className="text-sm font-medium text-gray-700 dark:text-slate-300"
          >
            Controlar inventario
          </label>
        </div>

        {trackInventory && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Stock Actual *
              </label>
              <input
                {...register('stock', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                className={inputClassName}
              />
              {errors.stock && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.stock.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Stock Mínimo *
              </label>
              <input
                {...register('stockMin', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                className={inputClassName}
              />
              {errors.stockMin && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.stockMin.message}
                </p>
              )}
            </div>
          </div>
        )}
      </fieldset>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-primary hover:bg-brand-primary-dark rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:bg-gray-400 dark:bg-slate-600"
        >
          {loading
            ? 'Guardando...'
            : initialData
              ? 'Actualizar producto'
              : 'Crear producto'}
        </button>
      </div>
    </form>
  );
}
