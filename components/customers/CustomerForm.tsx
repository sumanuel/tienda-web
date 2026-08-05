/**
 * Formulario de Cliente - Crear/Editar
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomerFormData } from '@/types/customer';

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Juan Pérez"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Documento */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Documento (RIF/CI/DNI) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('document')}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="V-12345678"
          />
          {errors.document && (
            <p className="mt-1 text-sm text-red-600">{errors.document.message}</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Teléfono
          </label>
          <input
            {...register('phone')}
            type="tel"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="+58 412-1234567"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="cliente@ejemplo.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Dirección */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Dirección
          </label>
          <textarea
            {...register('address')}
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Av. Principal, Edificio X, Piso 2, Apto 3"
          />
        </div>

        {/* Límite de Crédito */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Límite de Crédito ($)
          </label>
          <input
            {...register('creditLimit', { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="1000.00"
          />
          {errors.creditLimit && (
            <p className="mt-1 text-sm text-red-600">{errors.creditLimit.message}</p>
          )}
        </div>

        {/* Notas */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Notas
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Notas adicionales sobre el cliente..."
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar Cliente' : 'Crear Cliente'}
        </button>
      </div>
    </form>
  );
}
