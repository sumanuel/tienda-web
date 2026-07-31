# PLAN-001: tienda-web - Fase 1 (Fundación)

**Fecha**: 2026-07-31  
**Planificador**: planificador agent  
**Basado en**: FEATURE-001-tienda-web.md  
**Fase**: 1 de 7 - Fundación  
**Duración Estimada**: 2 semanas (80 horas)

---

## 📋 Resumen de la Fase

**Objetivos**:
- Setup completo del proyecto Next.js con TypeScript
- Sistema de autenticación con Firebase
- Layout base de la aplicación
- Protección de rutas por roles
- Dashboard básico (estructura, sin datos reales)

**Entregables**:
- [x] Proyecto Next.js 14 configurado
- [x] TypeScript + ESLint + Prettier
- [x] Tailwind CSS + shadcn/ui
- [x] Firebase (Auth + Firestore)
- [x] Layout principal (sidebar, header)
- [x] Autenticación completa
- [x] Protección de rutas
- [x] Dashboard básico

---

## 🏗️ Arquitectura de la Fase 1

```
tienda-web/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo de rutas de auth
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Grupo de rutas protegidas
│   │   ├── layout.tsx            # Layout con sidebar
│   │   ├── page.tsx              # Dashboard
│   │   └── settings/
│   ├── api/                      # API Routes
│   │   └── auth/
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing/redirect
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MainLayout.tsx
│   └── auth/
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
│
├── lib/
│   ├── firebase.ts               # Firebase config
│   ├── auth.ts                   # Auth helpers
│   └── utils.ts                  # Utilidades
│
├── hooks/
│   ├── useAuth.ts                # Hook de autenticación
│   └── useUser.ts                # Hook de usuario
│
├── store/
│   └── authStore.ts              # Zustand store
│
├── types/
│   ├── user.ts
│   └── store.ts
│
├── config/
│   └── roles.ts                  # Roles y permisos
│
└── [config files]
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.js
    ├── .env.local
    └── .eslintrc.json
```

---

## 📦 Dependencias a Instalar

### Dependencias de Producción

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    
    "@firebase/app": "^0.10.0",
    "@firebase/auth": "^1.7.0",
    "@firebase/firestore": "^4.6.0",
    "@firebase/storage": "^0.12.0",
    
    "zustand": "^4.5.0",
    
    "react-hook-form": "^7.51.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.3.0",
    
    "date-fns": "^3.6.0",
    "lucide-react": "^0.372.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    
    "react-hot-toast": "^2.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.14"
  }
}
```

---

## 🎯 Plan de Implementación Detallado

### Tarea 1: Inicialización del Proyecto (2 horas)

**Objetivo**: Crear proyecto Next.js con TypeScript y configuraciones base

**Pasos**:

```bash
# 1. Crear proyecto Next.js
cd "D:\Mis proyectos"
npx create-next-app@latest tienda-web --typescript --tailwind --app --src-dir=false --import-alias="@/*"

# 2. Instalar dependencias adicionales
cd tienda-web
npm install firebase zustand react-hook-form zod @hookform/resolvers
npm install date-fns lucide-react clsx tailwind-merge react-hot-toast
npm install -D prettier prettier-plugin-tailwindcss
```

**Archivos a crear/modificar**:

1. `.env.local` (configuración Firebase)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

2. `.prettierrc` (formateo)
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

3. `next.config.js` (configuración Next.js)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
};

module.exports = nextConfig;
```

**Validación**:
- [ ] `npm run dev` funciona sin errores
- [ ] TypeScript compila correctamente
- [ ] Tailwind CSS funciona

---

### Tarea 2: Configuración de Firebase (2 horas)

**Objetivo**: Integrar Firebase Auth y Firestore

**Archivos a crear**:

1. `lib/firebase.ts` (configuración)
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar Firebase (evitar reinicialización)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

2. `lib/auth.ts` (helpers de autenticación)
```typescript
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserProfile } from '@/types/user';

export async function signIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signUp(email: string, password: string, name: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Crear perfil en Firestore
  const userProfile: UserProfile = {
    id: user.uid,
    email: user.email!,
    name,
    role: 'owner', // Primer usuario es owner
    storeId: '', // Se asigna después
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await setDoc(doc(db, 'users', user.uid), userProfile);
  
  return user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  
  return null;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
```

3. `types/user.ts` (tipos TypeScript)
```typescript
export type UserRole = 'owner' | 'admin' | 'cashier';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Store {
  id: string;
  name: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  currencies: string[];
  defaultCurrency: string;
  taxRate: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Validación**:
- [ ] Firebase inicializa sin errores
- [ ] Funciones de auth importables
- [ ] TypeScript reconoce tipos

---

### Tarea 3: Sistema de Autenticación - Store (1 hora)

**Objetivo**: Crear Zustand store para gestión de estado de auth

**Archivos a crear**:

1. `store/authStore.ts`
```typescript
import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/types/user';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ user: null, profile: null, loading: false }),
}));
```

2. `hooks/useAuth.ts` (custom hook)
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const router = useRouter();
  const { user, profile, loading, setUser, setProfile, setLoading } = useAuthStore();
  
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Cargar perfil
        const userProfile = await getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
      } else {
        setUser(null);
        setProfile(null);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [setUser, setProfile, setLoading]);
  
  return { user, profile, loading };
}

export function useRequireAuth(redirectUrl = '/login') {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectUrl);
    }
  }, [user, loading, router, redirectUrl]);
  
  return { user, loading };
}
```

**Validación**:
- [ ] Store funciona correctamente
- [ ] Hook useAuth detecta cambios de autenticación
- [ ] TypeScript sin errores

---

### Tarea 4: Configurar shadcn/ui (1 hora)

**Objetivo**: Instalar y configurar componentes UI base

**Pasos**:

```bash
# Inicializar shadcn/ui
npx shadcn-ui@latest init

# Responder al wizard:
# - Would you like to use TypeScript? Yes
# - Which style would you like to use? Default
# - Which color would you like to use as base color? Slate
# - Where is your global CSS file? app/globals.css
# - Would you like to use CSS variables for colors? Yes
# - Where is your tailwind.config.js located? tailwind.config.ts
# - Configure the import alias for components? @/components
# - Configure the import alias for utils? @/lib/utils

# Instalar componentes necesarios
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
```

**Archivos generados**:
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/card.tsx`
- `components/ui/avatar.tsx`
- `components/ui/dropdown-menu.tsx`
- etc.

**Validación**:
- [ ] Componentes shadcn/ui instalados
- [ ] Estilos aplicados correctamente

---

### Tarea 5: Layout Principal (3 horas)

**Objetivo**: Crear estructura de layout con sidebar y header

**Archivos a crear**:

1. `components/layout/Sidebar.tsx`
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  TruckIcon,
  BarChart3,
  Settings,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/pos', icon: ShoppingCart, label: 'Punto de Venta' },
  { href: '/dashboard/products', icon: Package, label: 'Productos' },
  { href: '/dashboard/customers', icon: Users, label: 'Clientes' },
  { href: '/dashboard/suppliers', icon: TruckIcon, label: 'Proveedores' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Reportes' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configuración' },
];

export function Sidebar() {
  const pathname = usePathname();
  
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-slate-50">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Store className="mr-2 h-6 w-6 text-blue-600" />
        <span className="text-xl font-bold text-slate-900">TiendaWeb</span>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-200'
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
```

2. `components/layout/Header.tsx`
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';

export function Header() {
  const { profile } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  const initials = profile?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 rounded-lg px-3 py-2 hover:bg-slate-100">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium">{profile?.name}</p>
                <p className="text-xs text-slate-500">{profile?.role}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

3. `app/(dashboard)/layout.tsx` (layout de dashboard)
```typescript
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Validación**:
- [ ] Sidebar renderiza correctamente
- [ ] Header muestra info de usuario
- [ ] Layout responsive
- [ ] Navegación funciona

---

### Tarea 6: Pantallas de Autenticación (3 horas)

**Objetivo**: Crear pantallas de login y registro

**Archivos a crear**:

1. `components/auth/LoginForm.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
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
      
      await signIn(data.email, data.password);
      
      toast.success('¡Bienvenido!');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>
    </form>
  );
}
```

2. `app/(auth)/login/page.tsx`
```typescript
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-600">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

3. `components/auth/RegisterForm.tsx` (similar a LoginForm)
4. `app/(auth)/register/page.tsx` (similar a login/page.tsx)

**Validación**:
- [ ] Login funcional
- [ ] Registro funcional
- [ ] Validaciones funcionan
- [ ] Errores se muestran correctamente
- [ ] Redirección post-login

---

### Tarea 7: Protección de Rutas (2 horas)

**Objetivo**: Implementar middleware para proteger rutas privadas

**Archivos a crear**:

1. `middleware.ts` (en raíz del proyecto)
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Verificar si hay sesión (simplificado)
  // En producción, verificar token JWT o Firebase session
  const isAuthenticated = request.cookies.has('session');
  const { pathname } = request.nextUrl;
  
  // Rutas públicas
  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  
  // Si no está autenticado y intenta acceder a ruta privada
  if (!isAuthenticated && !isPublicPath && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Si está autenticado y intenta acceder a login/register
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
```

2. `app/(dashboard)/page.tsx` (Dashboard básico)
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react';

export default function DashboardPage() {
  const { profile } = useAuth();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          ¡Bienvenido, {profile?.name}!
        </h1>
        <p className="text-slate-600">
          Resumen de tu negocio
        </p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas del Día
            </CardTitle>
            <DollarSign className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-slate-600">
              Próximamente con datos reales
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos
            </CardTitle>
            <Package className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-slate-600">
              Total en inventario
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas del Mes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-slate-600">
              Transacciones
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-slate-600">
              Clientes registrados
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder para gráficos */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-slate-400">
            Gráfico próximamente (Fase 6)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Validación**:
- [ ] Rutas protegidas redirigen a login si no autenticado
- [ ] Dashboard solo accesible con sesión
- [ ] Middleware funciona correctamente

---

### Tarea 8: Provider de Autenticación Global (1 hora)

**Objetivo**: Envolver app con provider de auth

**Archivos a modificar**:

1. `app/layout.tsx`
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/providers/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TiendaWeb - Sistema POS',
  description: 'Sistema de punto de venta web completo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
```

2. `components/providers/AuthProvider.tsx`
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth(); // Inicializa listener de auth
  
  return <>{children}</>;
}
```

**Validación**:
- [ ] Auth listener funciona globalmente
- [ ] Estado sincronizado en toda la app

---

### Tarea 9: Documentación Inicial (1 hora)

**Objetivo**: Crear README y guía de setup

**Archivos a crear**:

1. `README.md`
```markdown
# TiendaWeb - Sistema POS Web

Sistema de punto de venta web completo con gestión de inventario, ventas, clientes y proveedores.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Firebase (Auth + Firestore)
- Zustand (estado global)

## Setup

1. Clonar repositorio
2. Instalar dependencias: `npm install`
3. Configurar Firebase en `.env.local`
4. Ejecutar: `npm run dev`

## Fase Actual

Fase 1: Fundación ✅
- Autenticación completa
- Layout base
- Dashboard básico

## Próximas Fases

- Fase 2: POS y Productos
- Fase 3: Inventario
- Fase 4: Clientes y Proveedores
- ...
```

2. `CONTRIBUTING.md` (guía de contribución)
3. `.gitignore` (actualizar si es necesario)

**Validación**:
- [ ] Documentación clara
- [ ] Setup instructions funcionan

---

## ✅ Checklist de Validación Final

### Setup y Configuración
- [ ] Proyecto Next.js 14 inicializado
- [ ] TypeScript configurado sin errores
- [ ] Tailwind CSS funcional
- [ ] ESLint y Prettier configurados
- [ ] Firebase configurado (.env.local)
- [ ] shadcn/ui instalado con componentes base

### Autenticación
- [ ] Login funcional con email/password
- [ ] Registro de usuarios funcional
- [ ] Logout funcional
- [ ] Estado de autenticación persiste (refresh de página)
- [ ] Errores se muestran correctamente
- [ ] Validaciones de formulario funcionan

### Layout y Navegación
- [ ] Sidebar renderiza correctamente
- [ ] Header muestra info de usuario
- [ ] Navegación entre rutas funciona
- [ ] Layout responsive (desktop)
- [ ] Items de menú activos resaltados

### Dashboard
- [ ] Dashboard básico renderiza
- [ ] Cards de KPI visibles (con datos placeholder)
- [ ] Área de gráfico reservada
- [ ] Diseño limpio y profesional

### Protección de Rutas
- [ ] Middleware redirige rutas protegidas
- [ ] Usuario no autenticado no accede a /dashboard
- [ ] Usuario autenticado no accede a /login
- [ ] Redirecciones funcionan correctamente

### TypeScript
- [ ] Sin errores de compilación TypeScript
- [ ] Tipos definidos para User, Store, etc.
- [ ] Autocompletado funciona en IDE

### Calidad de Código
- [ ] Código formateado con Prettier
- [ ] Sin errores de ESLint
- [ ] Componentes bien organizados
- [ ] Nombres descriptivos

### Performance
- [ ] Carga inicial < 3s
- [ ] Navegación entre páginas rápida
- [ ] Sin re-renders innecesarios visibles

### UX
- [ ] Mensajes de error claros
- [ ] Loading states visibles
- [ ] Transiciones suaves
- [ ] Toasts funcionan correctamente

---

## 📊 Estimación de Tiempo

| Tarea | Tiempo | Prioridad |
|-------|--------|-----------|
| 1. Inicialización | 2h | Alta |
| 2. Firebase | 2h | Alta |
| 3. Auth Store | 1h | Alta |
| 4. shadcn/ui | 1h | Alta |
| 5. Layout | 3h | Alta |
| 6. Auth Screens | 3h | Alta |
| 7. Protección de rutas | 2h | Alta |
| 8. Auth Provider | 1h | Alta |
| 9. Documentación | 1h | Media |
| **TOTAL** | **16h** | |

Más 4h de buffer para debugging y ajustes = **20 horas** (2.5 días)

---

## 🚀 Comandos de Desarrollo

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Lint
npm run lint

# Format
npm run format

# TypeScript check
npx tsc --noEmit
```

---

## 📝 Notas Importantes

### Decisiones Técnicas

1. **App Router vs Pages Router**: Se usa App Router (Next.js 14) por mejor performance y DX
2. **Zustand vs Context**: Zustand es más simple y performante que Context API
3. **shadcn/ui vs Material-UI**: shadcn/ui es más ligero y customizable

### Riesgos Identificados

1. **Firebase límites gratuitos**: Fase 1 no consume mucho, pero Fase 2+ puede requerir plan Blaze
2. **Middleware básico**: Validación de sesión simplificada, mejorar en Fase 2
3. **Sin tests aún**: Se agregan en Fase 7

### Próximos Pasos Post-Fase 1

1. **Reunión de revisión**: Validar que todo funciona
2. **Feedback de usuario**: Probar login/logout/navegación
3. **Iniciar Fase 2**: POS y Productos (la funcionalidad core)

---

## 🎯 Criterios de Éxito

La Fase 1 está completa cuando:

- ✅ Usuario puede registrarse exitosamente
- ✅ Usuario puede iniciar sesión
- ✅ Dashboard carga correctamente
- ✅ Navegación entre páginas funciona
- ✅ Usuario puede cerrar sesión
- ✅ Sesión persiste al recargar página
- ✅ Sin errores críticos en consola
- ✅ TypeScript compila sin errores
- ✅ Diseño visual profesional y limpio

---

**Fin del Plan Fase 1**

**Aprobado por**: planificador agent  
**Fecha**: 2026-07-31  
**Listo para**: programador-senior agent
