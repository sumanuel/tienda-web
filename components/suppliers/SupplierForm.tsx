/**
 * Formulario de Proveedor - Crear/Editar
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SupplierFormData } from '@/types/supplier';

const inputClassName =
  'mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:border-brand-primary focus:bg-white dark:bg-slate-900 dark:focus:bg-slate-900 focus:ring-1 focus:ring-brand-primary focus:outline-none';

const supplierSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  rif: z.string().min(5, 'RIF requerido (mínimo 5 caracteres)'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  initialData?: SupplierFormData;
  onSubmit: (data: SupplierFormData) => Promise<void>;
  onCancel: () => void;
}

export default function SupplierForm({
  initialData,
  onSubmit,
  onCancel,
}: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: initialData || {
      name: '',
      rif: '',
      phone: '',
      email: '',
      contactPerson: '',
      notes: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <fieldset className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800">
        <legend className="px-1 text-sm font-semibold text-gray-700 dark:text-slate-300">
          Información general
        </legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              className={inputClassName}
              placeholder="Distribuidora XYZ C.A."
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              RIF/NIT <span className="text-red-500">*</span>
            </label>
            <input
              {...register('rif')}
              className={inputClassName}
              placeholder="J-12345678-9"
            />
            {errors.rif && (
              <p className="mt-1 text-xs text-red-500">{errors.rif.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Teléfono
            </label>
            <input
              {...register('phone')}
              type="tel"
              className={inputClassName}
              placeholder="+58 212-1234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className={inputClassName}
              placeholder="ventas@proveedor.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Persona de Contacto
            </label>
            <input
              {...register('contactPerson')}
              className={inputClassName}
              placeholder="María González - Gerente de Ventas"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800">
        <legend className="px-1 text-sm font-semibold text-gray-700 dark:text-slate-300">
          Notas
        </legend>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
            Notas
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className={inputClassName}
            placeholder="Notas adicionales sobre el proveedor..."
          />
        </div>
      </fieldset>

      <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-200 pt-4 sm:flex-row dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-primary hover:bg-brand-primary-dark rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 dark:bg-slate-600"
        >
          {isSubmitting
            ? 'Guardando...'
            : initialData
              ? 'Actualizar Proveedor'
              : 'Crear Proveedor'}
        </button>
      </div>
    </form>
  );
}
