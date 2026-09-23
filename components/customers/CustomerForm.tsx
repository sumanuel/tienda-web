/**
 * Formulario de Cliente - Crear/Editar
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomerFormData } from '@/types/customer';

const inputClassName =
  'mt-1 w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:border-brand-primary focus:bg-white dark:bg-slate-900 dark:focus:bg-slate-900 focus:ring-1 focus:ring-brand-primary focus:outline-none';

const customerSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  document: z.string().min(5, 'Documento requerido (mínimo 5 caracteres)'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  creditLimit: z.number().min(0, 'Límite debe ser >= 0').optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialData?: CustomerFormData;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel: () => void;
}

export default function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      name: '',
      document: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: 0,
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
              placeholder="Juan Pérez"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Documento (RIF/CI/DNI) <span className="text-red-500">*</span>
            </label>
            <input
              {...register('document')}
              className={inputClassName}
              placeholder="V-12345678"
            />
            {errors.document && (
              <p className="mt-1 text-xs text-red-500">
                {errors.document.message}
              </p>
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
              placeholder="+58 412-1234567"
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
              placeholder="cliente@ejemplo.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Dirección
            </label>
            <textarea
              {...register('address')}
              rows={2}
              className={inputClassName}
              placeholder="Av. Principal, Edificio X, Piso 2, Apto 3"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-gray-200 p-5 dark:border-slate-800">
        <legend className="px-1 text-sm font-semibold text-gray-700 dark:text-slate-300">
          Crédito y notas
        </legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Límite de Crédito ($)
            </label>
            <input
              {...register('creditLimit', { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              className={inputClassName}
              placeholder="1000.00"
            />
            {errors.creditLimit && (
              <p className="mt-1 text-xs text-red-500">
                {errors.creditLimit.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Notas
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className={inputClassName}
              placeholder="Notas adicionales sobre el cliente..."
            />
          </div>
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
              ? 'Actualizar Cliente'
              : 'Crear Cliente'}
        </button>
      </div>
    </form>
  );
}
