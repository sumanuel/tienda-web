# Especificación: Alineación tienda-web con tienda-app

**Versión**: 1.0.0  
**Fecha**: 2026-08-25  
**Estado**: ✅ Aprobado para implementación

---

## 1. Resumen Ejecutivo

**tienda-web** es la versión web de **tienda-app** (React Native móvil). Actualmente ambas aplicaciones tienen:

- ✅ Backend PostgreSQL funcional
- ✅ Autenticación JWT
- ✅ CRUD de productos, clientes, proveedores

Sin embargo, existen **inconsistencias críticas**:

### Problemas Actuales

1. ❌ **Identidad visual diferente**: tienda-web usa colores genéricos, tienda-app usa paleta verde corporativa
2. ❌ **Nombre incorrecto**: tienda-web muestra "PANEL DE CONTROL", debería mostrar "**T-Suma**"
3. ❌ **Lógica de negocio faltante**:
   - tienda-app calcula precios de venta automáticamente basados en **costo + margen**
   - tienda-web requiere ingresar manualmente priceVES y priceUSD
4. ❌ **Sin gestión de tasas de cambio**: tienda-app tiene un módulo completo de exchange rates

### Objetivo

Alinear tienda-web con la experiencia, diseño y lógica de negocio de tienda-app, manteniendo la arquitectura Next.js + PostgreSQL.

---

## 2. Diseño Visual

### 2.1 Paleta de Colores

**Colores Principales** (de `AppUI.js` en tienda-app):

```typescript
// Colores Corporativos T-Suma
const brandColors = {
  primary: '#2D7A5B', // Verde corporativo principal
  primaryDark: '#1f5540', // Verde oscuro para hover/active
  primaryLight: '#e5f7ed', // Verde claro para fondos

  secondary: '#2f5ae0', // Azul secundario
  secondaryLight: '#edf3f8', // Azul claro

  success: '#2e7d32', // Verde éxito
  error: '#c62828', // Rojo error
  warning: '#f57c00', // Naranja advertencia
  info: '#2196F3', // Azul info
};

// Backgrounds
const backgrounds = {
  page: '#f4f7fb', // Fondo general de página
  surface: '#ffffff', // Tarjetas y superficies
  surfaceAlt: '#f7faf8', // Superficies alternativas
};

// Textos
const textColors = {
  primary: '#1f2937', // Texto principal oscuro
  secondary: '#6b7280', // Texto secundario gris
  muted: '#9aa2b1', // Texto deshabilitado
  light: '#ffffff', // Texto sobre fondos oscuros
};

// Bordes
const borders = {
  default: '#d9e0eb', // Borde de inputs y cards
  light: '#e5e7eb', // Bordes sutiles
};
```

### 2.2 Tipografía

**Jerarquía de Textos**:

```css
/* Hero Titles */
.hero-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

/* Section Headers */
.section-header {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

/* Card Titles */
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Values / Metrics */
.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

/* Body Text */
.body-text {
  font-size: 14px;
  font-weight: 400;
  color: #1f2937;
  line-height: 1.5;
}

/* Labels */
.label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
```

### 2.3 Componentes UI a Replicar

#### Header Principal

```tsx
// Debe mostrar:
- Logo "T-Suma" (en lugar de "PANEL DE CONTROL")
- Última sesión con fecha/hora
- Iconos de notificaciones y ayuda
- Fondo verde corporativo (#2D7A5B)
```

#### Tasa Activa Card

```tsx
// Card destacada en la parte superior
{
  title: "TASA ACTIVA",
  value: "764.35 VES",
  subtitle: "Actualizada 12/8/2026",
  bgColor: "#ffffff",
  borderRadius: "16px",
  shadow: "0 2px 8px rgba(0,0,0,0.1)"
}
```

#### Botones de Acción Rápida

```tsx
// Botones principales:
- "Operando en VES" (verde claro #e5f7ed, texto verde #2D7A5B)
- "Ver tasa y referencia" (outlined, borde verde)
```

#### Cards de Resumen Operativo

```tsx
// Grid de cards 2x2:
1. Tasa de cambio (icono intercambio, azul #2f5ae0)
2. Nueva venta (icono carrito, verde #2e7d32)
3. Por cobrar (icono billetes, verde #2e7d32)
4. Por pagar (icono tarjeta, rojo #c62828)
5. Movimientos de inventario (icono caja, naranja #f57c00)
6. Red comercial (icono personas, azul #2196F3)
```

### 2.4 Iconografía

**Usar Lucide React Icons** (equivalentes a Ionicons):

```tsx
import {
  ShoppingCart, // cart-outline → Nueva venta
  BarChart3, // stats-chart-outline → Estadísticas
  Package, // cube-outline → Inventario
  Users, // people-outline → Clientes
  Building2, // business-outline → Proveedores
  ArrowRightLeft, // swap-horizontal-outline → Tasa de cambio
  DollarSign, // cash-outline → Por cobrar
  CreditCard, // card-outline → Por pagar
  TrendingUp, // trending-up → Ventas
  Settings, // settings-outline → Configuración
  Bell, // notifications-outline → Notificaciones
  HelpCircle, // help-circle-outline → Ayuda
} from 'lucide-react';
```

### 2.5 Layouts Responsive

**Breakpoints**:

```css
mobile: 0-640px    /* Stack vertical */
tablet: 641-1024px /* Grid 2 columnas */
desktop: 1025px+   /* Grid 3 columnas */
```

---

## 3. Modelo de Datos

### 3.1 Tabla `exchange_rates`

**Crear nueva tabla**:

```sql
CREATE TABLE exchange_rates (
  id SERIAL PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Monedas
  from_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  to_currency VARCHAR(3) NOT NULL DEFAULT 'VES',

  -- Tasa de cambio
  rate DECIMAL(18, 6) NOT NULL,

  -- Origen de la tasa
  source VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
  -- Valores posibles: 'MANUAL', 'BCV', 'PARALELO', 'API_EXTERNA'

  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Auditoría
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Índices
  CONSTRAINT exchange_rates_unique_active
    UNIQUE (store_id, from_currency, to_currency, is_active)
    WHERE is_active = true
);

CREATE INDEX idx_exchange_rates_store ON exchange_rates(store_id);
CREATE INDEX idx_exchange_rates_active ON exchange_rates(store_id, is_active);
CREATE INDEX idx_exchange_rates_created_at ON exchange_rates(created_at DESC);
```

**Registros iniciales por tienda**:

```sql
-- Al crear una tienda, insertar tasa default
INSERT INTO exchange_rates (store_id, from_currency, to_currency, rate, source, is_active)
VALUES (
  'store-uuid',
  'USD',
  'VES',
  764.35,  -- Valor inicial de referencia
  'MANUAL',
  true
);
```

### 3.2 Modificaciones a tabla `products`

**Agregar campos de pricing**:

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS margin DECIMAL(5, 2) DEFAULT 30.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE products ADD COLUMN IF NOT EXISTS additional_cost DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS iva DECIMAL(5, 2) DEFAULT 0.00;

-- Índice para búsqueda por margen
CREATE INDEX IF NOT EXISTS idx_products_margin ON products(margin);

COMMENT ON COLUMN products.margin IS 'Porcentaje de margen de ganancia (ej: 30.00 = 30%)';
COMMENT ON COLUMN products.cost_currency IS 'Moneda en la que se expresó el costo (USD, VES, EUR)';
COMMENT ON COLUMN products.additional_cost IS 'Costos adicionales (flete, impuestos, etc.)';
COMMENT ON COLUMN products.iva IS 'Porcentaje de IVA a aplicar (ej: 16.00 = 16%)';
```

**Modelo TypeScript actualizado**:

```typescript
interface Product {
  id: string;
  store_id: string;

  // Identificación
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  category: string;
  image?: string;

  // Pricing
  cost: number; // Costo base del producto
  additional_cost: number; // Costos adicionales (flete, etc.)
  cost_currency: 'VES' | 'USD' | 'EUR'; // Moneda del costo
  margin: number; // Margen de ganancia (%)
  iva: number; // IVA (%)

  // Precios calculados (NO se ingresan manualmente)
  price_ves: number; // Calculado automáticamente
  price_usd: number; // Calculado automáticamente
  price_eur: number; // Calculado automáticamente

  // Inventario
  stock: number;
  min_stock: number;
  track_inventory: boolean;

  // Auditoría
  created_at: Date;
  updated_at: Date;
}
```

---

## 4. Backend - Endpoints

### 4.1 GET /api/exchange-rates

**Descripción**: Obtener tasas de cambio activas de una tienda.

**Request**:

```http
GET /api/exchange-rates?storeId=store-uuid
Authorization: Bearer {token}
```

**Response**:

```json
{
  "rates": [
    {
      "id": "rate-uuid",
      "storeId": "store-uuid",
      "fromCurrency": "USD",
      "toCurrency": "VES",
      "rate": 764.35,
      "source": "MANUAL",
      "isActive": true,
      "createdBy": "user-uuid",
      "createdAt": "2026-08-12T10:30:00Z"
    },
    {
      "id": "rate-uuid-2",
      "storeId": "store-uuid",
      "fromCurrency": "EUR",
      "toCurrency": "VES",
      "rate": 820.5,
      "source": "MANUAL",
      "isActive": true,
      "createdBy": "user-uuid",
      "createdAt": "2026-08-12T10:30:00Z"
    }
  ],
  "activeRate": {
    "usdToVes": 764.35,
    "eurToVes": 820.5,
    "updatedAt": "2026-08-12T10:30:00Z"
  }
}
```

**Controller**:

```typescript
// backend/src/controllers/exchangeRateController.ts
export async function getExchangeRates(req: AuthRequest, res: Response) {
  const { storeId } = req.query;

  const rates = await prisma.exchangeRate.findMany({
    where: {
      storeId: storeId as string,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Construir objeto activeRate con las tasas principales
  const activeRate = {
    usdToVes:
      rates.find((r) => r.fromCurrency === 'USD' && r.toCurrency === 'VES')
        ?.rate || 0,
    eurToVes:
      rates.find((r) => r.fromCurrency === 'EUR' && r.toCurrency === 'VES')
        ?.rate || 0,
    updatedAt: rates[0]?.createdAt,
  };

  res.json({ rates, activeRate });
}
```

### 4.2 POST /api/exchange-rates

**Descripción**: Crear/actualizar tasa de cambio (solo OWNER/ADMIN).

**Request**:

```http
POST /api/exchange-rates
Authorization: Bearer {token}
Content-Type: application/json

{
  "storeId": "store-uuid",
  "fromCurrency": "USD",
  "toCurrency": "VES",
  "rate": 800.00,
  "source": "MANUAL"
}
```

**Validaciones**:

- ✅ Usuario debe ser OWNER o ADMIN
- ✅ `rate` debe ser > 0
- ✅ `fromCurrency` y `toCurrency` deben ser diferentes
- ✅ Monedas válidas: USD, VES, EUR

**Lógica**:

1. Desactivar tasa anterior (si existe) para el mismo par de monedas
2. Crear nueva tasa activa
3. **Recalcular precios de todos los productos** de la tienda

**Response**:

```json
{
  "message": "Tasa actualizada exitosamente",
  "rate": {
    "id": "new-rate-uuid",
    "storeId": "store-uuid",
    "fromCurrency": "USD",
    "toCurrency": "VES",
    "rate": 800.0,
    "source": "MANUAL",
    "isActive": true,
    "createdAt": "2026-08-25T14:30:00Z"
  },
  "productsUpdated": 45
}
```

**Controller**:

```typescript
export async function updateExchangeRate(req: AuthRequest, res: Response) {
  const { storeId, fromCurrency, toCurrency, rate, source } = req.body;

  // Verificar permisos (OWNER o ADMIN)
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { stores: true },
  });

  if (!user.stores.some((s) => s.id === storeId)) {
    return res.status(403).json({ error: 'No tienes acceso a esta tienda' });
  }

  // Transacción: desactivar tasa anterior + crear nueva + recalcular productos
  const result = await prisma.$transaction(async (tx) => {
    // 1. Desactivar tasas anteriores
    await tx.exchangeRate.updateMany({
      where: {
        storeId,
        fromCurrency,
        toCurrency,
        isActive: true,
      },
      data: { isActive: false },
    });

    // 2. Crear nueva tasa
    const newRate = await tx.exchangeRate.create({
      data: {
        storeId,
        fromCurrency,
        toCurrency,
        rate: parseFloat(rate),
        source: source || 'MANUAL',
        isActive: true,
        createdBy: req.user.userId,
      },
    });

    // 3. Recalcular precios de productos
    const products = await tx.product.findMany({
      where: { storeId },
    });

    for (const product of products) {
      const updatedPrices = calculateProductPrices({
        cost: product.cost,
        additionalCost: product.additionalCost,
        costCurrency: product.costCurrency,
        margin: product.margin,
        exchangeRates: {
          usdToVes:
            fromCurrency === 'USD' && toCurrency === 'VES'
              ? parseFloat(rate)
              : undefined,
          eurToVes:
            fromCurrency === 'EUR' && toCurrency === 'VES'
              ? parseFloat(rate)
              : undefined,
        },
      });

      await tx.product.update({
        where: { id: product.id },
        data: {
          priceVES: updatedPrices.priceVES,
          priceUSD: updatedPrices.priceUSD,
          priceEUR: updatedPrices.priceEUR,
        },
      });
    }

    return { newRate, productsUpdated: products.length };
  });

  res.json({
    message: 'Tasa actualizada exitosamente',
    rate: result.newRate,
    productsUpdated: result.productsUpdated,
  });
}
```

### 4.3 POST /api/products (modificado)

**Request actualizado**:

```http
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "storeId": "store-uuid",
  "name": "Laptop HP",
  "category": "Electrónica",
  "description": "Laptop HP 15 pulgadas",
  "sku": "LAP-001",
  "barcode": "1234567890",

  // NUEVOS CAMPOS
  "cost": 300.00,              // Costo en la moneda especificada
  "costCurrency": "USD",        // Moneda del costo
  "additionalCost": 20.00,      // Costos adicionales
  "margin": 25.00,              // Margen de ganancia (%)
  "iva": 16.00,                 // IVA (%)

  // ESTOS CAMPOS YA NO SE ENVÍAN (se calculan automáticamente)
  // "priceVES": X,
  // "priceUSD": Y,

  "stock": 10,
  "minStock": 2,
  "trackInventory": true
}
```

**Lógica de cálculo automático**:

```typescript
// backend/src/utils/priceCalculator.ts
export function calculateProductPrices({
  cost,
  additionalCost = 0,
  costCurrency,
  margin,
  iva = 0,
  exchangeRates,
}: {
  cost: number;
  additionalCost?: number;
  costCurrency: 'VES' | 'USD' | 'EUR';
  margin: number;
  iva?: number;
  exchangeRates: {
    usdToVes?: number;
    eurToVes?: number;
  };
}) {
  // Costo total = costo base + costos adicionales
  const totalCost = cost + additionalCost;

  // Convertir costo a USD (referencia base)
  let costInUSD = totalCost;
  if (costCurrency === 'VES' && exchangeRates.usdToVes) {
    costInUSD = totalCost / exchangeRates.usdToVes;
  } else if (
    costCurrency === 'EUR' &&
    exchangeRates.eurToVes &&
    exchangeRates.usdToVes
  ) {
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
```

**Ejemplo de cálculo**:

```
Entrada:
  cost = $300 USD
  additionalCost = $20 USD
  margin = 25%
  iva = 16%
  exchangeRate (USD→VES) = 764.35

Cálculo:
  totalCost = $300 + $20 = $320
  basePriceUSD = $320 × 1.25 = $400
  finalPriceUSD = $400 × 1.16 = $464
  priceVES = $464 × 764.35 = VES 354,658.40

Resultado:
  priceUSD: $464.00
  priceVES: VES 354,658.40
```

---

## 5. Frontend - Componentes

### 5.1 TasaActivaCard

**Ubicación**: `components/dashboard/TasaActivaCard.tsx`

**Props**:

```typescript
interface TasaActivaCardProps {
  rate: number;
  fromCurrency: string;
  toCurrency: string;
  updatedAt: Date;
  onUpdate?: () => void; // Solo para admin/owner
}
```

**Diseño**:

```tsx
<div className="rounded-2xl bg-white p-6 shadow-sm">
  <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
    TASA ACTIVA
  </p>
  <h2 className="mt-2 text-4xl font-bold text-gray-900">
    {rate.toFixed(2)} {toCurrency}
  </h2>
  <p className="mt-1 text-sm text-gray-500">
    Actualizada {formatDate(updatedAt)}
  </p>

  {onUpdate && (
    <button onClick={onUpdate} className="text-brand-primary mt-4 text-sm">
      Actualizar tasa →
    </button>
  )}
</div>
```

### 5.2 ProductFormWithCalculations

**Ubicación**: `components/products/ProductFormWithCalculations.tsx`

**Estado local**:

```typescript
const [cost, setCost] = useState('');
const [additionalCost, setAdditionalCost] = useState('');
const [costCurrency, setCostCurrency] = useState('USD');
const [margin, setMargin] = useState(30);
const [iva, setIva] = useState(0);

// Precios calculados automáticamente
const [calculatedPrices, setCalculatedPrices] = useState({
  usd: '',
  ves: '',
  eur: '',
});
```

**useEffect para cálculo en tiempo real**:

```typescript
useEffect(() => {
  if (!cost || isNaN(parseFloat(cost))) {
    setCalculatedPrices({ usd: '', ves: '', eur: '' });
    return;
  }

  const costValue = parseFloat(cost);
  const additionalCostValue = additionalCost ? parseFloat(additionalCost) : 0;

  // Obtener tasa de cambio actual
  const usdToVes = exchangeRates?.usdToVes || 0;
  const eurToVes = exchangeRates?.eurToVes || 0;

  // Calcular precios
  const prices = calculateProductPrices({
    cost: costValue,
    additionalCost: additionalCostValue,
    costCurrency,
    margin,
    iva,
    exchangeRates: { usdToVes, eurToVes },
  });

  setCalculatedPrices({
    usd: prices.priceUSD.toFixed(2),
    ves: prices.priceVES.toFixed(2),
    eur: prices.priceEUR.toFixed(2),
  });
}, [cost, additionalCost, costCurrency, margin, iva, exchangeRates]);
```

**Renderizado del formulario**:

```tsx
<form onSubmit={handleSubmit}>
  {/* Información básica */}
  <Input label="Nombre del producto *" {...register('name')} />
  <Input label="Categoría" {...register('category')} />
  <Input label="Código de barras" {...register('barcode')} />

  {/* Sección de Costos y Margen */}
  <div className="mt-6 rounded-xl border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900">Costos y Margen</h3>

    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Costo *
        </label>
        <input
          type="number"
          step="0.01"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Moneda del Costo
        </label>
        <select
          value={costCurrency}
          onChange={(e) => setCostCurrency(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="USD">USD (Dólar)</option>
          <option value="VES">VES (Bolívar)</option>
          <option value="EUR">EUR (Euro)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Costo Adicional
        </label>
        <input
          type="number"
          step="0.01"
          value={additionalCost}
          onChange={(e) => setAdditionalCost(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="Flete, impuestos..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Margen de Ganancia (%)
        </label>
        <input
          type="number"
          step="0.01"
          value={margin}
          onChange={(e) => setMargin(parseFloat(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          Ejemplo: 30% = se vende a 1.30× el costo
        </p>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          IVA (%)
        </label>
        <input
          type="number"
          step="0.01"
          value={iva}
          onChange={(e) => setIva(parseFloat(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>
    </div>
  </div>

  {/* Sección de Precios Calculados */}
  <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6">
    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
      <Calculator className="h-5 w-5 text-green-600" />
      Precios de Venta (Calculados Automáticamente)
    </h3>

    <div className="mt-4 grid gap-4 md:grid-cols-3">
      <div>
        <p className="text-xs font-medium text-gray-600 uppercase">
          Precio USD
        </p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          ${calculatedPrices.usd || '0.00'}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-600 uppercase">
          Precio VES
        </p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          ₿{calculatedPrices.ves || '0.00'}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-600 uppercase">
          Precio EUR
        </p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          €{calculatedPrices.eur || '0.00'}
        </p>
      </div>
    </div>

    {exchangeRates && (
      <p className="mt-4 text-xs text-gray-600">
        Tasa aplicada: 1 USD = {exchangeRates.usdToVes.toFixed(2)} VES
      </p>
    )}
  </div>

  {/* Resto del formulario... */}
</form>
```

### 5.3 ExchangeRateManager

**Ubicación**: `app/dashboard/exchange-rates/page.tsx`

**Solo accesible para OWNER y ADMIN**

**Diseño**:

```tsx
<div className="p-6">
  <h1 className="text-2xl font-bold text-gray-900">
    Gestión de Tasas de Cambio
  </h1>

  {/* Tasa actual destacada */}
  <div className="mt-6 grid gap-6 md:grid-cols-2">
    <TasaActivaCard
      rate={currentRate.usdToVes}
      fromCurrency="USD"
      toCurrency="VES"
      updatedAt={currentRate.updatedAt}
    />

    <TasaActivaCard
      rate={currentRate.eurToVes}
      fromCurrency="EUR"
      toCurrency="VES"
      updatedAt={currentRate.updatedAt}
    />
  </div>

  {/* Formulario para actualizar tasa */}
  <div className="mt-8 rounded-xl border border-gray-200 p-6">
    <h2 className="text-lg font-semibold text-gray-900">
      Actualizar Tasa de Cambio
    </h2>

    <form onSubmit={handleUpdateRate} className="mt-4 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Par de Monedas
          </label>
          <select
            value={currencyPair}
            onChange={(e) => setCurrencyPair(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="USD-VES">USD → VES</option>
            <option value="EUR-VES">EUR → VES</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nueva Tasa
          </label>
          <input
            type="number"
            step="0.000001"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Ej: 764.35"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Fuente
        </label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="MANUAL">Manual</option>
          <option value="BCV">BCV (Banco Central)</option>
          <option value="PARALELO">Mercado Paralelo</option>
        </select>
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-900">
              Atención: Impacto en productos
            </p>
            <p className="mt-1 text-sm text-yellow-700">
              Al actualizar la tasa, se recalcularán automáticamente los precios
              de venta de <strong>todos los productos</strong> de la tienda.
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="bg-brand-primary hover:bg-brand-primary-dark w-full rounded-lg px-4 py-2 text-white"
      >
        Actualizar Tasa y Recalcular Precios
      </button>
    </form>
  </div>

  {/* Historial de tasas */}
  <div className="mt-8">
    <h2 className="text-lg font-semibold text-gray-900">Historial de Tasas</h2>
    <RateHistoryTable rates={rateHistory} />
  </div>
</div>
```

---

## 6. Lógica de Cálculo

### 6.1 Fórmulas Detalladas

**Fórmula general**:

```
1. Costo Total = Costo Base + Costo Adicional
2. Convertir costo a USD (moneda referencia)
3. Precio Base = Costo Total USD × (1 + Margen/100)
4. Precio Final = Precio Base × (1 + IVA/100)
5. Precio VES = Precio Final USD × Tasa(USD→VES)
6. Precio EUR = Precio Final USD × (Tasa(USD→VES) / Tasa(EUR→VES))
```

**Ejemplo 1: Costo en USD**

```
Entrada:
  cost = $250
  additionalCost = $15
  costCurrency = USD
  margin = 30%
  iva = 16%
  tasa USD→VES = 764.35

Cálculo:
  totalCost = $250 + $15 = $265
  costInUSD = $265 (ya está en USD)
  basePrice = $265 × 1.30 = $344.50
  finalPriceUSD = $344.50 × 1.16 = $399.62
  priceVES = $399.62 × 764.35 = VES 305,509.07

Resultado:
  priceUSD = $399.62
  priceVES = VES 305,509.07
```

**Ejemplo 2: Costo en VES**

```
Entrada:
  cost = VES 50,000
  additionalCost = VES 5,000
  costCurrency = VES
  margin = 25%
  iva = 0%
  tasa USD→VES = 764.35

Cálculo:
  totalCost = VES 55,000
  costInUSD = VES 55,000 / 764.35 = $71.95
  basePrice = $71.95 × 1.25 = $89.94
  finalPriceUSD = $89.94 × 1.00 = $89.94
  priceVES = $89.94 × 764.35 = VES 68,741.35

Resultado:
  priceUSD = $89.94
  priceVES = VES 68,741.35
```

### 6.2 Validaciones

**Frontend**:

```typescript
// Validaciones antes de calcular precios
if (!cost || parseFloat(cost) <= 0) {
  return { error: 'El costo debe ser mayor a 0' };
}

if (additionalCost && parseFloat(additionalCost) < 0) {
  return { error: 'El costo adicional no puede ser negativo' };
}

if (margin < 0 || margin > 1000) {
  return { error: 'El margen debe estar entre 0% y 1000%' };
}

if (iva < 0 || iva > 100) {
  return { error: 'El IVA debe estar entre 0% y 100%' };
}

if (!exchangeRates?.usdToVes || exchangeRates.usdToVes <= 0) {
  return { error: 'No hay tasa de cambio configurada' };
}
```

**Backend**:

```typescript
// Validaciones en el endpoint POST /api/products
if (typeof cost !== 'number' || cost <= 0) {
  return res.status(400).json({ error: 'cost debe ser un número mayor a 0' });
}

if (!['VES', 'USD', 'EUR'].includes(costCurrency)) {
  return res
    .status(400)
    .json({ error: 'costCurrency debe ser VES, USD o EUR' });
}

if (typeof margin !== 'number' || margin < 0 || margin > 1000) {
  return res.status(400).json({ error: 'margin debe estar entre 0 y 1000' });
}

// Obtener tasa de cambio activa
const activeRate = await prisma.exchangeRate.findFirst({
  where: {
    storeId,
    isActive: true,
    fromCurrency: 'USD',
    toCurrency: 'VES',
  },
});

if (!activeRate) {
  return res.status(400).json({
    error: 'No hay tasa de cambio activa. Configure una tasa primero.',
  });
}
```

### 6.3 Casos Borde

**Caso 1: Tasa de cambio no disponible**

```typescript
// Si no hay tasa USD→VES activa, usar precio USD como VES
if (!exchangeRates?.usdToVes) {
  return {
    priceUSD: finalPriceUSD,
    priceVES: finalPriceUSD, // Mismo valor
    priceEUR: finalPriceUSD,
  };
}
```

**Caso 2: Margen de 0%**

```typescript
// Precio de venta = costo (sin ganancia)
// Útil para productos sin margen o promociones
if (margin === 0) {
  return {
    priceUSD: cost,
    priceVES: cost * exchangeRates.usdToVes,
  };
}
```

**Caso 3: Costo adicional mayor al costo base**

```typescript
// Es válido: algunos productos tienen altos costos de importación
// Ejemplo: Producto $10, Flete $15 → Costo total $25
const totalCost = cost + additionalCost; // $25
// ✅ Permitir y calcular normalmente
```

**Caso 4: Actualización masiva de tasa**

```typescript
// Al actualizar tasa, recalcular productos en lotes de 100
const batchSize = 100;
const totalProducts = await prisma.product.count({ where: { storeId } });
const batches = Math.ceil(totalProducts / batchSize);

for (let i = 0; i < batches; i++) {
  const products = await prisma.product.findMany({
    where: { storeId },
    skip: i * batchSize,
    take: batchSize,
  });

  await prisma.$transaction(
    products.map(p => prisma.product.update({
      where: { id: p.id },
      data: calculateProductPrices({...}),
    }))
  );
}
```

---

## 7. Criterios de Aceptación

### ✅ Diseño Visual

- [ ] Header muestra "T-Suma" en lugar de "PANEL DE CONTROL"
- [ ] Colores corporativos aplicados (verde #2D7A5B, azul #2f5ae0)
- [ ] Cards con bordes redondeados (16px) y sombras sutiles
- [ ] Iconos de Lucide React correctamente implementados
- [ ] Responsive: mobile (stack), tablet (2 cols), desktop (3 cols)

### ✅ Tasa de Cambio

- [ ] Card "Tasa Activa" visible en dashboard principal
- [ ] Pantalla de gestión de tasas accesible solo para OWNER/ADMIN
- [ ] Al actualizar tasa, se recalculan automáticamente precios de productos
- [ ] Historial de tasas visible con fecha y fuente

### ✅ Formulario de Productos

- [ ] Campos: Costo, Costo Adicional, Moneda del Costo, Margen, IVA
- [ ] Precios de venta calculados en tiempo real (onChange)
- [ ] Muestra precios en USD, VES, EUR simultáneamente
- [ ] Deshabilita edición manual de precios de venta
- [ ] Muestra tasa aplicada debajo de precios calculados

### ✅ Backend

- [ ] Tabla `exchange_rates` creada con índices
- [ ] Endpoint GET /api/exchange-rates funcional
- [ ] Endpoint POST /api/exchange-rates funcional (solo admin)
- [ ] Endpoint POST /api/products calcula precios automáticamente
- [ ] Validaciones de permisos implementadas
- [ ] Recálculo masivo de productos al actualizar tasa

### ✅ Lógica de Negocio

- [ ] Fórmula de cálculo correcta: Precio = Costo × (1 + Margen/100) × (1 + IVA/100)
- [ ] Conversión entre monedas correcta
- [ ] Manejo de costos adicionales
- [ ] Redondeo a 2 decimales

### ✅ Testing

- [ ] Crear producto con costo USD: precios calculados correctamente
- [ ] Crear producto con costo VES: conversión y cálculo correctos
- [ ] Actualizar tasa: productos recalculados
- [ ] Editar margen de producto: precios se actualizan
- [ ] Usuario sin permisos: no puede acceder a gestión de tasas

---

## 8. Casos de Uso Detallados

### Caso de Uso 1: Usuario registra producto con costo en USD y margen del 25%

**Actor**: Cajero / Administrador  
**Precondiciones**:

- Usuario autenticado
- Tasa USD→VES activa: 764.35

**Flujo**:

1. Usuario navega a "Productos" → "Nuevo Producto"
2. Completa el formulario:
   - Nombre: "Mouse Logitech M170"
   - Categoría: "Accesorios"
   - Costo: `12.50` USD
   - Moneda del Costo: `USD`
   - Costo Adicional: `0` (vacío)
   - Margen: `25%`
   - IVA: `0%`
   - Stock: `20`
3. **El sistema calcula automáticamente en tiempo real**:
   - Precio USD = $12.50 × 1.25 = `$15.63`
   - Precio VES = $15.63 × 764.35 = `VES 11,950.59`
4. Usuario ve los precios calculados en la card verde
5. Usuario hace clic en "Guardar Producto"
6. Sistema guarda en DB:
   ```json
   {
     "cost": 12.5,
     "costCurrency": "USD",
     "additionalCost": 0,
     "margin": 25,
     "iva": 0,
     "priceUSD": 15.63,
     "priceVES": 11950.59
   }
   ```

**Resultado esperado**: ✅ Producto creado con precios calculados correctamente

---

### Caso de Uso 2: Administrador actualiza la tasa VES de 764.35 a 800.00

**Actor**: Administrador / Owner  
**Precondiciones**:

- Usuario con rol OWNER o ADMIN
- Tienda tiene 45 productos activos
- Tasa actual: 764.35 VES/USD

**Flujo**:

1. Admin navega a "Ajustes" → "Tasas de Cambio"
2. Ve la tasa actual destacada: `764.35 VES`
3. Completa formulario de actualización:
   - Par de Monedas: `USD → VES`
   - Nueva Tasa: `800.00`
   - Fuente: `MANUAL`
4. Sistema muestra alerta:
   > "Al actualizar la tasa, se recalcularán automáticamente los precios
   > de venta de **todos los productos** de la tienda."
5. Admin confirma "Actualizar Tasa y Recalcular Precios"
6. **Sistema ejecuta en transacción**:
   - Desactiva tasa anterior (764.35)
   - Crea nueva tasa activa (800.00)
   - Recalcula precios de 45 productos:
     ```
     Para cada producto:
       nuevoPrecioVES = precioUSD × 800.00
     ```
7. Sistema muestra confirmación:
   > "Tasa actualizada exitosamente. 45 productos recalculados."

**Resultado esperado**:

- ✅ Nueva tasa activa: 800.00
- ✅ Tasa anterior marcada como inactiva
- ✅ 45 productos con precios VES actualizados
- ✅ Precios USD sin cambios (dependen del costo/margen, no de la tasa)

**Ejemplo de producto afectado**:

```
Antes:
  priceUSD: $15.63
  priceVES: VES 11,950.59 (calculado con 764.35)

Después:
  priceUSD: $15.63 (sin cambios)
  priceVES: VES 12,504.00 (recalculado con 800.00)
```

---

### Caso de Uso 3: Usuario edita margen de producto existente y los precios se recalculan

**Actor**: Administrador  
**Precondiciones**:

- Producto existente:
  ```json
  {
    "name": "Laptop HP",
    "cost": 300,
    "costCurrency": "USD",
    "additionalCost": 20,
    "margin": 25,
    "priceUSD": 400,
    "priceVES": 305880
  }
  ```
- Tasa actual: 764.70 VES/USD

**Flujo**:

1. Admin navega a "Productos" → clic en "Laptop HP" → "Editar"
2. Formulario carga datos actuales:
   - Costo: `$300`
   - Costo Adicional: `$20`
   - Margen: `25%`
3. Admin cambia margen de `25%` a `30%`
4. **Sistema recalcula automáticamente** (onChange):
   ```
   totalCost = $300 + $20 = $320
   nuevoPrecioUSD = $320 × 1.30 = $416.00
   nuevoPrecioVES = $416 × 764.70 = VES 318,115.20
   ```
5. Precios calculados se actualizan en pantalla en tiempo real
6. Admin hace clic en "Guardar Cambios"
7. Sistema actualiza en DB:
   ```json
   {
     "margin": 30,
     "priceUSD": 416.0,
     "priceVES": 318115.2
   }
   ```

**Resultado esperado**:

- ✅ Margen actualizado a 30%
- ✅ Precio USD aumentó de $400 → $416
- ✅ Precio VES actualizado proporcionalmente
- ✅ Cálculo en tiempo real visible antes de guardar

---

## 9. Impacto y Riesgos

### 9.1 Impacto Positivo

✅ **Consistencia visual**: tienda-web tendrá la misma identidad de marca que tienda-app  
✅ **Automatización**: Eliminación de errores manuales al calcular precios  
✅ **Eficiencia**: Actualización masiva de precios al cambiar tasa  
✅ **Transparencia**: Usuario ve cálculos en tiempo real  
✅ **Escalabilidad**: Lógica centralizada en el backend

### 9.2 Riesgos Identificados

⚠️ **Riesgo 1: Impacto en precios existentes**

- **Descripción**: Al implementar, productos existentes tienen precios manuales que no reflejan costo/margen
- **Mitigación**:
  1. Agregar script de migración que **estima** el margen basado en precios actuales
  2. Permitir edición manual del margen en productos migrados
  3. Mostrar alerta en productos sin margen definido

⚠️ **Riesgo 2: Recálculo masivo puede tardar**

- **Descripción**: Con 1000+ productos, actualizar tasa puede tardar varios segundos
- **Mitigación**:
  1. Implementar recálculo en background job (cola)
  2. Mostrar progress bar durante recálculo
  3. Enviar notificación cuando termine

⚠️ **Riesgo 3: Usuarios sin tasa configurada**

- **Descripción**: Tiendas nuevas sin tasa no podrán crear productos
- **Mitigación**:
  1. Al crear tienda, insertar tasa default (ej: 764.35)
  2. Mostrar wizard de configuración inicial
  3. Permitir crear productos sin tasa (usar precio USD = VES temporalmente)

⚠️ **Riesgo 4: Cambios frecuentes de tasa afectan inventario**

- **Descripción**: En Venezuela la tasa cambia diariamente
- **Mitigación**:
  1. Permitir configurar si recalcular automáticamente o no
  2. Opción de "congelar" precios de productos específicos
  3. Historial de precios para auditoría

---

## 10. Roadmap de Implementación

### Fase 1: Backend (1 día)

- [ ] Crear tabla `exchange_rates`
- [ ] Modificar tabla `products` (agregar campos)
- [ ] Implementar `utils/priceCalculator.ts`
- [ ] Endpoint GET /api/exchange-rates
- [ ] Endpoint POST /api/exchange-rates
- [ ] Modificar POST /api/products con cálculos

### Fase 2: Frontend Core (1.5 días)

- [ ] Actualizar paleta de colores en Tailwind config
- [ ] Componente `TasaActivaCard`
- [ ] Componente `ProductFormWithCalculations`
- [ ] Hook `useExchangeRates`
- [ ] Integrar cálculos en tiempo real

### Fase 3: Gestión de Tasas (1 día)

- [ ] Página `/dashboard/exchange-rates`
- [ ] Componente `ExchangeRateManager`
- [ ] Componente `RateHistoryTable`
- [ ] Validaciones de permisos (solo OWNER/ADMIN)

### Fase 4: Branding y UX (0.5 días)

- [ ] Cambiar "PANEL DE CONTROL" → "T-Suma"
- [ ] Actualizar iconos a Lucide React
- [ ] Ajustar espaciados y bordes redondeados
- [ ] Cards de resumen operativo en dashboard

### Fase 5: Testing y Validación (1 día)

- [ ] Tests unitarios de `priceCalculator`
- [ ] Tests de integración de endpoints
- [ ] Pruebas E2E de flujo completo
- [ ] Validar criterios de aceptación

**Tiempo Total Estimado**: 5 días (1 semana de trabajo)

---

## Anexos

### A. Script de Migración de Datos

```sql
-- Migración: Estimar margen de productos existentes
-- EJECUTAR ANTES DE IMPLEMENTAR EL FEATURE

-- 1. Agregar campos nuevos
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS margin DECIMAL(5, 2) DEFAULT 30.00,
  ADD COLUMN IF NOT EXISTS cost_currency VARCHAR(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS additional_cost DECIMAL(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS iva DECIMAL(5, 2) DEFAULT 0.00;

-- 2. Para productos con cost existente, estimar margen
-- Fórmula inversa: margin = ((price / cost) - 1) × 100
UPDATE products
SET margin = CASE
  WHEN cost > 0 AND price_usd > cost THEN
    ROUND(((price_usd / cost) - 1) * 100, 2)
  ELSE
    30.00  -- Default si no se puede calcular
END
WHERE margin IS NULL OR margin = 0;

-- 3. Establecer cost_currency basado en precios
UPDATE products
SET cost_currency = CASE
  WHEN price_ves > price_usd * 100 THEN 'VES'  -- Si VES es muy alto, probablemente el costo era en VES
  ELSE 'USD'
END;

-- 4. Crear tasa default para tiendas sin tasa
INSERT INTO exchange_rates (store_id, from_currency, to_currency, rate, source, is_active)
SELECT DISTINCT
  s.id,
  'USD',
  'VES',
  764.35,
  'MIGRATION_DEFAULT',
  true
FROM stores s
LEFT JOIN exchange_rates er ON er.store_id = s.id AND er.is_active = true
WHERE er.id IS NULL;
```

### B. Configuración de Tailwind para Colores T-Suma

```javascript
// tailwind.config.ts
module.exports = {
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

---

**FIN DE LA ESPECIFICACIÓN**

Esta especificación cubre todos los aspectos necesarios para alinear tienda-web con tienda-app.
El próximo paso es pasarla al **planificador** para crear el plan de implementación detallado.
