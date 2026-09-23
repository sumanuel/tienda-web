'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { signIn } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setProfile } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError('');
      const redirectTo = searchParams.get('redirect') || '/dashboard';

      const { profile } = await signIn(data.email, data.password);
      setProfile(profile);

      toast.success('¡Bienvenido!');
      router.refresh();
      window.location.assign(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
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
        <label htmlFor="email" className="text-sm font-bold text-[#193227]">
          Correo
        </label>
        <input
          id="email"
          type="email"
          placeholder="correo@dominio.com"
          {...register('email')}
          className="focus:border-tsuma-primary focus:ring-tsuma-primary w-full rounded-xl border border-[#d8e4db] bg-[#f6faf7] px-4 py-3 text-base text-[#193227] placeholder:text-[#8a94a6] focus:ring-1 focus:outline-none"
        />
        {errors.email && (
          <p className="text-error text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-bold text-[#193227]">
          Contraseña
        </label>
        <div className="flex items-center rounded-xl border border-[#d8e4db] bg-[#f6faf7] pr-1.5">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 6 caracteres"
            {...register('password')}
            className="w-full bg-transparent px-4 py-3 text-base text-[#193227] placeholder:text-[#8a94a6] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[#66766d] transition-colors hover:bg-black/5"
            aria-label={
              showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
          >
            {showPassword ? (
              <EyeOff className="h-[18px] w-[18px]" />
            ) : (
              <Eye className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-error text-sm">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-tsuma-primary mt-2 w-full rounded-xl px-4 py-3.5 text-sm font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}
