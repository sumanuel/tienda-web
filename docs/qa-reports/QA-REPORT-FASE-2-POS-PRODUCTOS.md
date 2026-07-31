# Reporte QA - FEATURE-001 Fase 2: POS y Productos

**Feature ID**: FEATURE-001-FASE-2  
**Fecha**: 2025-01-28  
**QA Reviewer**: Sistema QA Escéptico  
**Estado**: ⚠️ APROBADO CON OBSERVACIONES

---

## 📊 Resumen Ejecutivo

| Métrica                    | Estado       | Detalle                                   |
| -------------------------- | ------------ | ----------------------------------------- |
| **Compilación TypeScript** | ✅ PASS      | 0 errores, strict mode                    |
| **Build Next.js**          | ✅ PASS      | Todas las rutas generadas                 |
| **Cobertura de Tests**     | ❌ FAIL      | No hay tests automatizados                |
| **Validaciones Backend**   | ⚠️ PARCIAL   | Validaciones básicas presentes            |
| **Manejo de Errores**      | ⚠️ PARCIAL   | Try-catch presente, logs insuficientes    |
| **Seguridad**              | ⚠️ PARCIAL   | Falta validación de permisos en servicios |
| **Performance**            | ⚠️ PENDIENTE | No testeado con datos masivos             |

---

## ✅ Criterios de Aceptación Validados

### 1. CRUD Productos

**✅ Implementado**:

- ✅ Crear producto con código auto-generado (PROD-XXXX)
- ✅ Actualizar producto existente
- ✅ Eliminar producto (con confirmación)
- ✅ Listar productos con paginación
- ✅ Búsqueda por nombre/código
- ✅ Upload y almacenamiento de imágenes

**Código Revisado**:

- `lib/products.ts`:
  - ✅ `generateProductCode()` usa contador atómico Firestore
  - ✅ `createProduct()` valida datos antes de insertar
  - ✅ `updateProduct()` reemplaza imagen si cambia
  - ✅ `deleteProduct()` limpia imagen de Storage
  - ✅ `searchProducts()` filtra client-side (⚠️ ver observaciones)

**Edge Cases Detectados**:

- ❌ **CRÍTICO**: No valida si código manual duplica código auto-generado
- ❌ **ALTO**: `searchProducts` carga TODOS los productos antes de filtrar (ineficiente con +1000 productos)
- ⚠️ **MEDIO**: `deleteProduct` no verifica si producto está en ventas activas
- ⚠️ **MEDIO**: No valida tamaño/tipo de imagen antes de subir
- ⚠️ **BAJO**: Falta validación de precio > costo

---

### 2. Control de Inventario

**✅ Implementado**:

- ✅ Campo `stock` y `stockMin` en producto
- ✅ Indicador visual de stock bajo (ProductTable badge rojo)
- ✅ Checkbox "Controlar inventario" (trackInventory)
- ✅ Actualización automática de stock en ventas

**Código Revisado**:

- `lib/sales.ts` líneas 25-55:
  ```typescript
  // ✅ Usa runTransaction para atomicidad
  await runTransaction(db, async (transaction) => {
    // ✅ Verifica stock ANTES de procesar
    if (productDoc.stock < item.quantity) {
      throw new Error(`Stock insuficiente para ${productDoc.name}`);
    }
    // ✅ Actualiza stock de forma atómica
    transaction.update(productRef, { stock: productDoc.stock - item.quantity });
  });
  ```

**Edge Cases Detectados**:

- ✅ **Resuelto**: Transacciones Firestore previenen race conditions
- ⚠️ **MEDIO**: Si venta falla después de actualizar stock, no hay rollback automático
- ⚠️ **MEDIO**: No permite venta con stock 0 incluso si `trackInventory = false`
- ⚠️ **BAJO**: No notifica cuando producto llega a stock mínimo

---

### 3. Punto de Venta (POS)

**✅ Implementado**:

- ✅ Búsqueda rápida de productos (autocomplete)
- ✅ Carrito de compras con Zustand
- ✅ Actualización de cantidad por item
- ✅ Descuento por item (campo presente en CartItem)
- ✅ Cálculo automático subtotal/IVA/total
- ✅ Procesamiento de venta con transacción
- ✅ Generación PDF recibo

**Código Revisado**:

- `app/dashboard/pos/page.tsx`:
  - ✅ Búsqueda con debounce implícito (setState)
  - ✅ Validación carrito vacío antes de procesar
  - ✅ Manejo de loading state
  - ✅ Toast notifications para feedback
  - ⚠️ **Faltante**: No permite descuentos por item (UI no tiene campo)
  - ⚠️ **Faltante**: No permite cambiar moneda del carrito en UI

- `store/cartStore.ts`:
  - ✅ `addItem()` detecta duplicados y suma cantidad
  - ✅ `updateQuantity()` recalcula subtotal
  - ✅ Getters computados: `getSubtotal()`, `getTax()`, `getTotal()`
  - ⚠️ **Faltante**: `updateDiscount()` implementado pero no usado en UI

**Edge Cases Detectados**:

- ❌ **CRÍTICO**: No valida stock disponible ANTES de agregar al carrito
- ❌ **ALTO**: Si usuario incrementa cantidad en carrito, puede exceder stock real
- ❌ **ALTO**: No valida que producto aún exista al procesar venta
- ⚠️ **MEDIO**: No permite método de pago móvil/tarjeta (hardcoded 'cash')
- ⚠️ **MEDIO**: No permite múltiples formas de pago (50% cash + 50% tarjeta)
- ⚠️ **BAJO**: No persiste carrito en localStorage (se pierde al refrescar)

---

### 4. Generación de Recibos PDF

**✅ Implementado**:

- ✅ Header con nombre de tienda
- ✅ Número de venta
- ✅ Fecha/hora, cajero
- ✅ Tabla de items con jsPDF-autoTable
- ✅ Subtotal, IVA, Total
- ✅ Detalles de pago (recibido/cambio para cash)
- ✅ Auto-descarga PDF

**Código Revisado**:

- `lib/receipt.ts`:
  - ✅ Usa jsPDF correctamente
  - ✅ Formato fecha con date-fns
  - ✅ Tabla limpia con autoTable
  - ⚠️ **Mejora**: Logo de tienda no incluido (solo texto)
  - ⚠️ **Mejora**: No incluye dirección/teléfono tienda
  - ⚠️ **Bajo**: Posición fija `y:280` puede romperse con muchos items

---

## 🐛 Bugs Encontrados

### 🔴 CRÍTICOS (Bloquean funcionalidad principal)

**BUG-001: Race Condition en Stock de Carrito**

- **Severidad**: CRÍTICA
- **Ubicación**: `app/dashboard/pos/page.tsx` línea 68
- **Descripción**: No valida stock disponible al agregar producto al carrito. Usuario puede agregar 100 unidades cuando solo hay 5 en stock.
- **Pasos a reproducir**:
  1. Crear producto con stock = 5
  2. En POS, agregar producto al carrito
  3. Cambiar cantidad a 100 en carrito
  4. Procesar venta → Error en backend pero UX confusa
- **Impacto**: Mala experiencia de usuario, error inesperado en checkout
- **Fix Sugerido**:
  ```typescript
  const handleAddProduct = (product: Product) => {
    // Validar stock disponible
    if (product.trackInventory && product.stock < 1) {
      toast.error(`${product.name} sin stock disponible`);
      return;
    }

    // Validar stock en carrito existente
    const existingItem = items.find((i) => i.productId === product.id);
    const totalInCart = (existingItem?.quantity || 0) + 1;

    if (product.trackInventory && totalInCart > product.stock) {
      toast.error(`Stock máximo disponible: ${product.stock}`);
      return;
    }

    // ... resto del código
  };
  ```

**BUG-002: Búsqueda Ineficiente con Datos Masivos**

- **Severidad**: ALTA (se vuelve crítica con +1000 productos)
- **Ubicación**: `lib/products.ts` línea 76
- **Descripción**: `searchProducts()` carga TODOS los productos en memoria y filtra client-side. Con 10,000 productos = crash.
- **Fix Sugerido**: Migrar a Firestore composite index con `where()`:
  ```typescript
  // Alternativa 1: Firestore query (requiere índice)
  const q = query(
    collection(db, 'products'),
    where('storeId', '==', storeId),
    where('name', '>=', searchTerm),
    where('name', '<=', searchTerm + '\uf8ff'),
    limit(20)
  );

  // Alternativa 2: Algolia/MeiliSearch para búsqueda full-text
  ```

---

### 🟡 ALTOS (Afectan funcionalidad pero tienen workaround)

**BUG-003: No Permite Editar Descuento por Item en POS**

- **Severidad**: ALTA
- **Ubicación**: `app/dashboard/pos/page.tsx`
- **Descripción**: CartItem tiene campo `discount` y CartStore tiene `updateDiscount()`, pero UI no permite modificarlo.
- **Impacto**: Cajero no puede aplicar descuentos por producto (solo descuento global post-venta)
- **Fix Sugerido**: Agregar input de descuento en cada item del carrito:
  ```tsx
  <input
    type="number"
    min="0"
    max="100"
    value={item.discount}
    onChange={(e) => updateDiscount(item.productId, parseFloat(e.target.value))}
    className="w-16 rounded border px-2 py-1"
  />
  ```

**BUG-004: ProductForm No Valida Imagen antes de Upload**

- **Severidad**: ALTA
- **Ubicación**: `components/products/ProductForm.tsx` línea 77
- **Descripción**: Acepta cualquier archivo como imagen. Usuario puede subir PDF/ZIP y crashear el visor.
- **Fix Sugerido**:
  ```typescript
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo MIME
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten imágenes');
        return;
      }

      // Validar tamaño (ej: max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagen muy grande (máx 5MB)');
        return;
      }

      // ... resto del código
    }
  };
  ```

---

### 🟠 MEDIOS (Mejoras importantes)

**BUG-005: No Valida Código de Producto Duplicado**

- **Severidad**: MEDIA
- **Ubicación**: `lib/products.ts` línea 27
- **Descripción**: Si usuario ingresa código manual, no valida unicidad. Puede duplicar códigos.
- **Fix Sugerido**: Query Firestore antes de crear:
  ```typescript
  if (data.code) {
    const existing = await getDocs(
      query(
        collection(db, 'products'),
        where('storeId', '==', storeId),
        where('code', '==', data.code)
      )
    );

    if (!existing.empty) {
      throw new Error(`Código ${data.code} ya existe`);
    }
  }
  ```

**BUG-006: No Permite Cancelar/Pausar Venta en POS**

- **Severidad**: MEDIA
- **Descripción**: Solo permite "Limpiar Carrito" que elimina todo. No permite pausar venta para retomarla después.
- **Impacto**: Si cajero tiene que atender emergencia, pierde toda la venta actual.
- **Fix Sugerido**: Agregar feature de ventas suspendidas (similar a tienda-app).

---

### 🔵 BAJOS (Mejoras opcionales)

**BUG-007: Carrito No Persiste en LocalStorage**

- **Severidad**: BAJA
- **Descripción**: Si usuario refresca página, pierde todo el carrito.
- **Fix Sugerido**: Zustand persist middleware:
  ```typescript
  import { persist } from 'zustand/middleware';

  export const useCartStore = create<CartState>()(
    persist((set, get) => ({/* ... */}), { name: 'cart-storage' })
  );
  ```

**BUG-008: ProductTable Sin Ordenamiento por Columnas**

- **Severidad**: BAJA
- **Descripción**: TanStack Table configurado pero headers no son clicables para ordenar.
- **Fix Sugerido**: Agregar onClick a headers:
  ```tsx
  <th onClick={() => header.column.toggleSorting()}>{/* ... */}</th>
  ```

---

## 🔒 Análisis de Seguridad

### ✅ Aspectos Positivos

- ✅ Usa `useAuth()` hook para obtener perfil de usuario
- ✅ Firestore Security Rules (asumidas configuradas)
- ✅ No expone API keys en frontend

### ⚠️ Vulnerabilidades Potenciales

**SEC-001: No Valida Permisos de Usuario en Servicios**

- **Severidad**: ALTA
- **Ubicación**: `lib/products.ts`, `lib/sales.ts`
- **Descripción**: Servicios confían en que UI solo permite acciones autorizadas. Usuario malicioso puede llamar directo a `deleteProduct()` desde console.
- **Recomendación**: Validar permisos en Firestore Security Rules:
  ```javascript
  match /products/{productId} {
    allow delete: if request.auth != null
      && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  }
  ```

**SEC-002: Storage Upload Sin Validación Server-Side**

- **Severidad**: MEDIA
- **Descripción**: Firebase Storage debe validar tipo/tamaño de archivo en Security Rules.
- **Recomendación**:
  ```javascript
  match /products/{productId}/image {
    allow write: if request.resource.size < 5 * 1024 * 1024  // Max 5MB
      && request.resource.contentType.matches('image/.*');
  }
  ```

---

## 📈 Análisis de Performance

### Optimizaciones Presentes

- ✅ React 19 con automatic batching
- ✅ Next.js server components (layout, etc)
- ✅ Zustand evita re-renders innecesarios
- ✅ TanStack Table virtualización lista productos

### ⚠️ Puntos Críticos de Performance

**PERF-001: searchProducts() No Escalable**

- **Problema**: Carga todos los productos en memoria
- **Estimación**: Con 10,000 productos = 5-10 segundos de lag
- **Solución**: Usar índices Firestore + paginación

**PERF-002: POS Carga Todos los Productos al Montar**

- **Problema**: `useEffect(() => loadProducts())` carga 100% de productos
- **Estimación**: Con 1000+ productos = 2-5 segundos carga inicial
- **Solución**: Lazy loading + infinite scroll para grid de productos populares

**PERF-003: No Hay Caché de Productos**

- **Problema**: Cada vez que usuario navega POS → Lista Productos, re-fetch completo
- **Solución**: React Query o SWR para caché + invalidación inteligente

---

## ✅ Validación de Criterios de Aceptación (PLAN-002)

| Criterio                         | Estado | Notas                                 |
| -------------------------------- | ------ | ------------------------------------- |
| Usuario puede crear productos    | ✅     | Formulario completo, validación Zod   |
| Código auto-generado si vacío    | ✅     | PROD-XXXX con contador Firestore      |
| Upload de imagen                 | ✅     | Firebase Storage + preview            |
| Listar productos con paginación  | ✅     | TanStack Table, 10 items/página       |
| Editar producto existente        | ✅     | Carga datos, actualiza con validación |
| Eliminar con confirmación        | ✅     | confirm() browser + limpieza imagen   |
| Stock controlado por producto    | ✅     | Campo trackInventory toggle           |
| Búsqueda por nombre/código       | ✅     | Filtro client-side (⚠️ ineficiente)   |
| POS con búsqueda rápida          | ✅     | Autocomplete funcional                |
| Carrito con cálculos automáticos | ✅     | Subtotal, IVA 16%, Total              |
| Procesamiento venta atómico      | ✅     | runTransaction Firestore              |
| Actualización stock automática   | ✅     | En misma transacción de venta         |
| Generación recibo PDF            | ✅     | jsPDF con tabla items                 |
| Multi-moneda                     | ⚠️     | Backend sí, UI POS no permite cambiar |

**Puntaje**: 13/14 (92.8% completitud)

---

## 🧪 Tests Recomendados (No Implementados)

### Tests Unitarios Críticos

```typescript
// __tests__/unit/services/products.test.ts
describe('lib/products', () => {
  describe('generateProductCode', () => {
    it('debe generar código PROD-0001 para primer producto', async () => {
      // Mock Firestore counter
      const code = await generateProductCode('store-1');
      expect(code).toBe('PROD-0001');
    });

    it('debe incrementar contador atómicamente', async () => {
      // Test concurrencia con Promise.all
    });
  });

  describe('searchProducts', () => {
    it('debe filtrar por nombre (case-insensitive)', async () => {
      // ...
    });

    it('debe filtrar por código parcial', async () => {
      // ...
    });

    it('debe manejar búsquedas vacías', async () => {
      // ...
    });
  });
});

// __tests__/unit/services/sales.test.ts
describe('lib/sales', () => {
  describe('processSale', () => {
    it('debe rechazar venta si stock insuficiente', async () => {
      await expect(processSale(/* ... */)).rejects.toThrow(
        'Stock insuficiente'
      );
    });

    it('debe actualizar stock de múltiples productos atómicamente', async () => {
      // ...
    });

    it('debe calcular total correctamente con descuentos', async () => {
      // ...
    });
  });
});

// __tests__/unit/store/cartStore.test.ts
describe('cartStore', () => {
  it('debe sumar cantidad si producto ya existe en carrito', () => {
    // ...
  });

  it('debe recalcular subtotal al cambiar cantidad', () => {
    // ...
  });

  it('debe calcular IVA correctamente', () => {
    const { getSubtotal, getTax } = useCartStore.getState();
    // Mock items = [{subtotal: 100}]
    expect(getTax(16)).toBe(16);
  });
});
```

### Tests de Integración Críticos

```typescript
// __tests__/integration/pos-flow.test.ts
describe('POS Complete Flow', () => {
  it('debe procesar venta completa y actualizar stock', async () => {
    // 1. Mock producto con stock = 10
    // 2. Agregar al carrito qty = 3
    // 3. Procesar venta
    // 4. Verificar stock actualizado a 7
    // 5. Verificar venta creada en Firestore
    // 6. Verificar PDF generado
  });

  it('debe manejar error de stock insuficiente gracefully', async () => {
    // ...
  });
});
```

---

## 📋 Checklist de Validación Manual

### Productos

- [x] Crear producto sin código → genera PROD-XXXX
- [x] Crear producto con código manual → usa el manual
- [ ] Crear producto con código duplicado → rechaza (⚠️ NO VALIDA)
- [x] Subir imagen → muestra preview
- [ ] Subir archivo no-imagen → rechaza (⚠️ NO VALIDA)
- [x] Editar producto → carga datos correctos
- [x] Actualizar imagen → reemplaza en Storage
- [x] Eliminar producto → limpia imagen
- [ ] Eliminar producto usado en venta → previene (⚠️ NO VALIDA)
- [x] Buscar por nombre → filtra correctamente
- [x] Buscar por código parcial → filtra correctamente
- [x] Productos con stock bajo → badge rojo visible

### POS

- [x] Buscar producto → muestra resultados
- [x] Agregar producto → aparece en carrito
- [x] Agregar mismo producto 2 veces → incrementa cantidad
- [ ] Agregar producto sin stock → rechaza (⚠️ NO VALIDA)
- [ ] Incrementar cantidad > stock disponible → previene (⚠️ NO VALIDA)
- [x] Cambiar cantidad item → recalcula subtotal
- [x] Eliminar item → desaparece de carrito
- [x] Limpiar carrito → vacía todo
- [x] Procesar venta con carrito vacío → rechaza
- [x] Procesar venta normal → crea venta + actualiza stock
- [ ] Procesar venta con stock insuficiente → error claro (⚠️ FUNCIONA pero UX mejorable)
- [x] Procesar venta → genera PDF
- [x] Calcular IVA 16% → correcto

### Recibos PDF

- [x] Muestra nombre tienda
- [x] Muestra número venta
- [x] Muestra fecha/hora
- [x] Tabla items completa
- [x] Subtotal/IVA/Total correctos
- [x] Detalles pago (recibido/cambio)
- [x] Auto-descarga archivo

---

## 🎯 Recomendaciones Prioritarias

### 🔴 CRÍTICAS (Implementar ANTES de producción)

1. **Validar Stock en Carrito** (BUG-001)
   - Archivo: `app/dashboard/pos/page.tsx`
   - Tiempo estimado: 1 hora
   - Impacto: Evita errores en checkout

2. **Optimizar Búsqueda de Productos** (BUG-002)
   - Archivos: `lib/products.ts`, Firestore indexes
   - Tiempo estimado: 4 horas
   - Impacto: Escalabilidad con datos masivos

3. **Validar Código Único** (BUG-005)
   - Archivo: `lib/products.ts`
   - Tiempo estimado: 1 hora
   - Impacto: Integridad de datos

4. **Firestore Security Rules** (SEC-001)
   - Archivo: `firestore.rules`
   - Tiempo estimado: 2 horas
   - Impacto: Seguridad de datos

### 🟡 ALTAS (Implementar en siguiente iteración)

5. **Campo Descuento en POS** (BUG-003)
   - Archivo: `app/dashboard/pos/page.tsx`
   - Tiempo estimado: 2 horas
   - Impacto: Funcionalidad de negocio

6. **Validar Imagen Upload** (BUG-004)
   - Archivo: `components/products/ProductForm.tsx`
   - Tiempo estimado: 1 hora
   - Impacto: Previene errores de usuario

7. **Tests Automatizados** (Coverage mínimo 60%)
   - Configurar Jest + Testing Library
   - Tiempo estimado: 8 horas
   - Impacto: Calidad y mantenibilidad

### 🟠 MEDIAS (Backlog)

8. **Pausar/Reanudar Ventas** (BUG-006)
9. **Persist Carrito en LocalStorage** (BUG-007)
10. **Ordenamiento Columnas ProductTable** (BUG-008)
11. **React Query para Caché** (PERF-003)

---

## 📊 Scoring Final

| Categoría              | Puntaje | Peso | Total |
| ---------------------- | ------- | ---- | ----- |
| Funcionalidad Completa | 92.8%   | 30%  | 27.8  |
| Calidad de Código      | 85%     | 20%  | 17.0  |
| Manejo de Errores      | 70%     | 15%  | 10.5  |
| Seguridad              | 60%     | 15%  | 9.0   |
| Performance            | 65%     | 10%  | 6.5   |
| Tests                  | 0%      | 10%  | 0.0   |

**SCORE TOTAL**: **70.8 / 100**

---

## 🏁 Decisión Final

### ⚠️ **APROBADO CON OBSERVACIONES**

**Justificación**:

- ✅ Funcionalidad core completa (13/14 criterios)
- ✅ Compila sin errores TypeScript
- ✅ Código bien estructurado y mantenible
- ❌ Bugs críticos que afectan UX (stock en carrito)
- ❌ No hay tests automatizados
- ❌ Búsqueda no escalable

**Condiciones para Producción**:

1. Implementar validación de stock en carrito (BUG-001)
2. Implementar Firestore Security Rules (SEC-001)
3. Configurar monitoring de errores (Sentry/LogRocket)

**Apto para Staging/QA**: ✅ SÍ  
**Apto para Producción**: ⚠️ CON CORRECCIONES

---

**Firmado**: Sistema QA Escéptico  
**Próximo Review**: Post-corrección de bugs críticos
