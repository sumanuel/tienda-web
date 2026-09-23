import Link from 'next/link';
import { CloudCheck, ShieldCheck, Store } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        {/* Hero */}
        <div className="bg-tsuma-primary shadow-tsuma-primary/20 rounded-3xl p-6 shadow-lg">
          <p className="text-xs font-bold tracking-wider text-white/70 uppercase">
            Acceso seguro
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-white">T-Suma</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/85">
            Inicia sesión para acceder al sistema de tu tienda.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white">
              <CloudCheck className="h-4 w-4" />
              Tiempo real
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white">
              <ShieldCheck className="h-4 w-4" />
              Seguridad
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white">
              <Store className="h-4 w-4" />
              Tu tienda
            </span>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-3xl bg-white p-6 shadow-lg shadow-black/5">
          <LoginForm />

          <div className="mt-4 text-center">
            <p className="text-sm text-[#66766d]">
              ¿No tienes cuenta?{' '}
              <Link
                href="/register"
                className="text-info font-semibold hover:underline"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-xs leading-relaxed text-[#66766d]">
            Al continuar, aceptas acceder de forma segura al espacio de tu
            tienda.
          </p>
        </div>
      </div>
    </div>
  );
}
