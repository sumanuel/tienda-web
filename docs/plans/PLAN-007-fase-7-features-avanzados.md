# Plan de Implementación - Fase 7: Features Avanzados

**Proyecto**: tienda-web (POS Web System)  
**Fase**: Fase 7 - Features Avanzados y Optimizaciones  
**Fecha**: 2026-08-08  
**Duración estimada**: 5-7 días  
**Dependencias**: Fases 1-6 completadas

---

## 📋 Resumen Ejecutivo

Esta fase implementa funcionalidades premium que mejoran significativamente la experiencia de usuario y preparan la aplicación para escenarios avanzados de uso:

- **Multi-moneda completo**: Soporte total para múltiples monedas con tasas de cambio actualizadas
- **Modo oscuro**: Tema oscuro para reducir fatiga visual
- **PWA básico**: Soporte offline con service workers
- **Atajos de teclado**: Navegación rápida en POS
- **Optimizaciones**: Performance mejorado en listas y queries

---

## 🎯 Objetivos de la Fase

### Funcionales

1. **Multi-moneda en UI**: Permitir cambiar moneda activa en POS y ver precios convertidos
2. **Tasas de cambio**: Actualización automática desde API externa
3. **Modo oscuro**: Toggle dark/light theme con persistencia
4. **PWA**: Instalación como app nativa, cache de assets, funcionamiento offline básico
5. **Atajos de teclado**: Comandos rápidos para acciones frecuentes (F2=Productos, F3=Clientes, etc.)

### No Funcionales

1. Carga inicial < 2s (optimización)
2. Persistencia de preferencias de usuario
3. Bundle size reducido (code splitting)
4. Accesibilidad mejorada (a11y)
5. Tests E2E para flujos críticos

---

## 📁 Estructura de Archivos a Crear/Modificar

### Nuevos Archivos (18 archivos)

```
types/
  currency.ts                           # Types para multi-moneda

lib/
  currency/
    currencyService.ts                  # Lógica de conversión y tasas
    currencyApi.ts                      # API externa (exchangerate-api.com)
  keyboard/
    keyboardShortcuts.ts                # Hook para atajos de teclado

store/
  currencyStore.ts                      # Zustand store para moneda activa
  themeStore.ts                         # Zustand store para tema

components/
  currency/
    CurrencySelector.tsx                # Selector de moneda activa
    PriceDisplay.tsx                    # Componente para mostrar precio multi-moneda
    ExchangeRateCard.tsx                # Card con tasas actuales
  theme/
    ThemeToggle.tsx                     # Toggle dark/light
  keyboard/
    KeyboardShortcutsHelp.tsx           # Modal de ayuda de atajos

app/
  dashboard/
    settings/
      currency/
        page.tsx                        # Configuración de monedas
      theme/
        page.tsx                        # Configuración de tema

public/
  manifest.json                         # PWA manifest
  service-worker.js                     # Service worker básico
  icons/
    icon-192.png                        # PWA icons
    icon-512.png

docs/
  plans/
    PLAN-007-fase-7-features-avanzados.md  # Este archivo
```

### Archivos a Modificar (8 archivos)

```
app/
  layout.tsx                            # Agregar ThemeProvider, PWA meta tags
  dashboard/
    pos/
      page.tsx                          # Agregar CurrencySelector, atajos de teclado
    products/
      page.tsx                          # Mostrar precios multi-moneda

components/
  products/
    ProductForm.tsx                     # Agregar campos de precio multi-moneda
  sales/
    SalesForm.tsx                       # Convertir precios según moneda activa

lib/
  sales.ts                              # Guardar moneda usada en venta

next.config.ts                          # Configurar PWA
package.json                            # Agregar dependencias PWA
```

---

## 🔧 Implementación Detallada

### Fase 7.1: Multi-Moneda Completo (2 días)

#### 7.1.1 Types y Modelos

**Archivo**: `types/currency.ts`

```typescript
// Tipos para sistema multi-moneda
export interface Currency {
  code: string; // ISO 4217: USD, EUR, DOP
  name: string; // "Dólar Estadounidense"
  symbol: string; // "$"
  decimals: number; // 2
  enabled: boolean; // true
}

export interface ExchangeRate {
  fromCurrency: string; // "USD"
  toCurrency: string; // "DOP"
  rate: number; // 58.50
  lastUpdated: Date; // Timestamp última actualización
  source: string; // "exchangerate-api.com"
}

export interface CurrencySettings {
  baseCurrency: string; // "DOP" (moneda base del negocio)
  activeCurrency: string; // "USD" (moneda activa en UI)
  autoUpdateRates: boolean; // true
  updateIntervalHours: number; // 24
}

export interface PriceMultiCurrency {
  amount: number; // Monto en moneda base
  currency: string; // Código de moneda
  convertedAmount?: number; // Monto convertido (si aplica)
  convertedCurrency?: string; // Moneda de conversión
  exchangeRate?: number; // Tasa usada
}
```

#### 7.1.2 Servicio de API Externa

**Archivo**: `lib/currency/currencyApi.ts`

```typescript
import { ExchangeRate } from '@/types/currency';

const API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

export async function getExchangeRates(
  baseCurrency: string = 'DOP'
): Promise<ExchangeRate[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/${baseCurrency}`);

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();

    // Convertir a formato interno
    const rates: ExchangeRate[] = Object.entries(data.rates).map(
      ([currency, rate]) => ({
        fromCurrency: baseCurrency,
        toCurrency: currency,
        rate: rate as number,
        lastUpdated: new Date(data.time_last_updated * 1000),
        source: 'exchangerate-api.com',
      })
    );

    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
}

export async function getSpecificRate(
  from: string,
  to: string
): Promise<number> {
  const rates = await getExchangeRates(from);
  const rate = rates.find((r) => r.toCurrency === to);

  if (!rate) {
    throw new Error(`Exchange rate not found for ${from} to ${to}`);
  }

  return rate.rate;
}
```

#### 7.1.3 Servicio de Conversión

**Archivo**: `lib/currency/currencyService.ts`

```typescript
import { Currency, ExchangeRate, PriceMultiCurrency } from '@/types/currency';
import { getExchangeRates, getSpecificRate } from './currencyApi';

// Monedas soportadas por defecto
export const SUPPORTED_CURRENCIES: Currency[] = [
  {
    code: 'DOP',
    name: 'Peso Dominicano',
    symbol: 'RD$',
    decimals: 2,
    enabled: true,
  },
  {
    code: 'USD',
    name: 'Dólar Estadounidense',
    symbol: '$',
    decimals: 2,
    enabled: true,
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimals: 2,
    enabled: false,
  },
];

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate: number
): number {
  if (fromCurrency === toCurrency) return amount;
  return parseFloat((amount * rate).toFixed(2));
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);

  if (!currency) {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }

  return `${currency.symbol}${amount.toFixed(currency.decimals)}`;
}

export async function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<PriceMultiCurrency> {
  if (fromCurrency === toCurrency) {
    return {
      amount,
      currency: fromCurrency,
    };
  }

  const rate = await getSpecificRate(fromCurrency, toCurrency);
  const convertedAmount = convertAmount(amount, fromCurrency, toCurrency, rate);

  return {
    amount,
    currency: fromCurrency,
    convertedAmount,
    convertedCurrency: toCurrency,
    exchangeRate: rate,
  };
}

// Cachear tasas en localStorage para uso offline
export function cacheExchangeRates(rates: ExchangeRate[]): void {
  localStorage.setItem(
    'cached_exchange_rates',
    JSON.stringify({
      rates,
      cachedAt: new Date().toISOString(),
    })
  );
}

export function getCachedExchangeRates(): ExchangeRate[] | null {
  const cached = localStorage.getItem('cached_exchange_rates');

  if (!cached) return null;

  const { rates, cachedAt } = JSON.parse(cached);
  const cacheAge = Date.now() - new Date(cachedAt).getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas

  if (cacheAge > maxAge) return null;

  return rates;
}
```

#### 7.1.4 Store de Moneda

**Archivo**: `store/currencyStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Currency, ExchangeRate } from '@/types/currency';
import { SUPPORTED_CURRENCIES } from '@/lib/currency/currencyService';
import {
  getExchangeRates,
  cacheExchangeRates,
} from '@/lib/currency/currencyApi';

interface CurrencyState {
  baseCurrency: string;
  activeCurrency: string;
  exchangeRates: ExchangeRate[];
  lastUpdated: Date | null;
  isLoading: boolean;

  // Actions
  setActiveCurrency: (currencyCode: string) => void;
  setBaseCurrency: (currencyCode: string) => void;
  updateExchangeRates: () => Promise<void>;
  getRate: (from: string, to: string) => number | null;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      baseCurrency: 'DOP',
      activeCurrency: 'DOP',
      exchangeRates: [],
      lastUpdated: null,
      isLoading: false,

      setActiveCurrency: (currencyCode: string) => {
        set({ activeCurrency: currencyCode });
      },

      setBaseCurrency: (currencyCode: string) => {
        set({ baseCurrency: currencyCode });
        get().updateExchangeRates();
      },

      updateExchangeRates: async () => {
        set({ isLoading: true });

        try {
          const rates = await getExchangeRates(get().baseCurrency);
          cacheExchangeRates(rates);

          set({
            exchangeRates: rates,
            lastUpdated: new Date(),
            isLoading: false,
          });
        } catch (error) {
          console.error('Error updating exchange rates:', error);

          // Intentar usar caché
          const cachedRates = getCachedExchangeRates();
          if (cachedRates) {
            set({
              exchangeRates: cachedRates,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        }
      },

      getRate: (from: string, to: string): number | null => {
        if (from === to) return 1;

        const rate = get().exchangeRates.find(
          (r) => r.fromCurrency === from && r.toCurrency === to
        );

        return rate ? rate.rate : null;
      },
    }),
    {
      name: 'currency-storage',
      partialize: (state) => ({
        baseCurrency: state.baseCurrency,
        activeCurrency: state.activeCurrency,
        exchangeRates: state.exchangeRates,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);
```

#### 7.1.5 Componente Selector de Moneda

**Archivo**: `components/currency/CurrencySelector.tsx`

```typescript
'use client';

import { useCurrencyStore } from '@/store/currencyStore';
import { SUPPORTED_CURRENCIES } from '@/lib/currency/currencyService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign } from 'lucide-react';

export function CurrencySelector() {
  const { activeCurrency, setActiveCurrency } = useCurrencyStore();

  const enabledCurrencies = SUPPORTED_CURRENCIES.filter(c => c.enabled);

  return (
    <div className="flex items-center gap-2">
      <DollarSign className="h-4 w-4 text-muted-foreground" />
      <Select value={activeCurrency} onValueChange={setActiveCurrency}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {enabledCurrencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.symbol} {currency.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

---

### Fase 7.2: Modo Oscuro (1 día)

#### 7.2.1 Store de Tema

**Archivo**: `store/themeStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',

      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(theme);
      },

      toggleTheme: () => {
        const current = get().theme;
        const next = current === 'light' ? 'dark' : 'light';
        get().setTheme(next);
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

function applyTheme(theme: Theme) {
  const root = window.document.documentElement;

  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}

// Inicializar tema al cargar
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('theme-storage');
  if (stored) {
    const { state } = JSON.parse(stored);
    applyTheme(state.theme);
  }
}
```

#### 7.2.2 Componente Toggle de Tema

**Archivo**: `components/theme/ThemeToggle.tsx`

```typescript
'use client';

import { useThemeStore } from '@/store/themeStore';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

#### 7.2.3 Actualizar Tailwind Config

**Modificar**: `tailwind.config.ts`

```typescript
// Agregar dark mode
export default {
  darkMode: ['class'],
  // ... resto de config
};
```

---

### Fase 7.3: PWA Básico (1.5 días)

#### 7.3.1 Manifest PWA

**Archivo**: `public/manifest.json`

```json
{
  "name": "TiendaWeb - Sistema POS",
  "short_name": "TiendaWeb",
  "description": "Sistema punto de venta para tiendas de retail",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["business", "finance"],
  "screenshots": []
}
```

#### 7.3.2 Service Worker Básico

**Archivo**: `public/service-worker.js`

```javascript
const CACHE_NAME = 'tienda-web-v1';
const urlsToCache = [
  '/dashboard',
  '/dashboard/pos',
  '/dashboard/products',
  '/offline.html',
];

// Instalación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Activación
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch (Network First, fallback to cache)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar la respuesta
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          return response || caches.match('/offline.html');
        });
      })
  );
});
```

#### 7.3.3 Página Offline

**Archivo**: `public/offline.html`

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sin conexión - TiendaWeb</title>
    <style>
      body {
        font-family:
          system-ui,
          -apple-system,
          sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        background: #f3f4f6;
      }
      .container {
        text-align: center;
        padding: 2rem;
      }
      h1 {
        color: #1f2937;
      }
      p {
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Sin conexión a Internet</h1>
      <p>Por favor, verifica tu conexión e intenta de nuevo.</p>
    </div>
  </body>
</html>
```

#### 7.3.4 Actualizar Layout Principal

**Modificar**: `app/layout.tsx`

```typescript
export const metadata: Metadata = {
  // ... metadata existente
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TiendaWeb'
  },
  themeColor: '#2563eb'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

### Fase 7.4: Atajos de Teclado (1 día)

#### 7.4.1 Hook de Atajos

**Archivo**: `lib/keyboard/keyboardShortcuts.ts`

```typescript
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcut = shortcuts.find((s) => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = s.ctrl ? e.ctrlKey || e.metaKey : true;
        const altMatch = s.alt ? e.altKey : true;
        const shiftMatch = s.shift ? e.shiftKey : true;

        return keyMatch && ctrlMatch && altMatch && shiftMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

// Atajos globales comunes
export function useGlobalShortcuts() {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'F2',
      description: 'Ir a Productos',
      action: () => router.push('/dashboard/products'),
    },
    {
      key: 'F3',
      description: 'Ir a Clientes',
      action: () => router.push('/dashboard/customers'),
    },
    {
      key: 'F4',
      description: 'Ir a Punto de Venta',
      action: () => router.push('/dashboard/pos'),
    },
    {
      key: 'F5',
      description: 'Ir a Reportes',
      action: () => router.push('/dashboard/reports'),
    },
  ];

  useKeyboardShortcuts(shortcuts);
}
```

#### 7.4.2 Modal de Ayuda de Atajos

**Archivo**: `components/keyboard/KeyboardShortcutsHelp.tsx`

```typescript
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

const shortcuts = [
  { keys: 'F2', description: 'Ir a Productos' },
  { keys: 'F3', description: 'Ir a Clientes' },
  { keys: 'F4', description: 'Ir a Punto de Venta' },
  { keys: 'F5', description: 'Ir a Reportes' },
  { keys: 'Ctrl+K', description: 'Búsqueda rápida' },
  { keys: 'Ctrl+S', description: 'Guardar (en formularios)' },
  { keys: 'Esc', description: 'Cancelar / Cerrar modal' }
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Keyboard className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atajos de Teclado</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b"
            >
              <span className="text-sm">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Fase 7.5: Optimizaciones de Performance (0.5 días)

#### 7.5.1 Code Splitting en Next.js

**Modificar**: `next.config.ts`

```typescript
const nextConfig = {
  // Optimizaciones
  reactStrictMode: true,

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },

  // PWA
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};
```

#### 7.5.2 Lazy Loading de Componentes Pesados

**Modificar**: Páginas con gráficos Recharts

```typescript
import dynamic from 'next/dynamic';

// Lazy load de gráficos
const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false, loading: () => <div>Cargando gráfico...</div> }
);
```

---

## 📦 Dependencias Nuevas

```json
{
  "dependencies": {
    "next-pwa": "^5.6.0"
  }
}
```

**Instalación**:

```bash
npm install next-pwa
```

---

## ✅ Criterios de Aceptación

### Multi-Moneda

- [ ] Usuario puede seleccionar moneda activa (USD, DOP, EUR)
- [ ] Precios se convierten automáticamente según moneda activa
- [ ] Tasas de cambio se actualizan desde API externa
- [ ] Tasas se cachean para uso offline
- [ ] POS muestra precio en moneda activa
- [ ] Reportes muestran totales en moneda base y activa

### Modo Oscuro

- [ ] Toggle de tema light/dark funcional
- [ ] Tema persiste entre sesiones
- [ ] Todos los componentes soportan ambos temas
- [ ] Modo "system" detecta preferencia del OS

### PWA

- [ ] App se puede instalar como PWA
- [ ] Manifest.json correctamente configurado
- [ ] Service worker cachea assets críticos
- [ ] Funciona offline (páginas cacheadas)
- [ ] Página offline.html se muestra sin conexión

### Atajos de Teclado

- [ ] F2, F3, F4, F5 navegan a secciones principales
- [ ] Ctrl+K abre búsqueda rápida
- [ ] Esc cierra modales
- [ ] Modal de ayuda muestra todos los atajos

### Performance

- [ ] Bundle size < 300KB (gzipped)
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Lighthouse score > 90

---

## 🚧 Riesgos y Mitigaciones

### Riesgo 1: API de tasas de cambio puede fallar

**Mitigación**:

- Cachear tasas localmente por 24h
- Fallback a tasas manuales si API falla
- Mostrar advertencia de tasas desactualizadas

### Riesgo 2: Service Worker puede causar problemas de cache

**Mitigación**:

- Cache solo assets estáticos
- Network-first strategy para datos
- Versionar cache name para forzar updates

### Riesgo 3: Atajos de teclado pueden chocar con browser defaults

**Mitigación**:

- Usar teclas F1-F12 que raramente chocan
- Agregar `e.preventDefault()` en handlers
- Permitir deshabilitar atajos en settings

---

## 📊 Métricas de Éxito

| Métrica              | Objetivo        | Medición        |
| -------------------- | --------------- | --------------- |
| **Bundle size**      | < 300KB gzipped | Lighthouse      |
| **FCP**              | < 1.5s          | Lighthouse      |
| **TTI**              | < 3s            | Lighthouse      |
| **Lighthouse Score** | > 90            | Lighthouse      |
| **PWA Installable**  | Sí              | Chrome DevTools |
| **Offline Support**  | Parcial         | Manual          |
| **Multi-Currency**   | 3 monedas       | Manual          |
| **Theme Toggle**     | Funcional       | Manual          |

---

## 🔄 Orden de Implementación Sugerido

### Día 1-2: Multi-Moneda

1. Crear types y servicios de currency
2. Implementar API de tasas de cambio
3. Crear store de currency
4. Agregar CurrencySelector al POS
5. Modificar ProductForm para multi-moneda
6. Tests unitarios de conversión

### Día 3: Modo Oscuro

1. Crear themeStore
2. Implementar ThemeToggle
3. Configurar Tailwind dark mode
4. Revisar todos los componentes para dark mode
5. Tests de toggle

### Día 4: PWA

1. Crear manifest.json
2. Generar iconos PWA
3. Implementar service worker básico
4. Crear offline.html
5. Actualizar layout con meta tags PWA
6. Probar instalación en Chrome/Edge

### Día 5: Atajos + Optimizaciones

1. Crear hook de keyboard shortcuts
2. Implementar shortcuts globales
3. Crear modal de ayuda
4. Code splitting de Recharts
5. Optimizar next.config.ts
6. Ejecutar Lighthouse y corregir issues

---

## 🧪 Plan de Testing

### Tests Unitarios

- `currencyService.test.ts` - Conversión de monedas
- `currencyApi.test.ts` - Mock de API externa
- `themeStore.test.ts` - Toggle de tema
- `keyboardShortcuts.test.ts` - Atajos de teclado

### Tests de Integración

- `multi-currency-flow.test.ts` - Flujo completo con conversión
- `pwa-install.test.ts` - Instalación de PWA
- `offline-mode.test.ts` - Funcionamiento offline

### Tests E2E (Playwright)

- Cambiar moneda en POS y verificar conversión
- Toggle dark mode y verificar persistencia
- Instalar PWA y verificar funcionamiento
- Usar atajos de teclado para navegar

---

## 📝 Notas Importantes

### Limitaciones Conocidas

1. **Modo Offline Parcial**: Solo páginas cacheadas funcionan offline, no hay sync bidireccional
2. **API de Cambio Gratuita**: Límite de 1500 requests/mes en plan free
3. **PWA iOS**: Soporte limitado en Safari, no hay push notifications

### Decisiones Técnicas

1. **exchangerate-api.com**: Free tier suficiente para actualizar tasas 1x/día
2. **Service Worker Manual**: No usar next-pwa para más control
3. **Dark Mode con Tailwind**: Más simple que CSS variables custom

### Consideraciones Futuras (Post Fase 7)

- Sync offline completo (Queue de operaciones + IndexedDB)
- Push notifications para alertas
- Background sync de tasas de cambio
- Búsqueda rápida global (Ctrl+K con Algolia)
- Atajos personalizables por usuario

---

## 📚 Referencias

- [Next.js PWA Guide](https://ducanh-next-pwa.vercel.app/)
- [ExchangeRate API Docs](https://www.exchangerate-api.com/docs)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Web.dev PWA Checklist](https://web.dev/pwa-checklist/)

---

**Última actualización**: 2026-08-08  
**Autor**: Equipo de desarrollo tienda-web  
**Estado**: Pendiente de aprobación
