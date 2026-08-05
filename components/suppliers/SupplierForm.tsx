/**
 * Formulario de Proveedor - Crear/Editar
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SupplierFormData } from '@/types/supplier';

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
            placeholder="Distribuidora XYZ C.A."
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* RIF */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            RIF/NIT <span className="text-red-500">*</span>
          </label>
          <input
            {...register('rif')}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="J-12345678-9"
          />
          {errors.rif && (
            <p className="mt-1 text-sm text-red-600">{errors.rif.message}</p>
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
            placeholder="+58 212-1234567"
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
            placeholder="ventas@proveedor.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Persona de Contacto */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Persona de Contacto
          </label>
          <input
            {...register('contactPerson')}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="María González - Gerente de Ventas"
          />
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
            placeholder="Notas adicionales sobre el proveedor..."
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
          {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar Proveedor' : 'Crear Proveedor'}
        </button>
      </div>
    </form>
  );
}
