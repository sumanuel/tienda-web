# Plan de Implementación: Alineación tienda-web con tienda-app

**Especificación**: [FEATURE-ALINEACION-TIENDA-APP.md](../specs/FEATURE-ALINEACION-TIENDA-APP.md)  
**Fecha**: 2026-08-25  
**Tiempo Estimado**: 5 días  
**Estado**: 🚧 En Progreso

---

## Resumen del Plan

Implementar en **5 fases secuenciales** la alineación de tienda-web con la experiencia, diseño y lógica de negocio de tienda-app.

---

## Fase 1: Backend - Base de Datos y Lógica de Cálculo (1 día)

### 1.1 Migración de Base de Datos

**Archivo**: `backend/prisma/migrations/XXXXXX_add_exchange_rates_and_pricing/migration.sql`

```sql
-- Crear tabla exchange_rates
CREATE TABLE "exchange_rates" (
  "id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "from_currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
  "to_currency" VARCHAR(3) NOT NULL DEFAULT 'VES',
  "rate" DECIMAL(18, 6) NOT NULL,
  "source" VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- Crear índices
CREATE INDEX "exchange_rates_store_id_idx" ON "exchange_rates"("store_id");
CREATE INDEX "exchange_rates_active_idx" ON "exchange_rates"("store_id", "is_active");
CREATE INDEX "exchange_rates_created_at_idx" ON "exchange_rates"("created_at" DESC);

-- Constraint único para tasa activa por par de monedas
CREATE UNIQUE INDEX "exchange_rates_unique_active"
  ON "exchange_rates"("store_id", "from_currency", "to_currency")
  WHERE "is_active" = true;

-- Agregar campos a products
ALTER TABLE "products" ADD COLUMN "margin" DECIMAL(5, 2) DEFAULT 30.00;
ALTER TABLE "products" ADD COLUMN "cost_currency" VARCHAR(3) DEFAULT 'USD';
ALTER TABLE "products" ADD COLUMN "additional_cost" DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE "products" ADD COLUMN "iva" DECIMAL(5, 2) DEFAULT 0.00;

-- Índice para búsqueda por margen
CREATE INDEX "products_margin_idx" ON "products"("margin");

-- Foreign keys
ALTER TABLE "exchange_rates"
  ADD CONSTRAINT "exchange_rates_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE;

ALTER TABLE "exchange_rates"
  ADD CONSTRAINT "exchange_rates_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
```

**Actualizar**: `backend/prisma/schema.prisma`

```prisma
model ExchangeRate {
  id           String   @id @default(cuid())
  storeId      String   @map("store_id")
  fromCurrency String   @default("USD") @map("from_currency") @db.VarChar(3)
  toCurrency   String   @default("VES") @map("to_currency") @db.VarChar(3)
  rate         Decimal  @db.Decimal(18, 6)
  source       String   @default("MANUAL") @db.VarChar(50)
  isActive     Boolean  @default(true) @map("is_active")
  createdBy    String?  @map("created_by")
  createdAt    DateTime @default(now()) @map("created_at")

  store        Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  creator      User?    @relation(fields: [createdBy], references: [id], onDelete: SetNull)

  @@index([storeId])
  @@index([storeId, isActive])
  @@index([createdAt(sort: Desc)])
  @@unique([storeId, fromCurrency, toCurrency, isActive], name: "exchange_rates_unique_active")
  @@map("exchange_rates")
}

model Product {
  // Campos existentes...

  // Nuevos campos de pricing
  margin          Decimal? @default(30.00) @db.Decimal(5, 2)
  costCurrency    String?  @default("USD") @map("cost_currency") @db.VarChar(3)
  additionalCost  Decimal? @default(0.00) @map("additional_cost") @db.Decimal(10, 2)
  iva             Decimal? @default(0.00) @db.Decimal(5, 2)

  @@index([margin])
}

model Store {
  // Relaciones existentes...
  exchangeRates ExchangeRate[]
}

model User {
  // Relaciones existentes...
  exchangeRatesCreated ExchangeRate[]
}
```

**Comandos**:

```bash
cd backend
npx prisma migrate dev --name add_exchange_rates_and_pricing
npx prisma generate
```

### 1.2 Utilidad de Cálculo de Precios

**Archivo**: `backend/src/utils/priceCalculator.ts`

```typescript
export interface PriceCalculationInput {
  cost: number;
  additionalCost?: number;
  costCurrency: 'VES' | 'USD' | 'EUR';
  margin: number;
  iva?: number;
  exchangeRates: {
    usdToVes?: number;
    eurToVes?: number;
  };
}

export interface CalculatedPrices {
  priceUSD: number;
  priceVES: number;
  priceEUR: number;
}

export function calculateProductPrices(
  input: PriceCalculationInput
): CalculatedPrices {
  const {
    cost,
    additionalCost = 0,
    costCurrency,
    margin,
    iva = 0,
    exchangeRates,
  } = input;

  // Validaciones
  if (cost <= 0) {
    throw new Error('El costo debe ser mayor a 0');
  }
  if (margin < 0 || margin > 1000) {
    throw new Error('El margen debe estar entre 0% y 1000%');
  }
  if (iva < 0 || iva > 100) {
    throw new Error('El IVA debe estar entre 0% y 100%');
  }

  // Costo total = costo base + costos adicionales
  const totalCost = cost + additionalCost;

  // Convertir costo a USD (moneda referencia)
  let costInUSD = totalCost;

  if (costCurrency === 'VES' && exchangeRates.usdToVes) {
    costInUSD = totalCost / exchangeRates.usdToVes;
  } else if (
    costCurrency === 'EUR' &&
    exchangeRates.eurToVes &&
    exchangeRates.usdToVes
  ) {
    // EUR → VES → USD
    const costInVES =
      totalCost * (exchangeRates.eurToVes / exchangeRates.usdToVes);
    costInUSD = costInVES / exchangeRates.usdToVes;
  }

  // Aplicar margen: Precio = Costo × (1 + Margen/100)
  const basePriceUSD = costInUSD * (1 + margin / 100);

  // Aplicar IVA: Precio final = Precio base × (1 + IVA/100)
  const finalPriceUSD = basePriceUSD * (1 + iva / 100);

  // Calcular precios en otras monedas
  const priceVES = exchangeRates.usdToVes
    ? finalPriceUSD * exchangeRates.usdToVes
    : finalPriceUSD;

  const priceEUR =
    exchangeRates.eurToVes && exchangeRates.usdToVes
      ? (finalPriceUSD * exchangeRates.usdToVes) / exchangeRates.eurToVes
      : finalPriceUSD;

  return {
    priceUSD: Math.round(finalPriceUSD * 100) / 100,
    priceVES: Math.round(priceVES * 100) / 100,
    priceEUR: Math.round(priceEUR * 100) / 100,
  };
}

// Función helper para obtener tasas activas de una tienda
export async function getActiveExchangeRates(storeId: string, prisma: any) {
  const rates = await prisma.exchangeRate.findMany({
    where: {
      storeId,
      isActive: true,
    },
  });

  const usdToVes =
    rates.find((r: any) => r.fromCurrency === 'USD' && r.toCurrency === 'VES')
      ?.rate || 0;

  const eurToVes =
    rates.find((r: any) => r.fromCurrency === 'EUR' && r.toCurrency === 'VES')
      ?.rate || 0;

  return {
    usdToVes: Number(usdToVes),
    eurToVes: Number(eurToVes),
  };
}
```

### 1.3 Controller de Exchange Rates

**Archivo**: `backend/src/controllers/exchangeRateController.ts`

```typescript
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';
import { calculateProductPrices } from '../utils/priceCalculator';

// GET /api/exchange-rates
export async function getExchangeRates(req: AuthRequest, res: Response) {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: 'storeId es requerido' });
    }

    const rates = await prisma.exchangeRate.findMany({
      where: {
        storeId: storeId as string,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Construir objeto activeRate
    const activeRate = {
      usdToVes:
        rates.find((r) => r.fromCurrency === 'USD' && r.toCurrency === 'VES')
          ?.rate || 0,
      eurToVes:
        rates.find((r) => r.fromCurrency === 'EUR' && r.toCurrency === 'VES')
          ?.rate || 0,
      updatedAt: rates[0]?.createdAt || null,
    };

    res.json({ rates, activeRate });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ error: 'Error al obtener tasas de cambio' });
  }
}

// POST /api/exchange-rates
export async function updateExchangeRate(req: AuthRequest, res: Response) {
  try {
    const { storeId, fromCurrency, toCurrency, rate, source } = req.body;

    // Validaciones
    if (!storeId || !fromCurrency || !toCurrency || !rate) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (typeof rate !== 'number' || rate <= 0) {
      return res
        .status(400)
        .json({ error: 'La tasa debe ser un número mayor a 0' });
    }

    if (
      !['VES', 'USD', 'EUR'].includes(fromCurrency) ||
      !['VES', 'USD', 'EUR'].includes(toCurrency)
    ) {
      return res.status(400).json({ error: 'Monedas válidas: USD, VES, EUR' });
    }

    if (fromCurrency === toCurrency) {
      return res
        .status(400)
        .json({ error: 'Las monedas deben ser diferentes' });
    }

    // TODO: Verificar que el usuario es OWNER o ADMIN de la tienda

    // Transacción: desactivar tasa anterior + crear nueva + recalcular productos
    const result = await prisma.$transaction(async (tx) => {
      // 1. Desactivar tasas anteriores del mismo par
      await tx.exchangeRate.updateMany({
        where: {
          storeId,
          fromCurrency,
          toCurrency,
          isActive: true,
        },
        data: { isActive: false },
      });

      // 2. Crear nueva tasa activa
      const newRate = await tx.exchangeRate.create({
        data: {
          storeId,
          fromCurrency,
          toCurrency,
          rate: parseFloat(rate.toString()),
          source: source || 'MANUAL',
          isActive: true,
          createdBy: req.user?.userId,
        },
      });

      // 3. Obtener todas las tasas activas actualizadas
      const allRates = await tx.exchangeRate.findMany({
        where: { storeId, isActive: true },
      });

      const exchangeRates = {
        usdToVes: Number(
          allRates.find(
            (r) => r.fromCurrency === 'USD' && r.toCurrency === 'VES'
          )?.rate || 0
        ),
        eurToVes: Number(
          allRates.find(
            (r) => r.fromCurrency === 'EUR' && r.toCurrency === 'VES'
          )?.rate || 0
        ),
      };

      // 4. Recalcular precios de todos los productos
      const products = await tx.product.findMany({
        where: { storeId },
      });

      for (const product of products) {
        try {
          const updatedPrices = calculateProductPrices({
            cost: Number(product.cost || 0),
            additionalCost: Number(product.additionalCost || 0),
            costCurrency:
              (product.costCurrency as 'VES' | 'USD' | 'EUR') || 'USD',
            margin: Number(product.margin || 30),
            iva: Number(product.iva || 0),
            exchangeRates,
          });

          await tx.product.update({
            where: { id: product.id },
            data: {
              priceVES: updatedPrices.priceVES,
              priceUSD: updatedPrices.priceUSD,
              priceEUR: updatedPrices.priceEUR,
            },
          });
        } catch (calcError) {
          console.warn(`Error recalculando producto ${product.id}:`, calcError);
          // Continuar con el siguiente producto
        }
      }

      return { newRate, productsUpdated: products.length };
    });

    res.json({
      message: 'Tasa actualizada exitosamente',
      rate: result.newRate,
      productsUpdated: result.productsUpdated,
    });
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    res.status(500).json({ error: 'Error al actualizar tasa de cambio' });
  }
}
```

### 1.4 Routes de Exchange Rates

**Archivo**: `backend/src/routes/exchangeRateRoutes.ts`

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getExchangeRates,
  updateExchangeRate,
} from '../controllers/exchangeRateController';

const router = Router();

router.get('/', authMiddleware, getExchangeRates);
router.post('/', authMiddleware, updateExchangeRate);

export default router;
```

**Actualizar**: `backend/src/app.ts`

```typescript
// Importar routes
import exchangeRateRoutes from './routes/exchangeRateRoutes';

// Registrar routes
app.use('/api/exchange-rates', exchangeRateRoutes);
```

### 1.5 Modificar Controller de Products

**Archivo**: `backend/src/controllers/productController.ts`

Modificar la función `createProduct` para usar `calculateProductPrices`:

```typescript
import {
  calculateProductPrices,
  getActiveExchangeRates,
} from '../utils/priceCalculator';

export async function createProduct(req: AuthRequest, res: Response) {
  try {
    const {
      storeId,
      name,
      category,
      description,
      sku,
      barcode,
      cost,
      costCurrency = 'USD',
      additionalCost = 0,
      margin = 30,
      iva = 0,
      stock,
      minStock,
      trackInventory,
      image,
    } = req.body;

    // Validaciones existentes...

    // Obtener tasas de cambio activas
    const exchangeRates = await getActiveExchangeRates(storeId, prisma);

    // Calcular precios automáticamente
    const calculatedPrices = calculateProductPrices({
      cost,
      additionalCost,
      costCurrency,
      margin,
      iva,
      exchangeRates,
    });

    const product = await prisma.product.create({
      data: {
        storeId,
        name,
        category,
        description,
        sku,
        barcode,
        cost,
        costCurrency,
        additionalCost,
        margin,
        iva,
        priceVES: calculatedPrices.priceVES,
        priceUSD: calculatedPrices.priceUSD,
        priceEUR: calculatedPrices.priceEUR,
        stock,
        minStock,
        trackInventory,
        image,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
}

// Hacer lo mismo para updateProduct
```

---

## Fase 2: Frontend Core (1.5 días)

### 2.1 Actualizar Paleta de Colores

**Archivo**: `tailwind.config.ts`

```typescript
const config = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2D7A5B',
          'primary-dark': '#1f5540',
          'primary-light': '#e5f7ed',
          secondary: '#2f5ae0',
          'secondary-light': '#edf3f8',
        },
        success: '#2e7d32',
        error: '#c62828',
        warning: '#f57c00',
        info: '#2196F3',
      },
    },
  },
};
```

### 2.2 Hook useExchangeRates

**Archivo**: `lib/hooks/useExchangeRates.ts`

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '../api';

interface ExchangeRate {
  id: string;
  storeId: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  isActive: boolean;
  createdAt: string;
}

interface ActiveRate {
  usdToVes: number;
  eurToVes: number;
  updatedAt: string | null;
}

export function useExchangeRates(storeId: string) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [activeRate, setActiveRate] = useState<ActiveRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/exchange-rates?storeId=${storeId}`
      );
      setRates(response.data.rates);
      setActiveRate(response.data.activeRate);
      setError(null);
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
      setError('Error al cargar tasas de cambio');
    } finally {
      setLoading(false);
    }
  };

  const updateRate = async (data: {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    source?: string;
  }) => {
    try {
      await apiClient.post('/exchange-rates', {
        storeId,
        ...data,
      });
      await fetchRates();
    } catch (err) {
      console.error('Error updating exchange rate:', err);
      throw new Error('Error al actualizar tasa de cambio');
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchRates();
    }
  }, [storeId]);

  return {
    rates,
    activeRate,
    loading,
    error,
    refetch: fetchRates,
    updateRate,
  };
}
```

### 2.3 Componente TasaActivaCard

**Archivo**: `components/dashboard/TasaActivaCard.tsx`

```typescript
import { ArrowRightLeft } from 'lucide-react';

interface TasaActivaCardProps {
  rate: number;
  fromCurrency: string;
  toCurrency: string;
  updatedAt: Date | string;
  onUpdate?: () => void;
}

export function TasaActivaCard({
  rate,
  fromCurrency,
  toCurrency,
  updatedAt,
  onUpdate,
}: TasaActivaCardProps) {
  const formattedDate = new Date(updatedAt).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          TASA ACTIVA
        </p>
        <ArrowRightLeft className="h-5 w-5 text-info" />
      </div>

      <h2 className="mt-3 text-4xl font-bold text-gray-900">
        {rate.toFixed(2)} {toCurrency}
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Actualizada {formattedDate}
      </p>

      {onUpdate && (
        <button
          onClick={onUpdate}
          className="mt-4 text-sm font-medium text-brand-primary hover:text-brand-primary-dark"
        >
          Actualizar tasa →
        </button>
      )}
    </div>
  );
}
```

### 2.4 Utilidad de Cálculo de Precios (Frontend)

**Archivo**: `lib/utils/priceCalculator.ts`

```typescript
// Copia la misma lógica del backend para cálculos en tiempo real
export interface PriceCalculationInput {
  cost: number;
  additionalCost?: number;
  costCurrency: 'VES' | 'USD' | 'EUR';
  margin: number;
  iva?: number;
  exchangeRates: {
    usdToVes?: number;
    eurToVes?: number;
  };
}

export interface CalculatedPrices {
  priceUSD: number;
  priceVES: number;
  priceEUR: number;
}

export function calculateProductPrices(
  input: PriceCalculationInput
): CalculatedPrices {
  // Misma implementación que en backend/src/utils/priceCalculator.ts
  // ... (copiar código)
}
```

### 2.5 Componente ProductFormWithCalculations

**Archivo**: `components/products/ProductFormWithCalculations.tsx`

Este componente reemplazará el `ProductForm` actual. Incluirá:

- Campos de costo, costo adicional, moneda del costo
- Selector de margen e IVA
- Cálculo en tiempo real de precios usando `useEffect`
- Card verde con precios calculados (solo lectura)

(Código completo ~300 líneas, ver especificación sección 5.2)

---

## Fase 3: Gestión de Tasas (1 día)

### 3.1 Página de Gestión de Tasas

**Archivo**: `app/dashboard/exchange-rates/page.tsx`

Pantalla accesible solo para OWNER/ADMIN que incluye:

- TasaActivaCard destacada
- Formulario para actualizar tasa
- Alerta de impacto en productos
- Historial de tasas

### 3.2 Componente RateHistoryTable

**Archivo**: `components/exchange-rates/RateHistoryTable.tsx`

Tabla con:

- Fecha de actualización
- Par de monedas (USD→VES, EUR→VES)
- Tasa
- Fuente (MANUAL, BCV, PARALELO)
- Usuario que actualizó

---

## Fase 4: Branding y UX (0.5 días)

### 4.1 Actualizar Header

**Archivo**: `components/layout/Header.tsx`

Cambiar "PANEL DE CONTROL" por "T-Suma"

### 4.2 Actualizar Dashboard

**Archivo**: `app/dashboard/page.tsx`

- Agregar TasaActivaCard en la parte superior
- Cards de resumen operativo con iconos de Lucide React
- Botones "Operando en VES" y "Ver tasa y referencia"

### 4.3 Iconografía

Reemplazar iconos actuales por Lucide React:

- ShoppingCart, Package, Users, Building2, etc.

---

## Fase 5: Testing y Validación (1 día)

### 5.1 Tests Unitarios

**Archivo**: `backend/src/__tests__/priceCalculator.test.ts`

Tests de `calculateProductPrices`:

- Costo en USD con margen 30%
- Costo en VES con conversión
- Costo adicional
- Aplicación de IVA
- Casos borde (margen 0%, sin tasa)

### 5.2 Tests de Integración

**Archivo**: `backend/src/__tests__/exchangeRates.test.ts`

Tests de endpoints:

- GET /api/exchange-rates
- POST /api/exchange-rates
- Recálculo de productos

### 5.3 Validación Manual

Checklist de criterios de aceptación de la especificación

---

## Checklist de Progreso

### ✅ Fase 1: Backend

- [ ] Migración de base de datos
- [ ] Modelo Prisma actualizado
- [ ] Utilidad priceCalculator.ts
- [ ] Controller exchangeRateController.ts
- [ ] Routes exchangeRateRoutes.ts
- [ ] Modificar productController.ts

### ⏳ Fase 2: Frontend Core

- [ ] Actualizar tailwind.config.ts
- [ ] Hook useExchangeRates
- [ ] Componente TasaActivaCard
- [ ] Utilidad priceCalculator.ts (frontend)
- [ ] Componente ProductFormWithCalculations

### ⏳ Fase 3: Gestión de Tasas

- [ ] Página exchange-rates/page.tsx
- [ ] Componente RateHistoryTable

### ⏳ Fase 4: Branding

- [ ] Header con "T-Suma"
- [ ] Dashboard actualizado
- [ ] Iconos Lucide React

### ⏳ Fase 5: Testing

- [ ] Tests unitarios priceCalculator
- [ ] Tests integración exchangeRates
- [ ] Validación manual

---

## Riesgos y Mitigaciones

Ver sección 9 de la especificación.

---

## Comandos para Ejecutar

```bash
# Fase 1: Backend
cd backend
npx prisma migrate dev --name add_exchange_rates_and_pricing
npx prisma generate
npm run dev

# Fase 2-4: Frontend
cd ..
yarn install
yarn dev

# Fase 5: Testing
cd backend
npm test
```

---

**Estado**: 🚧 Iniciar con Fase 1
