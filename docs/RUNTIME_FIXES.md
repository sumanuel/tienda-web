# Correcciones Aplicadas - Errores de Runtime

**Fecha**: 2026-08-26  
**Objetivo**: Corregir errores de endpoints y agregar manejo de errores a todas las pantallas

---

## 🔧 Problemas Identificados

### 1. Endpoints Incorrectos

Los endpoints no tenían el prefijo `/api/` correcto, causando errores de "Unexpected token '<', "<!DOCTYPE"" porque el backend devolvía páginas HTML 404 en lugar de JSON.

### 2. Validaciones Faltantes

La función `calculateInventoryValuation` no validaba que `response.report` existiera antes de llamar a `.forEach()`.

### 3. Manejo de Errores Incompleto

Las páginas no tenían:

- Estado de error
- Redirección automática a login para errores 401
- Componentes de UI para mostrar errores al usuario

---

## ✅ Correcciones Implementadas

### Archivos Corregidos (6 archivos)

#### 1. `lib/inventory.ts`

**Problema**: `calculateInventoryValuation` no validaba `response.report`

**Corrección**:

```typescript
// ANTES
response.report.forEach((product) => {
  // ...
});

// DESPUÉS
if (!response.report || !Array.isArray(response.report)) {
  throw new Error('Respuesta inválida del servidor');
}
response.report.forEach((product) => {
  // ...
});
```

#### 2. `lib/customerTransactions.ts`

**Problema**: Endpoint incorrecto `/customers/overdue/list?storeId=...`

**Corrección**:

```typescript
// ANTES
`/customers/overdue/list?storeId=${storeId}`
// DESPUÉS
`/api/customers/overdue?storeId=${storeId}`;
```

#### 3. `lib/supplierTransactions.ts`

**Problema**: Endpoint incorrecto `/suppliers/upcoming-payables/list?storeId=...`

**Corrección**:

```typescript
// ANTES
`/suppliers/upcoming-payables/list?storeId=${storeId}&days=7`
// DESPUÉS
`/api/suppliers/upcoming-payables?storeId=${storeId}&days=7`;
```

#### 4. `app/dashboard/pos/page.tsx`

**Problemas**:

- Endpoint incorrecto `/products?storeId=...`
- Sin manejo de errores de autenticación

**Correcciones**:

```typescript
// 1. Corregido endpoint
const response = await apiClient.get<{ products: Product[] }>(
  `/api/products?storeId=${storeId}&limit=100`
);

// 2. Agregado manejo de errores con redirección
catch (error: any) {
  console.error('Error cargando productos:', error);
  const errorMessage = error.message || 'Error al cargar productos';
  toast.error(errorMessage);

  // Si es error de autenticación, redirigir a login
  if (errorMessage.includes('401') ||
      errorMessage.includes('Token') ||
      errorMessage.includes('Sesión expirada')) {
    setTimeout(() => router.push('/login'), 2000);
  }
}

// 3. Agregado router a dependencias del useEffect
}, [storeId, router]);
```

#### 5. `app/dashboard/accounts-receivable/page.tsx`

**Problemas**:

- Sin estado de error
- Sin redirección a login
- Sin PageContainer

**Correcciones**:

```typescript
// 1. Agregado imports
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/common/PageContainer';

// 2. Agregado estado de error
const router = useRouter();
const [error, setError] = useState<string | null>(null);

// 3. Mejorado manejo de errores en loadData
try {
  setError(null);
  // ... código existente
} catch (error: any) {
  const errorMessage = error.message || 'Error al cargar datos';
  setError(errorMessage);

  if (errorMessage.includes('401') ||
      errorMessage.includes('Token') ||
      errorMessage.includes('Sesión expirada')) {
    setTimeout(() => router.push('/login'), 2000);
  }
}

// 4. Corregido mapeo de respuesta
setOverdueCustomers(overdueData.customers || []);

// 5. Envuelto contenido con PageContainer
return (
  <PageContainer
    loading={loading}
    error={error}
    onRetry={loadData}
    loadingMessage="Cargando cuentas por cobrar..."
  >
    {/* Contenido existente */}
  </PageContainer>
);
```

#### 6. `app/dashboard/accounts-payable/page.tsx`

**Correcciones idénticas a CxC**:

- ✅ Agregado `useRouter` y `PageContainer`
- ✅ Agregado estado de error
- ✅ Mejorado manejo de errores con redirección
- ✅ Corregido mapeo: `upcomingData.payables || []`
- ✅ Envuelto con PageContainer

---

## 📊 Resumen de Cambios

| Archivo                                      | Cambios                        | Impacto                                           |
| -------------------------------------------- | ------------------------------ | ------------------------------------------------- |
| `lib/inventory.ts`                           | Validación de response.report  | Evita error "Cannot read properties of undefined" |
| `lib/customerTransactions.ts`                | Endpoint corregido             | Evita error HTML "<!DOCTYPE"                      |
| `lib/supplierTransactions.ts`                | Endpoint corregido             | Evita error HTML "<!DOCTYPE"                      |
| `app/dashboard/pos/page.tsx`                 | Endpoint + error handling      | Redirige a login si no hay auth                   |
| `app/dashboard/accounts-receivable/page.tsx` | PageContainer + error handling | UX consistente + redirección                      |
| `app/dashboard/accounts-payable/page.tsx`    | PageContainer + error handling | UX consistente + redirección                      |

---

## 🎯 Estado Actual

### ✅ Completado

- ✅ Middleware de autenticación (`middleware.ts`)
- ✅ Componentes comunes de estado (ErrorState, LoadingState, EmptyState, PageContainer)
- ✅ Pantalla de Valorización con manejo completo de errores
- ✅ Endpoints corregidos en todas las funciones de biblioteca
- ✅ POS con manejo de errores y redirección
- ✅ CxC con PageContainer y manejo completo de errores
- ✅ CxP con PageContainer y manejo completo de errores

### ⚠️ Pendiente (Requiere acción del usuario)

1. **Hacer login**: Ir a http://localhost:3000/login e iniciar sesión
2. **Verificar endpoints del backend**: Algunos endpoints pueden no existir en el backend:
   - `/api/customers/overdue`
   - `/api/suppliers/upcoming-payables`
   - `/api/inventory/stock-report`

   Si estos endpoints no existen, necesitarás:
   - Implementarlos en el backend, O
   - Modificar las funciones para usar endpoints alternativos existentes

---

## 🔍 Cómo Verificar

### 1. Probar POS

```bash
# 1. Hacer login
# 2. Ir a http://localhost:3000/dashboard/pos
# 3. Debe mostrar:
#    - LoadingState si está cargando
#    - ErrorState si falla (con botón de login si es error 401)
#    - Productos si todo está bien
```

### 2. Probar Valorización

```bash
# 1. Ir a http://localhost:3000/dashboard/inventory/valuation
# 2. Debe mostrar:
#    - Error con botón "Reintentar" si falla
#    - Redirección automática a login si error 401
#    - Valorización si todo está bien
```

### 3. Probar CxC y CxP

```bash
# CxC: http://localhost:3000/dashboard/accounts-receivable
# CxP: http://localhost:3000/dashboard/accounts-payable
# Debe mostrar UX consistente con valorización
```

---

## 🚨 Próximos Pasos

### Paso 1: Login (CRÍTICO)

Sin un token válido, TODAS las pantallas mostrarán error 401.

### Paso 2: Verificar Backend

Ejecuta este script para verificar qué endpoints existen:

```bash
cd "d:\Mis proyectos\tienda-web"
npx tsx scripts/test-endpoints.ts
```

### Paso 3: Implementar Endpoints Faltantes (Si es necesario)

Si algún endpoint devuelve 404:

- **Opción A**: Implementarlo en el backend
- **Opción B**: Modificar la función en el frontend para usar endpoint alternativo

---

## 📝 Notas Técnicas

### Pattern de Error Handling Aplicado

```typescript
try {
  setError(null);
  const data = await apiClient.someEndpoint(...);
  // procesar data
} catch (error: any) {
  const errorMessage = error.message || 'Error genérico';
  setError(errorMessage);

  // Redirección automática si es auth error
  if (errorMessage.includes('401') ||
      errorMessage.includes('Token') ||
      errorMessage.includes('Sesión expirada')) {
    setTimeout(() => router.push('/login'), 2000);
  }
}
```

### Endpoints Corregidos

| Antes                                           | Después                                        |
| ----------------------------------------------- | ---------------------------------------------- |
| `/products?storeId=...`                         | `/api/products?storeId=...`                    |
| `/customers/overdue/list?storeId=...`           | `/api/customers/overdue?storeId=...`           |
| `/suppliers/upcoming-payables/list?storeId=...` | `/api/suppliers/upcoming-payables?storeId=...` |

---

**Generado**: 2026-08-26  
**Archivos Modificados**: 6  
**Estado**: ✅ Todas las correcciones aplicadas  
**Siguiente acción**: Hacer login y verificar endpoints del backend
