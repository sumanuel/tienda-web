import Link from 'next/link';
import { Store } from 'lucide-react';
import { RegisterForm } from '@/components/auth/RegisterForm';

const features = [
  'Ventas, inventario y clientes en un solo lugar',
  'Tasa de cambio actualizada en tiempo real',
  'Acceso seguro con sesión cifrada',
];

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca */}
      <div className="relative flex flex-col justify-between gap-8 overflow-hidden bg-[#0f5a3f] p-6 text-white sm:p-10 lg:justify-center lg:gap-10 lg:p-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 80% 10%, rgba(255,255,255,.12), transparent 55%)',
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <Store className="h-9 w-9 text-white drop-shadow" />
          <div>
            <b className="block text-lg font-bold">T-Suma</b>
            <span className="mt-0.5 block font-mono text-[0.6rem] tracking-[0.24em] text-white/60 uppercase">
              Nueva cuenta
            </span>
          </div>
        </div>

        <div className="relative z-10 hidden max-w-[26ch] flex-col gap-4 lg:flex">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight">
            Gestiona tu tienda sin complicaciones
          </h2>
          <p className="max-w-[42ch] text-sm leading-relaxed text-white/70">
            Un solo sistema para ventas, inventario, clientes, proveedores y tus
            finanzas — con todo sincronizado en tiempo real.
          </p>
        </div>

        <div className="relative z-10 hidden flex-col gap-2 border-t border-white/15 pt-4 lg:flex">
          {features.map((feature) => (
            <span key={feature} className="font-mono text-xs text-white/55">
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Panel de formulario */}
      <div className="flex items-center justify-center overflow-y-auto bg-[#f4f7fb] p-6 sm:p-10 dark:bg-slate-950">
        <div className="w-full max-w-md py-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Crea tu cuenta
          </h1>
          <p className="mt-1 mb-6 text-sm text-gray-500 dark:text-slate-400">
            Completa el formulario para registrar tu tienda en T-Suma.
          </p>

          <RegisterForm />

          <p className="mt-5 text-center text-sm text-gray-500 dark:text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="text-info font-semibold hover:underline"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
