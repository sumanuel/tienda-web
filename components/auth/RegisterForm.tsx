'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signUp } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
    storeName: z
      .string()
      .min(2, 'Nombre de tienda debe tener al menos 2 caracteres'),
    storeAddress: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const inputClass =
  'focus:border-tsuma-primary focus:ring-tsuma-primary w-full rounded-xl border border-[#d8e4db] bg-[#f6faf7] px-4 py-3 text-base text-[#193227] placeholder:text-[#8a94a6] focus:ring-1 focus:outline-none';

const labelClass = 'text-sm font-bold text-[#193227]';

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setProfile } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError('');

      const { profile } = await signUp(
        data.email,
        data.password,
        data.name,
        data.storeName,
        data.storeAddress
      );
      setProfile(profile);

      toast.success('¡Cuenta creada exitosamente!');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {error && (
        <div className="text-error rounded-xl bg-[#fbeceb] p-3 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="name" className={labelClass}>
          Nombre Completo
        </label>
        <input
          id="name"
          type="text"
          placeholder="Juan Pérez"
          {...register('name')}
          className={inputClass}
        />
        {errors.name && (
          <p className="text-error text-sm">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="storeName" className={labelClass}>
          Nombre de tu Tienda
        </label>
        <input
          id="storeName"
          type="text"
          placeholder="Mi Tienda"
          {...register('storeName')}
          className={inputClass}
        />
        {errors.storeName && (
          <p className="text-error text-sm">{errors.storeName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="storeAddress" className={labelClass}>
          Dirección de tu Tienda (opcional)
        </label>
        <input
          id="storeAddress"
          type="text"
          placeholder="Av. Principal #123"
          {...register('storeAddress')}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="tu@email.com"
          {...register('email')}
          className={inputClass}
        />
        {errors.email && (
          <p className="text-error text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className={labelClass}>
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          className={inputClass}
        />
        {errors.password && (
          <p className="text-error text-sm">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirmar Contraseña
        </label>
        <input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          {...register('confirmPassword')}
          className={inputClass}
        />
        {errors.confirmPassword && (
          <p className="text-error text-sm">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-tsuma-primary mt-2 w-full rounded-xl px-4 py-3.5 text-sm font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Creando cuenta...' : 'Registrarse'}
      </button>
    </form>
  );
}
