# Reporte QA - FEATURE-001 Fase 3: Inventario y Movimientos

**Feature ID**: FEATURE-001-FASE-3  
**Fecha**: 2026-07-31  
**QA Reviewer**: Sistema QA Automatizado  
**Estado**: ⚠️ APROBADO CON CORRECCIONES OBLIGATORIAS

---

## 📊 Resumen Ejecutivo

| Métrica                    | Estado       | Detalle                                        |
| -------------------------- | ------------ | ---------------------------------------------- |
| **Compilación TypeScript** | ✅ PASS      | 0 errores, strict mode                         |
| **Build Next.js**          | ✅ PASS      | 13 rutas generadas (3 nuevas de inventario)    |
| **Cobertura de Tests**     | ❌ FAIL      | No hay tests automatizados                     |
| **Transacciones Atómicas** | ⚠️ CRÍTICO   | Race condition detectada                       |
| **Validaciones Backend**   | ⚠️ PARCIAL   | Validaciones básicas, falta stock en frontend  |
| **Manejo de Errores**      | ⚠️ PARCIAL   | checkStockAlert falla silenciosamente          |
| **Seguridad**              | ⚠️ PARCIAL   | Falta validación de permisos en servicios      |
| **Performance**            | ⚠️ PENDIENTE | Índices Firestore no creados, queries sin test |

**Score Total**: **72.5/100**

---

## ✅ Criterios de Aceptación Validados

### 1. Registro de Movimientos de Inventario

**✅ Implementado**:

- ✅ Tipos de movimiento: entrada, salida, ajuste, venta
- ✅ Validación de stock negativo en backend
- ✅ Transacciones atómicas con `runTransaction`
- ✅ Captura de stockBefore y stockAfter para auditoría
- ✅ Registro de usuario y timestamp
- ⚠️ Integración con ventas (asumido, no verificado en esta fase)

**Código Revisado**:

- `lib/inventory.ts` líneas 40-120:
  - ✅ Usa `runTransaction` correctamente
  - ✅ Valida stock negativo antes de guardar
  - ❌ **CRÍTICO**: Lee producto ANTES de transacción (race condition)
  - ⚠️ **ALTO**: Query post-transacción puede fallar
  - ⚠️ **MEDIO**: `checkStockAlert` falla silenciosamente

**Edge Cases Detectados**:

- ❌ **CRÍTICO**: Dos movimientos simultáneos pueden usar mismo stock inicial
- ❌ **ALTO**: Si producto se elimina durante transacción, crashea
- ⚠️ **MEDIO**: No valida que quantity sea entero positivo
- ⚠️ **MEDIO**: Campo `reference` no se usa en movimientos manuales
- ⚠️ **BAJO**: No valida rango de unitCost (podría ser negativo)

---

### 2. Historial de Movimientos

**✅ Implementado**:

- ✅ Tabla con @tanstack/react-table
- ✅ Búsqueda global client-side
- ✅ Paginación de 20 items
- ✅ Badges de color por tipo de movimiento
- ✅ Ordenamiento por fecha descendente

**Código Revisado**:

- `components/inventory/MovementsTable.tsx`:
  - ✅ Implementación correcta de TanStack Table
  - ✅ Estados de loading implícitos
  - ⚠️ **MEDIO**: No permite filtrar por rango de fechas
  - ⚠️ **BAJO**: No permite ordenar por otras columnas

- `lib/inventory.ts::getInventoryMovements()` líneas 125-158:
  - ✅ Query optimizado con índice compuesto
  - ⚠️ **MEDIO**: Carga TODOS los movimientos sin límite
  - ⚠️ **BAJO**: No tiene paginación server-side

**Edge Cases Detectados**:

- ⚠️ **ALTO**: Con +10,000 movimientos, carga lenta y posible crash
- ⚠️ **MEDIO**: No permite exportar historial completo
- ⚠️ **BAJO**: Búsqueda global no busca por fecha

---

### 3. Kardex de Productos

**✅ Implementado**:

- ✅ Generación cronológica de kardex
- ✅ Columnas: entrada/salida/saldo
- ✅ Exportación a CSV
- ✅ Selector de producto con stock actual

**Código Revisado**:

- `lib/inventory.ts::generateKardex()` líneas 163-190:
  - ✅ Lógica de entrada/salida correcta
  - ❌ **ALTO**: Hace `.reverse()` dos veces innecesariamente
  - ❌ **ALTO**: `movements.reverse()` muta el array original
  - ⚠️ **MEDIO**: Referencia usa solo 8 chars de ID (puede duplicar)
  - ⚠️ **BAJO**: No valida que productId exista

**Edge Cases Detectados**:

- ❌ **ALTO**: Doble reverse puede invertir orden incorrecto
- ⚠️ **MEDIO**: Producto sin movimientos devuelve array vacío (OK pero sin mensaje)
- ⚠️ **BAJO**: Balance no se recalcula, confía en stockAfter guardado

---

### 4. Alertas de Stock Bajo

**✅ Implementado**:

- ✅ Creación automática cuando stock <= stockMin
- ✅ Actualización de stock en alerta existente
- ✅ Resolución automática cuando stock sube
- ✅ Widget en dashboard con primeras 5 alertas

**Código Revisado**:

- `lib/inventory.ts::checkStockAlert()` líneas 195-265:
  - ✅ Lógica de creación/actualización correcta
  - ❌ **CRÍTICO**: Función NO lanza errores, falla silenciosamente
  - ⚠️ **MEDIO**: Condición `<=` debería ser `<` (cuando stock == stockMin no es alerta)
  - ⚠️ **MEDIO**: Resuelve TODAS las alertas activas (podría haber varias)
  - ⚠️ **BAJO**: No loggea cuando crea/resuelve alertas

**Edge Cases Detectados**:

- ❌ **CRÍTICO**: Si `checkStockAlert` falla, movimiento se guarda pero sin alerta
- ⚠️ **MEDIO**: Alerta con stock == stockMin debería ser warning, no critical
- ⚠️ **MEDIO**: No notifica al usuario cuando se crea alerta nueva
- ⚠️ **BAJO**: Alertas resueltas no se archivan, solo cambian status

---

### 5. Valorización de Inventario

**✅ Implementado**:

- ✅ Cálculo de valor total (stock * cost)
- ✅ Desglose por categoría
- ✅ KPIs visuales con iconos
- ✅ Solo productos con trackInventory=true

**Código Revisado**:

- `lib/inventory.ts::calculateInventoryValuation()` líneas 270-310:
  - ✅ Query correcta con where trackInventory
  - ✅ Cálculo matemático correcto
  - ❌ **ALTO**: No valida que `product.category` exista
  - ⚠️ **MEDIO**: No filtra productos con stock = 0
  - ⚠️ **BAJO**: No cachea resultados (query pesado)

**Edge Cases Detectados**:

- ❌ **ALTO**: Si producto no tiene categoría, `byCategory[undefined]` crashea
- ⚠️ **MEDIO**: Con +10,000 productos, cálculo lento
- ⚠️ **BAJO**: No permite valorización por rango de fechas

---

## 🐛 Bugs Encontrados

### 🔴 CRÍTICOS (Bloquean funcionalidad principal)

**BUG-101: Race Condition en Transacciones de Inventario**

- **Severidad**: CRÍTICA
- **Ubicación**: `lib/inventory.ts` líneas 42-45
- **Descripción**: `registerInventoryMovement` lee el producto ANTES de la transacción y usa ese valor dentro de ella. Si dos usuarios registran movimientos simultáneos del mismo producto, ambos leerán el mismo stock inicial y el segundo sobrescribirá el primero.
- **Pasos a reproducir**:
  1. Producto tiene stock = 10
  2. Usuario A registra entrada de +5 (lee stock=10)
  3. Usuario B registra salida de -3 (lee stock=10 simultáneamente)
  4. Transacción A guarda stock = 15
  5. Transacción B guarda stock = 7 (debería ser 12)
  6. Stock final incorrecto: 7 en vez de 12
- **Impacto**: Pérdida de exactitud en inventario, inconsistencias críticas
- **Fix URGENTE**:

```typescript
export async function registerInventoryMovement(
  storeId: string,
  userId: string,
  userName: string,
  data: InventoryMovementFormData
): Promise<InventoryMovement> {
  try {
    let movementId: string = '';
    let createdMovement: any = null;

    // Usar transacción para TODO, incluyendo lectura inicial
    await runTransaction(db, async (transaction) => {
      const productRef = doc(db, 'products', data.productId);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists()) {
        throw new Error('Producto no encontrado');
      }

      const product = { id: productDoc.id, ...productDoc.data() } as Product;

      // Calcular nueva cantidad
      const quantityChange =
        data.type === 'entry' ? data.quantity : -data.quantity;
      const newStock = product.stock + quantityChange;

      if (newStock < 0) {
        throw new Error('Stock insuficiente para la salida');
      }

      // Actualizar stock del producto
      transaction.update(productRef, {
        stock: newStock,
        updatedAt: Timestamp.now(),
      });

      // Crear movimiento
      const movementData = {
        storeId,
        productId: data.productId,
        productName: product.name,
        productCode: product.code,
        type: data.type,
        quantity: quantityChange,
        stockBefore: product.stock,
        stockAfter: newStock,
        unitCost: data.unitCost || product.cost,
        totalCost: (data.unitCost || product.cost) * Math.abs(quantityChange),
        supplierId: data.supplierId,
        reason: data.reason,
        notes: data.notes,
        userId,
        userName,
        createdAt: Timestamp.now(),
      };

      const movementRef = doc(collection(db, MOVEMENTS_COLLECTION));
      transaction.set(movementRef, movementData);
      movementId = movementRef.id;

      createdMovement = {
        id: movementId,
        ...movementData,
        createdAt: new Date(),
      };

      // Verificar alerta de stock DENTRO de la transacción
      await checkStockAlertInTransaction(
        transaction,
        storeId,
        product.id,
        product.name,
        product.code,
        newStock,
        product.stockMin
      );
    });

    return createdMovement as InventoryMovement;
  } catch (error: any) {
    console.error('Error registrando movimiento:', error);
    throw new Error(error.message || 'Error al registrar movimiento');
  }
}

// Nueva función para alertas dentro de transacción
async function checkStockAlertInTransaction(
  transaction: any,
  storeId: string,
  productId: string,
  productName: string,
  productCode: string,
  currentStock: number,
  minStock: number
): Promise<void> {
  // Implementar lógica de alertas dentro de la transacción
  // o dejarla fuera pero con manejo de errores apropiado
}
```

**BUG-102: checkStockAlert Falla Silenciosamente**

- **Severidad**: CRÍTICA
- **Ubicación**: `lib/inventory.ts` línea 262
- **Descripción**: La función `checkStockAlert` tiene try-catch que solo loggea errores pero no los propaga. Si falla, el movimiento ya está guardado pero la alerta no se crea, generando inconsistencia.
- **Pasos a reproducir**:
  1. Registrar movimiento que lleva stock bajo mínimo
  2. Firestore rules bloquean escritura en `stock_alerts` (error de permisos)
  3. Función solo loggea error pero no notifica
  4. Movimiento guardado, alerta no creada
- **Impacto**: Alertas faltantes, usuario no se entera de stock bajo
- **Fix URGENTE**:

```typescript
async function checkStockAlert(
  storeId: string,
  productId: string,
  productName: string,
  productCode: string,
  currentStock: number,
  minStock: number
): Promise<void> {
  try {
    if (currentStock < minStock) {
      // ✅ Cambiar <= a < para consistencia
      // ... resto de lógica
    }
  } catch (error) {
    console.error('Error verificando alerta de stock:', error);
    // ✅ LANZAR error en vez de tragarlo
    throw new Error('Error al crear alerta de stock: ' + error.message);
  }
}

// Y en registerInventoryMovement, manejar el error:
try {
  await checkStockAlert(
    storeId,
    product.id,
    product.name,
    product.code,
    newStock,
    product.stockMin
  );
} catch (alertError) {
  // Loggear pero no bloquear la operación principal
  console.error('⚠️ Movimiento guardado pero alerta falló:', alertError);
  // Opcional: Crear tarea pendiente para crear alerta después
}
```

---

### 🟡 ALTOS (Afectan funcionalidad pero tienen workaround)

**BUG-103: generateKardex Hace Double Reverse Innecesario**

- **Severidad**: ALTA
- **Ubicación**: `lib/inventory.ts` líneas 168-189
- **Descripción**: `movements.reverse()` muta el array original (línea 168), luego `kardex.reverse()` (línea 189). Esto puede causar orden incorrecto si el array `movements` es reutilizado.
- **Impacto**: Orden de kardex incorrecto en casos edge, confusión
- **Fix**:

```typescript
export async function generateKardex(
  storeId: string,
  productId: string
): Promise<KardexEntry[]> {
  try {
    const movements = await getInventoryMovements(storeId, productId);

    const kardex: KardexEntry[] = [];

    // ✅ No mutar el array original, usar slice().reverse()
    const movementsChronological = movements.slice().reverse();

    movementsChronological.forEach((movement) => {
      const entry: KardexEntry = {
        date: movement.createdAt,
        reference:
          movement.reference ||
          `MOV-${movement.id.substring(0, 8).toUpperCase()}`,
        type: movement.type,
        quantityIn: movement.quantity > 0 ? movement.quantity : 0,
        quantityOut: movement.quantity < 0 ? Math.abs(movement.quantity) : 0,
        balance: movement.stockAfter,
        unitCost: movement.unitCost,
        totalCost: movement.totalCost,
      };

      kardex.push(entry);
    });

    // ✅ Ya está en orden cronológico, no necesita reverse
    return kardex;
  } catch (error) {
    console.error('Error generando kardex:', error);
    throw error;
  }
}
```

**BUG-104: calculateInventoryValuation No Valida Categoría**

- **Severidad**: ALTA
- **Ubicación**: `lib/inventory.ts` líneas 295-297
- **Descripción**: Si `product.category` es `undefined` o `null`, `byCategory[undefined]` crashea o crea clave inválida.
- **Impacto**: Crash en página de valorización si hay productos sin categoría
- **Fix**:

```typescript
products.docs.forEach((doc) => {
  const product = doc.data();
  const value = product.stock * product.cost;

  totalValue += value;
  totalItems += product.stock;

  // ✅ Validar categoría antes de usar como key
  const category = product.category || 'Sin Categoría';

  if (!byCategory[category]) {
    byCategory[category] = 0;
  }
  byCategory[category] += value;
});
```

**BUG-105: MovementForm No Valida Stock Disponible en Frontend**

- **Severidad**: ALTA
- **Ubicación**: `components/inventory/MovementForm.tsx`
- **Descripción**: Para movimientos de salida, no valida que quantity <= stock actual hasta que se envía al backend. Mala UX.
- **Impacto**: Usuario ingresa salida de 100 cuando hay 5, recibe error después de submit
- **Fix**:

```typescript
const movementSchema = z
  .object({
    productId: z.string().min(1, 'Producto es requerido'),
    type: z.enum(['entry', 'exit', 'adjustment']),
    quantity: z.number().min(1, 'Cantidad debe ser mayor a 0'),
    unitCost: z.number().min(0).optional(),
    reason: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // ✅ Validar stock solo para salidas
      if (data.type === 'exit') {
        const product = products.find((p) => p.id === data.productId);
        if (product && data.quantity > product.stock) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Cantidad excede stock disponible',
      path: ['quantity'],
    }
  );
```

---

### 🟠 MEDIOS (Mejoras importantes)

**BUG-106: getInventoryMovements Carga TODOS los Movimientos Sin Límite**

- **Severidad**: MEDIA
- **Ubicación**: `lib/inventory.ts` líneas 125-158
- **Descripción**: Query sin `limit()`. Con +10,000 movimientos, carga lenta y posible crash.
- **Fix**:

```typescript
export async function getInventoryMovements(
  storeId: string,
  productId?: string,
  limit: number = 100 // ✅ Agregar límite por defecto
): Promise<InventoryMovement[]> {
  // ... código existente
  q = query(
    collection(db, MOVEMENTS_COLLECTION),
    where('storeId', '==', storeId),
    orderBy('createdAt', 'desc'),
    limit(limit) // ✅ Agregar límite
  );
  // ...
}
```

**BUG-107: Alertas No Distinguen Entre Warning y Critical**

- **Severidad**: MEDIA
- **Ubicación**: `lib/inventory.ts::checkStockAlert()` línea 207
- **Descripción**: Condición `currentStock <= minStock` trata stock == stockMin como crítico. Debería ser warning.
- **Fix**:

```typescript
// ✅ Agregar niveles de severidad
if (currentStock === 0) {
  severity = 'critical';
} else if (currentStock < minStock) {
  severity = 'high';
} else if (currentStock === minStock) {
  severity = 'warning';
}
```

**BUG-108: No Permite Paginación Server-Side en Movimientos**

- **Severidad**: MEDIA
- **Descripción**: MovementsTable carga todos y pagina client-side. Ineficiente con +1000 movimientos.
- **Fix**: Implementar paginación server-side con `startAfter()` y `limit()`.

---

### 🔵 BAJOS (Mejoras opcionales)

**BUG-109: Kardex Usa Solo 8 Chars de ID Como Referencia**

- **Severidad**: BAJA
- **Ubicación**: `lib/inventory.ts` línea 176
- **Descripción**: `movement.id.substring(0, 8)` puede duplicar referencias en DBs grandes.
- **Fix**: Usar UUID corto o secuencial dedicado.

**BUG-110: No Loggea Creación/Resolución de Alertas**

- **Severidad**: BAJA
- **Descripción**: Función `checkStockAlert` no loggea cuando crea o resuelve alertas. Dificulta auditoría.
- **Fix**: Agregar `console.log` o sistema de logging estructurado.

**BUG-111: CSV Export No Incluye Metadata**

- **Severidad**: BAJA
- **Ubicación**: `app/dashboard/inventory/kardex/page.tsx` línea 62
- **Descripción**: CSV exportado no incluye header con nombre de producto, fecha de exportación, tienda.
- **Fix**: Agregar metadata en primeras líneas del CSV.

---

## 📊 Análisis por Categoría

### 1. Lógica de Negocio: 18/30

**Fortalezas**:

- ✅ Uso correcto de `runTransaction` para atomicidad
- ✅ Validación de stock negativo
- ✅ Cálculos de kardex matemáticamente correctos
- ✅ Sistema de alertas funcional básico

**Debilidades Críticas**:

- ❌ Race condition en lectura de producto (BUG-101) -5pts
- ❌ checkStockAlert falla silenciosamente (BUG-102) -4pts
- ❌ Double reverse innecesario en kardex (BUG-103) -2pts
- ⚠️ Condición de alerta <= debería ser < (BUG-107) -1pt

**Recomendaciones**:

1. Mover lectura de producto DENTRO de transacción
2. Lanzar errores en checkStockAlert en vez de tragárlos
3. Eliminar reverse() innecesario en generateKardex
4. Agregar niveles de severidad a alertas (warning/critical)

---

### 2. Seguridad: 17/25

**Fortalezas**:

- ✅ Validación de stock negativo
- ✅ Requiere storeId en todos los servicios
- ✅ Captura userId/userName para auditoría

**Debilidades**:

- ❌ No valida permisos de usuario en servicios -4pts
- ❌ No valida que storeId del usuario == storeId del producto -3pts
- ⚠️ Firestore rules no documentadas/implementadas -1pt

**Firestore Rules Requeridas** (CRÍTICO - debe implementarse):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Inventory Movements
    match /inventory_movements/{movementId} {
      allow read: if request.auth != null &&
        resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId;
      allow create: if request.auth != null &&
        request.resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId &&
        request.resource.data.userId == request.auth.uid;
      allow update, delete: if false; // Movimientos son inmutables
    }

    // Stock Alerts
    match /stock_alerts/{alertId} {
      allow read: if request.auth != null &&
        resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId;
      allow create, update: if request.auth != null &&
        request.resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId;
      allow delete: if false; // Alertas no se eliminan, solo se resuelven
    }
  }
}
```

**Índices Firestore Requeridos** (CRÍTICO - debe crearse en consola):

```javascript
// inventory_movements
{
  collectionGroup: "inventory_movements",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "storeId", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}

{
  collectionGroup: "inventory_movements",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "storeId", order: "ASCENDING" },
    { fieldPath: "productId", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}

// stock_alerts
{
  collectionGroup: "stock_alerts",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "storeId", order: "ASCENDING" },
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}
```

---

### 3. Performance: 14/20

**Fortalezas**:

- ✅ Queries con índices compuestos documentados
- ✅ Ordenamiento en Firestore (no client-side)

**Debilidades**:

- ❌ No usa `limit()` en queries -3pts
- ❌ Carga TODOS los movimientos sin paginación -2pts
- ⚠️ calculateInventoryValuation sin caché -1pt

**Recomendaciones**:

1. Agregar `limit(100)` por defecto en getInventoryMovements
2. Implementar paginación server-side con cursors
3. Cachear valorización de inventario (actualizar solo en movimientos)
4. Considerar Cloud Functions para cálculos pesados

**Estimación de Performance**:

| Operación                   | Productos | Movimientos | Tiempo Estimado |
| --------------------------- | --------- | ----------- | --------------- |
| Registrar movimiento        | N/A       | N/A         | ~500ms          |
| Cargar historial sin límite | N/A       | 10,000      | ~5-10s          |
| Generar kardex              | 1         | 1,000       | ~2-3s           |
| Calcular valorización       | 10,000    | N/A         | ~3-5s           |
| Dashboard con alertas       | N/A       | N/A         | ~1-2s           |

---

### 4. UI/UX: 12/15

**Fortalezas**:

- ✅ Estados de loading presentes
- ✅ Toast notifications para feedback
- ✅ Mensajes de error claros (backend)
- ✅ Componentes responsive básicos

**Debilidades**:

- ⚠️ No valida stock en frontend (BUG-105) -2pts
- ⚠️ No muestra progress bar en operaciones largas -1pt

**Mejoras UX Recomendadas**:

1. Agregar validación de stock en tiempo real en MovementForm
2. Mostrar preview de stock nuevo antes de submit
3. Confirmar movimientos grandes (>100 unidades)
4. Progress bar para exportación de kardex grande
5. Notificaciones push cuando se crean alertas

---

### 5. Calidad de Código: 11/10 (Bonus)

**Fortalezas**:

- ✅ TypeScript strict mode sin errores +5pts
- ✅ Código DRY, funciones bien separadas +3pts
- ✅ Naming conventions consistentes +2pts
- ✅ Comentarios JSDoc en funciones clave +1pt

**Puntos de Mejora**:

- ⚠️ Falta documentación de edge cases
- ⚠️ Algunos magic numbers (ej: .substring(0, 8))
- ✅ Tests unitarios ausentes (no resta puntos, no solicitado)

---

## 🎯 Recomendaciones Prioritarias

### Prioridad 1 - CRÍTICAS (Implementar ANTES de producción)

1. **[BUG-101]** Corregir race condition moviendo lectura de producto DENTRO de transacción
2. **[BUG-102]** Hacer que checkStockAlert lance errores en vez de fallar silenciosamente
3. **[SECURITY]** Implementar Firestore rules para inventory_movements y stock_alerts
4. **[PERFORMANCE]** Crear índices compuestos en Firebase Console

### Prioridad 2 - ALTAS (Implementar en próximo sprint)

5. **[BUG-103]** Eliminar double reverse en generateKardex
6. **[BUG-104]** Validar categoría en calculateInventoryValuation
7. **[BUG-105]** Agregar validación de stock en MovementForm frontend
8. **[BUG-106]** Implementar límites en queries de movimientos

### Prioridad 3 - MEDIAS (Backlog)

9. **[BUG-107]** Agregar niveles de severidad a alertas
10. **[BUG-108]** Implementar paginación server-side
11. **[PERFORMANCE]** Agregar caché a valorización de inventario
12. **[UX]** Notificaciones cuando se crean alertas

### Prioridad 4 - BAJAS (Nice to have)

13. **[BUG-109]** Mejorar sistema de referencias en kardex
14. **[BUG-110]** Agregar logging estructurado
15. **[BUG-111]** Mejorar formato de CSV export
16. **[TESTS]** Agregar tests unitarios para servicios críticos

---

## 📝 Tests Críticos Pendientes (Recomendado)

```typescript
// __tests__/unit/lib/inventory.test.ts

describe('registerInventoryMovement', () => {
  test('debe prevenir race conditions con transacciones', async () => {
    // Simular 2 movimientos simultáneos
    // Verificar que stock final sea correcto
  });

  test('debe lanzar error si stock queda negativo', async () => {
    // Intentar salida mayor a stock
    // Verificar que lanza error
  });

  test('debe crear alerta si stock cae bajo mínimo', async () => {
    // Registrar salida que lleva stock < stockMin
    // Verificar que alerta se crea
  });
});

describe('generateKardex', () => {
  test('debe mantener orden cronológico correcto', async () => {
    // Crear movimientos en orden aleatorio
    // Verificar que kardex está ordenado por fecha
  });

  test('debe calcular balance correctamente', async () => {
    // Serie de entradas/salidas
    // Verificar que balance final == stock actual
  });
});

describe('checkStockAlert', () => {
  test('debe crear alerta solo si stock < stockMin', async () => {
    // No cuando stock == stockMin
  });

  test('debe resolver alertas cuando stock sube', async () => {
    // Alerta activa + entrada que sube stock
    // Verificar que status = 'resolved'
  });
});
```

---

## 🚀 Plan de Corrección Sugerido

### Sprint 1 (2-3 días) - Bugs Críticos

**Día 1-2**:

- [ ] Corregir BUG-101 (race condition)
- [ ] Corregir BUG-102 (checkStockAlert silencioso)
- [ ] Escribir Firestore rules
- [ ] Crear índices en Firebase Console

**Día 3**:

- [ ] Testing manual exhaustivo de transacciones
- [ ] Validar que rules funcionan
- [ ] Deploy a staging

### Sprint 2 (3-4 días) - Bugs Altos

**Día 1-2**:

- [ ] Corregir BUG-103, 104, 105, 106
- [ ] Agregar validaciones frontend
- [ ] Implementar límites en queries

**Día 3-4**:

- [ ] Testing de regresión completo
- [ ] Deploy a producción
- [ ] Monitoreo inicial

### Backlog - Mejoras Medias/Bajas

- [ ] Agregar tests unitarios (2-3 días)
- [ ] Implementar paginación server-side (2 días)
- [ ] Mejorar UX con notificaciones (1 día)
- [ ] Optimizar performance con caché (2 días)

---

## ✅ Conclusión

**Decisión**: ⚠️ **APROBADO CON CORRECCIONES OBLIGATORIAS**

### Resumen de Calificación

| Categoría         | Puntaje  | Máximo  | %         |
| ----------------- | -------- | ------- | --------- |
| Lógica de Negocio | 18       | 30      | 60%       |
| Seguridad         | 17       | 25      | 68%       |
| Performance       | 14       | 20      | 70%       |
| UI/UX             | 12       | 15      | 80%       |
| Calidad de Código | 11       | 10      | 110%      |
| **TOTAL**         | **72.5** | **100** | **72.5%** |

### Veredicto

La **Fase 3: Inventario y Movimientos** está **funcionalmente completa** y cumple con los criterios de aceptación del FEATURE-001-tienda-web.md. Sin embargo, presenta **2 bugs críticos** (BUG-101 y BUG-102) que DEBEN corregirse antes de deploy a producción.

**Impacto de los bugs críticos**:

- **BUG-101** puede causar pérdida de exactitud en inventario (datos incorrectos)
- **BUG-102** puede generar alertas faltantes (usuario no se entera de stock bajo)

**Se aprueba la fase con las siguientes condiciones**:

1. ✅ Corregir BUG-101 y BUG-102 ANTES de merge a main
2. ✅ Implementar Firestore rules y crear índices ANTES de producción
3. ⚠️ Bugs altos (103-106) deben corregirse en próximo sprint
4. ✅ Agregar tests unitarios (recomendado pero no bloqueante)

### Comparación con Fase 2

| Métrica         | Fase 2 | Fase 3 | Tendencia |
| --------------- | ------ | ------ | --------- |
| Score Total     | 78.5   | 72.5   | 📉 -6pts  |
| Bugs Críticos   | 3      | 2      | ✅ -1     |
| Bugs Altos      | 2      | 4      | 📈 +2     |
| Lógica (%)      | 75%    | 60%    | 📉 -15%   |
| Seguridad (%)   | 68%    | 68%    | ➡️ =      |
| Performance (%) | 70%    | 70%    | ➡️ =      |

**Análisis**: Fase 3 tiene score ligeramente inferior debido a race condition crítica y mayor complejidad de transacciones. Sin embargo, la arquitectura base es sólida y correcciones son quirúrgicas.

---

**Próximos Pasos**:

1. @programador-senior: Implementar correcciones de BUG-101 y BUG-102
2. DevOps: Crear índices Firestore y deploy de rules
3. QA: Re-validar correcciones con tests de concurrencia
4. Product Owner: Aprobar deploy a staging → producción

**Fecha límite sugerida para correcciones**: 2026-08-02 (2 días)

---

**Firma QA**: Sistema QA Automatizado  
**Fecha**: 2026-07-31  
**Versión Reporte**: 1.0
