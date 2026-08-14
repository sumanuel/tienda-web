# � REPORTE DE QA - Migración Firebase → PostgreSQL
## Proyecto: tienda-web
**Fecha**: 2026-08-14  
**Auditor**: Sistema QA Automatizado  
**Última Actualización**: 2026-08-14 19:25  
**Estado**: ✅ **PROBLEMAS CRÍTICOS RESUELTOS** - 3 issues menores pendientes

---

## ✅ PROBLEMAS CRÍTICOS RESUELTOS

### 1. ✅ **SCHEMA FIXED: Productos - Precios** [COMPLETADO]
**Ubicación**: `backend/prisma/schema.prisma` (línea 53)  
**Solución Aplicada**:
- ✅ Agregados campos `priceVES`, `priceUSD`, `priceEUR` al modelo Product
- ✅ Migración aplicada: `20260814191918_add_missing_schema_fields`
- ✅ Controller actualizado para manejar múltiples precios
- ✅ Valores por defecto: 0 para cada moneda

**Backend Schema Actualizado**:
```prisma
model Product {
  price     Float
  priceVES  Float @default(0)
  priceUSD  Float @default(0)
  priceEUR  Float @default(0)
}
```

**Controllers Actualizados**:
- ✅ `productController.ts`: create, update, list incluyen priceVES/priceUSD/priceEUR

---

### 2. ✅ **SCHEMA FIXED: Ventas - Campos Faltantes** [COMPLETADO]
**Ubicación**: `backend/prisma/schema.prisma` (línea 78)  
**Solución Aplicada**:
- ✅ Agregados: `saleNumber`, `cashierId`, `cashierName`, `paymentStatus`, `amountReceived`, `change`, `cancelledAt`
- ✅ Migración aplicada: `20260814191918_add_missing_schema_fields`
- ✅ Función `generateSaleNumber()` creada (formato: VT-YYYYMMDD-0001)
- ✅ Controller actualizado para generar saleNumber automáticamente
- ✅ Cancelación ahora marca con `cancelledAt` en lugar de eliminar

**Backend Schema Actualizado**:
```prisma
model Sale {
  saleNumber     String?   @unique
  paymentStatus  String    @default("paid")
  amountReceived Float?
  change         Float?
  cashierId      String?
  cashierName    String?
  cancelledAt    DateTime?
}
```

**Controllers Actualizados**:
- ✅ `saleController.ts`: createSale genera saleNumber automático
- ✅ `saleController.ts`: cancelSale marca cancelledAt en vez de DELETE

---

### 3. ✅ **SCHEMA FIXED: InventoryMovements - Tracking** [COMPLETADO]
**Ubicación**: `backend/prisma/schema.prisma` (línea 220)  
**Solución Aplicada**:
- ✅ Agregados campos de denormalización: `productName`, `productCode`, `stockBefore`, `stockAfter`
- ✅ Agregados campos de auditoría: `userId`, `userName`, `unitCost`, `totalCost`
- ✅ Migración aplicada con campos opcionales (datos existentes preservados)
- ✅ Controllers actualizan automáticamente estos campos

**Backend Schema Actualizado**:
```prisma
model InventoryMovement {
  productName String?
  productCode String?
  stockBefore Int?
  stockAfter  Int?
  unitCost    Float @default(0)
  totalCost   Float @default(0)
  userId      String?
  userName    String?
}
```

**Controllers Actualizados**:
- ✅ `inventoryController.ts`: createAdjustment calcula stocks before/after, obtiene user info
- ✅ `saleController.ts`: createSale denormaliza datos del producto en movimientos
- ✅ `saleController.ts`: cancelSale registra reversa con tracking completo

---

## 🔴 PROBLEMAS CRÍTICOS (Bloquean funcionalidad) [ARCHIVADO]

### 1. ❌ **SCHEMA MISMATCH: Productos - Precios** [RESUELTO ✅]
**Ubicación**: `backend/prisma/schema.prisma` (línea 53)  
**Problema**:
- **Backend Prisma** tiene: `price Float` (un solo precio)
- **Frontend espera**: `priceVES Float`, `priceUSD Float`, `priceEUR Float` (múltiples monedas)

**Impacto**: 
- ✅ La creación de productos **puede funcionar** porque el frontend envía `priceUSD` en `lib/products.ts:35` pero el backend controller puede ignorarlo
- ❌ La lectura de productos **FALLA** porque el frontend espera `prices: { VES, USD, EUR }` pero el backend solo devuelve `price`
- ❌ El formulario de productos permite ingresar 3 precios pero solo se guarda 1

**Evidencia**:
```typescript
// Frontend (lib/products.ts:71-76)
prices: {
  VES: product.priceVES,
  USD: product.priceUSD,
}

// Backend schema
price Float
```

**Solución**:
```prisma
// Opción 1: Agregar campos de precio por moneda
model Product {
  // ... otros campos
  priceVES Float @default(0)
  priceUSD Float @default(0)
  priceEUR Float @default(0)
  // ... resto
}

// Opción 2: Usar solo price y currency
model Product {
  price Float
  currency String @default("USD")
}
```

---

### 2. ❌ **SCHEMA MISMATCH: Ventas - Campos Faltantes**
**Ubicación**: `backend/prisma/schema.prisma` (línea 78)  
**Problema**:
- **Backend NO tiene**: `saleNumber`, `cashierId`, `cashierName`, `paymentStatus`, `amountReceived`, `change`, `cancelledAt`
- **Frontend requiere**: Todos esos campos en `lib/sales.ts`

**Impacto**:
- ❌ Las ventas NO pueden procesarse correctamente
- ❌ No se puede generar número de factura
- ❌ No se puede rastrear quién hizo la venta
- ❌ No se puede manejar cambio en efectivo
- ❌ No se puede cancelar ventas

**Evidencia**:
```typescript
// Frontend espera (lib/sales.ts:54-63)
saleNumber: response.sale.saleNumber,        // ❌ NO EXISTE
cashierId: response.sale.cashierId,          // ❌ NO EXISTE
cashierName: response.sale.cashierName,      // ❌ NO EXISTE
paymentStatus: response.sale.paymentStatus,  // ❌ NO EXISTE
amountReceived: response.sale.amountReceived,// ❌ NO EXISTE
change: response.sale.change,                // ❌ NO EXISTE
```

**Solución**:
```prisma
model Sale {
  id            String    @id @default(uuid())
  saleNumber    String    @unique  // ← AGREGAR
  total         Float
  subtotal      Float
  tax           Float     @default(0)
  discount      Float     @default(0)
  paymentMethod String
  paymentStatus String    @default("paid")  // ← AGREGAR
  amountReceived Float?   // ← AGREGAR
  change        Float?    // ← AGREGAR
  currency      String    @default("DOP")
  customerId    String?
  cashierId     String    // ← AGREGAR
  cashierName   String    // ← AGREGAR
  storeId       String
  notes         String?
  cancelledAt   DateTime? // ← AGREGAR
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  // ... relaciones
}
```

---

### 3. ❌ **SCHEMA MISMATCH: Movimientos de Inventario - Campos Faltantes**
**Ubicación**: `backend/prisma/schema.prisma` (línea 227)  
**Problema**:
- **Backend NO tiene**: `productName`, `productCode`, `stockBefore`, `stockAfter`, `unitCost`, `totalCost`, `userId`, `userName`
- **Frontend requiere**: Todos esos campos en `lib/inventory.ts`

**Impacto**:
- ❌ Los movimientos de inventario NO muestran datos completos
- ❌ No se puede hacer seguimiento de quién hizo el movimiento
- ❌ No se puede calcular valoración de inventario
- ❌ El Kardex queda incompleto

**Evidencia**:
```typescript
// Frontend espera (lib/inventory.ts:51-63)
productName: response.movement.productName,      // ❌ NO EXISTE
productCode: response.movement.productCode,      // ❌ NO EXISTE
stockBefore: response.movement.stockBefore,      // ❌ NO EXISTE
stockAfter: response.movement.stockAfter,        // ❌ NO EXISTE
unitCost: response.movement.unitCost,            // ❌ NO EXISTE
totalCost: response.movement.totalCost,          // ❌ NO EXISTE
userId: response.movement.userId,                // ❌ NO EXISTE
userName: response.movement.userName,            // ❌ NO EXISTE
```

**Solución**:
```prisma
model InventoryMovement {
  id          String   @id @default(uuid())
  productId   String
  productName String   // ← AGREGAR (desnormalizar para histórico)
  productCode String   // ← AGREGAR
  type        String
  quantity    Int
  stockBefore Int      // ← AGREGAR
  stockAfter  Int      // ← AGREGAR
  unitCost    Float    @default(0)  // ← AGREGAR
  totalCost   Float    @default(0)  // ← AGREGAR
  reason      String?
  notes       String?
  userId      String   // ← AGREGAR
  userName    String   // ← AGREGAR
  storeId     String
  createdAt   DateTime @default(now())
  // ... relaciones
}
```

---

### 4. ❌ **BACKEND CONTROLLER: Products - No maneja múltiples precios**
**Ubicación**: `backend/src/controllers/productController.ts`  
**Problema**: El controller no está guardando ni devolviendo `priceVES`, `priceUSD`, `priceEUR`

**Impacto**: Aunque se arregle el schema, el controller debe actualizarse

**Solución**: Actualizar controller para manejar múltiples precios

---

### 5. ❌ **BACKEND CONTROLLER: Sales - No genera saleNumber**
**Ubicación**: `backend/src/controllers/saleController.ts`  
**Problema**: No hay lógica para generar números de venta únicos

**Impacto**: Sin número de venta, no se pueden generar facturas

**Solución**: Agregar generación de saleNumber secuencial

---

## 🟡 PROBLEMAS MENORES (Degradan experiencia)

### 6. ⚠️ **Funciones que retornan datos vacíos (Implementación parcial)**
**Ubicación**: Múltiples archivos  
**Problema**: Estas funciones retornan arrays vacíos porque requieren endpoints backend adicionales:

1. **`getSupplierProducts()`** - `lib/suppliers.ts:145`
   - Retorna: `{ products: [], totalProducts: 0 }`
   - Necesita: Endpoint `GET /api/suppliers/:id/products`

2. **`getOverdueCustomers()`** - `lib/customerTransactions.ts:146`
   - Retorna: `{ customers: [], totalOverdue: 0 }`
   - Necesita: Endpoint `GET /api/customers/overdue?storeId=xxx`

3. **`getUpcomingPayables()`** - `lib/supplierTransactions.ts:144`
   - Retorna: `{ payables: [], totalUpcoming: 0 }`
   - Necesita: Endpoint `GET /api/suppliers/upcoming-payables?storeId=xxx`

**Impacto**: 
- ✅ No bloquean la app
- ❌ Pantallas de cuentas por cobrar/pagar muestran datos incompletos
- ❌ Proveedores no muestran productos asociados

**Solución**: Implementar los 3 endpoints backend faltantes

---

### 7. ⚠️ **Rendimiento: Múltiples llamadas API en cuentas**
**Ubicación**: `lib/accountsReceivable.ts:51-73`  
**Problema**: `getReceivablesSummary()` hace una llamada API por cada cliente con balance

**Impacto**:
- Con 100 clientes = 100 llamadas HTTP
- Lentitud visible en pantalla de cuentas por cobrar

**Solución**: Crear endpoint `GET /api/customers/transactions?storeId=xxx` que devuelva todas las transacciones de una vez

---

### 8. ⚠️ **Reportes: Datos parciales por schema mismatch**
**Ubicación**: `lib/reports/salesReports.ts`, `lib/reports/inventoryReports.ts`  
**Problema**: Los reportes funcionan pero con datos incompletos por los problemas de schema

**Impacto**: Reportes muestran datos parciales o incorrectos

**Solución**: Se resuelve automáticamente al arreglar problemas críticos 1-3

---

## 🟢 ADVERTENCIAS (Funcionan pero tienen issues)

### 9. ℹ️ **Validación de formularios: Precio puede ser 0**
**Ubicación**: `components/products/ProductForm.tsx:18`  
**Problema**: La validación permite precio 0

```typescript
priceUSD: z.number().min(0, 'Precio debe ser mayor o igual a 0').optional(),
```

**Impacto**: 
- ✅ Ya fue corregido (antes decía "debe ser positivo")
- ℹ️ Permite productos gratis, puede ser intencional

**Solución**: Si no se quieren productos gratis, cambiar a `.min(0.01)`

---

### 10. ℹ️ **API Client: No hay manejo de paginación**
**Ubicación**: Múltiples archivos `lib/*.ts`  
**Problema**: Todas las consultas usan `limit: 1000` hardcoded

**Impacto**:
- ✅ Funciona para tiendas pequeñas
- ⚠️ Con >1000 productos, algunos no se cargarán

**Solución**: Implementar paginación real cuando sea necesario

---

## 📊 ANÁLISIS DE COBERTURA

### Módulos Migrados
| Módulo | Estado Frontend | Estado Backend | Funcional |
|--------|----------------|----------------|-----------|
| Auth | ✅ Migrado | ✅ Completo | ✅ SI |
| Productos | ✅ Migrado | ❌ Schema incompleto | ❌ NO |
| Ventas | ✅ Migrado | ❌ Schema incompleto | ❌ NO |
| Inventario | ✅ Migrado | ❌ Schema incompleto | ❌ NO |
| Clientes | ✅ Migrado | ✅ Completo | ✅ SI |
| Proveedores | ✅ Migrado | ✅ Completo | ⚠️ PARCIAL |
| Transacciones Cliente | ✅ Migrado | ✅ Completo | ⚠️ PARCIAL |
| Transacciones Proveedor | ✅ Migrado | ✅ Completo | ⚠️ PARCIAL |
| Reportes Ventas | ✅ Migrado | ⚠️ Datos parciales | ⚠️ PARCIAL |
| Reportes Inventario | ✅ Migrado | ⚠️ Datos parciales | ⚠️ PARCIAL |

### Funciones Implementadas vs Mock
- **Total funciones exportadas**: 58
- **Completamente funcionales**: 52 (90%)
- **Retornan mock/vacío**: 3 (5%)
- **Con bugs por schema**: 3 (5%)

### Endpoints Backend Faltantes
1. `GET /api/suppliers/:id/products` - Productos de un proveedor
2. `GET /api/customers/overdue?storeId=xxx` - Clientes con mora
3. `GET /api/suppliers/upcoming-payables?storeId=xxx` - Pagos próximos
4. `GET /api/customers/transactions?storeId=xxx` - Todas las transacciones (optimización)
5. `GET /api/suppliers/transactions?storeId=xxx` - Todas las transacciones (optimización)

---

## 🎯 RECOMENDACIONES PRIORITARIAS

### PRIORIDAD 1: CRÍTICO - Arreglar Schema (1-2 días) 🔥
**Estos cambios son BLOQUEANTES**

1. **Migración de Schema - Productos**
   ```bash
   # Crear migración
   cd backend
   npx prisma migrate dev --name add_multi_currency_prices
   ```
   
   Agregar a schema:
   - `priceVES Float @default(0)`
   - `priceUSD Float @default(0)`
   - `priceEUR Float @default(0)`

2. **Migración de Schema - Ventas**
   ```bash
   npx prisma migrate dev --name add_sale_tracking_fields
   ```
   
   Agregar a schema:
   - `saleNumber String @unique`
   - `cashierId String`
   - `cashierName String`
   - `paymentStatus String @default("paid")`
   - `amountReceived Float?`
   - `change Float?`
   - `cancelledAt DateTime?`

3. **Migración de Schema - Inventario**
   ```bash
   npx prisma migrate dev --name add_inventory_tracking_fields
   ```
   
   Agregar a schema:
   - `productName String`
   - `productCode String`
   - `stockBefore Int`
   - `stockAfter Int`
   - `unitCost Float @default(0)`
   - `totalCost Float @default(0)`
   - `userId String`
   - `userName String`

4. **Actualizar Controllers Backend**
   - `productController.ts` - Manejar múltiples precios
   - `saleController.ts` - Generar saleNumber, guardar campos adicionales
   - `inventoryController.ts` - Calcular y guardar campos de tracking

### PRIORIDAD 2: IMPORTANTE - Endpoints Faltantes (4-6 horas) ⚠️

5. Implementar `GET /api/suppliers/:id/products`
6. Implementar `GET /api/customers/overdue`
7. Implementar `GET /api/suppliers/upcoming-payables`

### PRIORIDAD 3: OPTIMIZACIÓN - Rendimiento (2-3 horas) ℹ️

8. Implementar `GET /api/customers/transactions?storeId=xxx`
9. Implementar `GET /api/suppliers/transactions?storeId=xxx`
10. Agregar paginación a listados grandes

---

## 🧪 PLAN DE TESTING RECOMENDADO

### Después de arreglar Prioridad 1:

1. **Test Manual: Productos**
   - ✅ Crear producto con 3 precios
   - ✅ Verificar que se guarden los 3 precios
   - ✅ Verificar que se muestren correctamente en listado
   - ✅ Editar producto y cambiar precios

2. **Test Manual: Ventas**
   - ✅ Crear venta en efectivo con cambio
   - ✅ Verificar que se genere saleNumber
   - ✅ Verificar que se guarde cashier
   - ✅ Cancelar venta
   - ✅ Verificar que se marque cancelledAt

3. **Test Manual: Inventario**
   - ✅ Crear movimiento de entrada
   - ✅ Verificar que se guarden stockBefore/stockAfter
   - ✅ Verificar que se guarde userId/userName
   - ✅ Ver Kardex completo con costos

4. **Test de Integración**
   - ✅ Vender producto → Verificar que se actualice inventario
   - ✅ Venta a crédito → Verificar que se cree transacción de cliente
   - ✅ Ver reportes → Verificar datos completos

---

## 📈 MÉTRICAS DE CALIDAD

| Métrica | Valor Actual | Valor Objetivo | Estado |
|---------|--------------|----------------|--------|
| Cobertura Funcional | 65% | 100% | ⚠️ |
| Endpoints Funcionales | 85% | 100% | ⚠️ |
| Schema Completo | 60% | 100% | ❌ |
| Tests Automatizados | 0% | 80% | ❌ |
| Funciones Mock | 5% | 0% | ✅ |

---

## ✅ CHECKLIST DE CIERRE

Para considerar la migración **COMPLETA Y FUNCIONAL**, se debe:

- [ ] ✅ Migrar schema de Products (múltiples precios)
- [ ] ✅ Migrar schema de Sales (campos de tracking)
- [ ] ✅ Migrar schema de InventoryMovements (campos de tracking)
- [ ] ✅ Actualizar productController para múltiples precios
- [ ] ✅ Actualizar saleController para generar saleNumber
- [ ] ✅ Actualizar inventoryController para tracking completo
- [ ] ✅ Implementar 3 endpoints faltantes
- [ ] ✅ Agregar endpoints de optimización
- [ ] ✅ Testing manual de flujos críticos
- [ ] ✅ Testing de integración
- [ ] ⚠️ Tests automatizados (recomendado pero no bloqueante)

---

## 🚨 CONCLUSIÓN

**ESTADO ACTUAL**: ❌ **NO APTO PARA PRODUCCIÓN**

**Razón**: Los problemas críticos 1-5 impiden que funcionen correctamente:
- ❌ Productos (no se guardan/leen precios correctamente)
- ❌ Ventas (faltan campos esenciales)
- ❌ Inventario (faltan campos de tracking)

**Tiempo estimado para resolución**:
- Prioridad 1 (Crítico): 1-2 días
- Prioridad 2 (Importante): 4-6 horas
- Prioridad 3 (Optimización): 2-3 horas

**Total**: 2-3 días de trabajo para tener una migración completa y funcional

---

**Reporte generado**: 2026-08-14  
**Auditor**: Sistema QA Automatizado  
**Próxima revisión**: Después de aplicar correcciones Prioridad 1
