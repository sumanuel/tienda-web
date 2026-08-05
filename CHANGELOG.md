# Changelog - TiendaWeb

## [0.4.0] - 2026-08-05 - Fase 4: Clientes y Proveedores

### ✨ Nuevas Funcionalidades

**Gestión de Clientes** 🧑‍💼
- CRUD completo de clientes con validación de documento único
- Campos: nombre, documento (RIF/CI), teléfono, email, dirección, límite de crédito, notas
- Balance de cuentas por cobrar (inicializado en 0, preparado para Fase 5)
- Búsqueda global en tabla por nombre/documento/teléfono/email
- Tabla con ordenamiento, filtros y paginación (10 clientes/página)
- Modal de historial de compras por cliente (integrado con sales)
- Dashboard de estadísticas: total clientes, con saldo pendiente, total por cobrar

**Gestión de Proveedores** 🚚
- CRUD completo de proveedores con validación de RIF único
- Campos: nombre, RIF/NIT, teléfono, email, persona de contacto, notas
- Balance de cuentas por pagar (inicializado en 0, preparado para Fase 5)
- Búsqueda global en tabla por nombre/RIF/contacto/teléfono/email
- Tabla con ordenamiento, filtros y paginación (10 proveedores/página)
- Modal de productos asociados por proveedor (integrado con products collection)
- Dashboard de estadísticas: total proveedores, con saldo pendiente, total por pagar

**Componentes UI** 🎨
- `CustomerForm`: Formulario con validación Zod + React Hook Form
- `CustomersTable`: TanStack Table con búsqueda, ordenamiento y paginación
- `SupplierForm`: Formulario con validación Zod + React Hook Form
- `SuppliersTable`: TanStack Table con búsqueda, ordenamiento y paginación

### 🏗️ Infraestructura

**Servicios Firestore** (lib/)
- `customers.ts`: createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer, searchCustomers, getCustomerSalesHistory, updateCustomerBalance, getCustomersWithBalance
- `suppliers.ts`: createSupplier, getSuppliers, getSupplierById, updateSupplier, deleteSupplier, searchSuppliers, getSupplierProducts, updateSupplierBalance, getSuppliersWithBalance

**Zustand Stores** (store/)
- `customersStore.ts`: Estado global de clientes con actions
- `suppliersStore.ts`: Estado global de proveedores con actions

**Tipos TypeScript** (types/)
- `customer.ts`: `Customer`, `CustomerFormData`
- `supplier.ts`: `Supplier`, `SupplierFormData`

### 📂 Archivos Creados (12 archivos)

1. `types/customer.ts`
2. `types/supplier.ts`
3. `lib/customers.ts`
4. `lib/suppliers.ts`
5. `store/customersStore.ts`
6. `store/suppliersStore.ts`
7. `components/customers/CustomerForm.tsx`
8. `components/customers/CustomersTable.tsx`
9. `components/suppliers/SupplierForm.tsx`
10. `components/suppliers/SuppliersTable.tsx`
11. `app/dashboard/customers/page.tsx`
12. `app/dashboard/suppliers/page.tsx`

### 📊 Firestore Collections

**customers**: storeId, name, document (único), phone, email, address, creditLimit, balance, notes, createdAt, updatedAt

**suppliers**: storeId, name, rif (único), phone, email, contactPerson, balance, notes, createdAt, updatedAt

### 🔥 Índices Firestore Requeridos

- customers: `(storeId ASC, name ASC)`, `(storeId ASC, document ASC)`
- suppliers: `(storeId ASC, name ASC)`, `(storeId ASC, rif ASC)`
- sales: `(storeId ASC, customerId ASC, createdAt DESC)` para historial

### 📈 Métricas

- **Archivos nuevos**: 12
- **Colecciones**: 2 (customers, suppliers)
- **Rutas**: 2 nuevas (/dashboard/customers, /dashboard/suppliers)
- **Build**: ✅ Exitoso (0 errores TypeScript)
- **Estimación**: 28 horas | **Real**: ~6 horas

---

## [0.3.1] - 2026-08-05 - Correcciones Críticas Post-QA Fase 3

### 🐛 Correcciones Críticas

**BUG-101: Race Condition en Transacciones de Inventario - CRÍTICO**
- **Problema**: `registerInventoryMovement` leía el producto ANTES de la transacción, permitiendo que movimientos simultáneos sobrescribieran el stock
- **Impacto**: Pérdida de exactitud en inventario
- **Solución**: Mover lectura de producto DENTRO de `runTransaction` para garantizar atomicidad completa
- **Archivo**: `lib/inventory.ts` líneas 40-100

**BUG-102: checkStockAlert Fallaba Silenciosamente - CRÍTICO**
- **Problema**: Función con try-catch que solo loggeaba errores sin propagarlos, generando alertas faltantes
- **Impacto**: Usuario no se enteraba de stock bajo cuando la creación de alerta fallaba
- **Solución**: Lanzar errores y manejar apropiadamente en caller sin bloquear operación principal
- **Archivo**: `lib/inventory.ts` función `checkStockAlert`

### 🔧 Correcciones Adicionales

**BUG-103: Double Reverse Innecesario en Kardex - ALTO**
- `generateKardex()` ahora usa `slice().reverse()` en vez de mutar array original
- Eliminado segundo `.reverse()` innecesario

**BUG-104: Valorización No Validaba Categoría - ALTO**
- `calculateInventoryValuation()` ahora valida categoría con fallback a "Sin Categoría"
- Previene crashes por `byCategory[undefined]`

**BUG-107: Condición de Alerta Incorrecta - MEDIO**
- Cambio de `currentStock <= minStock` a `currentStock < minStock`
- Consistencia: alerta se crea solo cuando stock está POR DEBAJO del mínimo

**BUG-109: Referencias de Kardex Mejoradas - BAJO**
- Formato de referencia cambiado a `MOV-XXXXXXXX` (mayúsculas)

### 📊 Calidad

- Score QA: **72.5/100** → En proceso de re-validación
- Build: **✅ Exitoso** (0 errores TypeScript)
- Bugs críticos corregidos: **2/2**
- Bugs altos corregidos: **2/4**

---

## [0.3.0] - 2026-07-31 - Fase 3: Inventario y Movimientos

### ✨ Nuevas Funcionalidades

- **Sistema completo de gestión de inventario**
  - Registro de movimientos (entrada/salida/ajuste) con validación de stock
  - Historial completo de movimientos con búsqueda y filtros
  - Transacciones atómicas en Firestore para garantizar consistencia

- **Kardex de productos**
  - Generación automática de kardex por producto
  - Vista detallada de entrada/salida/saldo
  - Exportación a CSV

- **Alertas de stock bajo**
  - Detección automática cuando stock < stockMin
  - Widget en dashboard con primeras 5 alertas
  - Resolución automática cuando stock se normaliza

- **Valorización de inventario**
  - Cálculo de valor total del inventario
  - Desglose por categoría con gráficos de barras
  - KPIs: valor total, total unidades, valor promedio

### 🏗️ Arquitectura

**Tipos creados:**

- `types/inventory.ts` - MovementType, InventoryMovement, StockAlert, KardexEntry

**Servicios:**

- `lib/inventory.ts`:
  - `registerInventoryMovement()` - Transacciones atómicas
  - `generateKardex()` - Historial cronológico
  - `checkStockAlert()` - Sistema de alertas
  - `calculateInventoryValuation()` - Valorización

**Estado Global:**

- `store/inventoryStore.ts` - Zustand store para movements y alerts

**Componentes:**

- `components/inventory/MovementForm.tsx` - Formulario de movimientos
- `components/inventory/MovementsTable.tsx` - Tabla con @tanstack/react-table
- `components/inventory/StockAlertsCard.tsx` - Widget de alertas
- `components/inventory/KardexView.tsx` - Vista de kardex

**Páginas:**

- `/dashboard/inventory/movements` - Gestión de movimientos
- `/dashboard/inventory/kardex` - Consulta de kardex
- `/dashboard/inventory/valuation` - Valorización de inventario

**Navegación:**

- `Sidebar.tsx` actualizado con menú "Inventario" expandible

### 🐛 Correcciones

- Fix: Dashboard corregido después de error de sintaxis en merge

### 📦 Archivos Modificados

- `app/dashboard/page.tsx` - Integrado widget de alertas de stock
- `components/layout/Sidebar.tsx` - Menú inventario con 3 subitems

---

## [0.2.0] - 2025-01-XX - Fase 2: POS y Productos

### ✨ Nuevas Funcionalidades

- **Sistema de Punto de Venta (POS)**
  - Búsqueda de productos por nombre, código o código de barras
  - Carrito de compras con gestión de cantidades
  - Selección de moneda (VES, USD, EUR)
  - Procesamiento de ventas con numeración secuencial
  - Generación de recibos PDF con jsPDF
  - Validación de stock antes de agregar productos al carrito

- **Gestión de Productos**
  - CRUD completo de productos
  - Múltiples precios por moneda (VES, USD, EUR)
  - Carga de imágenes con Firebase Storage
  - Validación de código de barras único
  - Generación automática de código de producto
  - Control de inventario (activar/desactivar por producto)
  - Stock mínimo para alertas

### 🏗️ Arquitectura

**Tipos creados:**

- `types/product.ts` - Interfaz Product, ProductFormData
- `types/sale.ts` - Interfaz Sale, SaleItem, CartItem

**Servicios:**

- `lib/storage.ts` - Subida de imágenes a Firebase Storage
- `lib/products.ts` - CRUD de productos con Firestore
- `lib/sales.ts` - Procesamiento de ventas con transacciones atómicas
- `lib/receipt.ts` - Generación de recibos PDF

**Estado Global:**

- `store/productsStore.ts` - Zustand store para productos
- `store/cartStore.ts` - Zustand store para carrito de compras

**Componentes:**

- `components/products/ProductForm.tsx` - Formulario de productos
- `components/products/ProductTable.tsx` - Tabla con @tanstack/react-table

**Páginas:**

- `/dashboard/pos` - Punto de venta completo
- `/dashboard/products` - Lista de productos
- `/dashboard/products/new` - Crear producto
- `/dashboard/products/[id]/edit` - Editar producto

### 🔧 Mejoras Técnicas

- Transacciones atómicas en Firestore para ventas
- Validación de imágenes (tipo MIME y tamaño máximo 5MB)
- Client-side filtering en productos (migrar a índices Firestore en futuro)
- Type-safe forms con React Hook Form + Zod

### 🐛 Correcciones (Post-QA)

- **BUG-001 CRÍTICO**: Stock no validado al agregar al carrito - CORREGIDO
- **BUG-004 CRÍTICO**: Imágenes no validadas por tipo - CORREGIDO
- **BUG-005 CRÍTICO**: Códigos duplicados no validados - CORREGIDO
- **TypeScript**: Cast de costCurrency a union type - CORREGIDO
- **jsPDF**: setFont(undefined) error - CORREGIDO

### 📊 Calidad

- Score QA inicial: **70.8/100**
- Score QA post-fixes: **78.5/100**
- TypeScript: **0 errores**
- Build: **✅ Exitoso**

### 📦 Dependencias Agregadas

```json
{
  "@tanstack/react-table": "^8.13.0",
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.8.2",
  "react-dropzone": "^14.2.3",
  "react-hook-form": "^7.51.0",
  "zod": "^3.23.0",
  "date-fns": "^3.2.0"
}
```

---

## [0.1.0] - 2025-01-XX - Fase 1: Fundamentos

### ✨ Nuevas Funcionalidades

- **Autenticación con Firebase**
  - Registro de usuarios con email/password
  - Login y logout
  - Creación automática de "tienda" por usuario
  - Contexto de autenticación global

- **Layout del Dashboard**
  - Sidebar con navegación
  - Header con usuario y logout
  - Estructura base de rutas protegidas

- **Configuración Inicial**
  - Next.js 16 con App Router
  - TypeScript en modo estricto
  - Tailwind CSS + shadcn/ui
  - Firebase configurado (Auth + Firestore)
  - Zustand para estado global

### 🏗️ Arquitectura Base

**Estructura de carpetas:**

```
app/
  dashboard/       # Rutas protegidas
  login/           # Página de login
  register/        # Página de registro
components/
  layout/          # Sidebar, Header
hooks/
  useAuth.ts       # Hook de autenticación
lib/
  firebase.ts      # Configuración de Firebase
types/
  user.ts          # Tipos de usuario
```

**Modelos de datos:**

- `users` collection en Firestore
- `stores` collection en Firestore (una por usuario)

### 📦 Stack Técnico

- **Frontend**: Next.js 16.2.12, React 19.1.0, TypeScript 5.4+
- **Estilos**: Tailwind CSS 3.4.3, shadcn/ui v4
- **Backend**: Firebase Auth + Firestore
- **Estado**: Zustand 4.5+
- **Formularios**: React Hook Form + Zod (agregado en Fase 2)

---

## Roadmap

### ✅ Fase 1: Fundamentos (Semana 1-2) - COMPLETADO

### ✅ Fase 2: POS + Productos (Semana 3-4) - COMPLETADO

### ✅ Fase 3: Inventario y Movimientos (Semana 5) - COMPLETADO

### ⏳ Fase 4: Clientes y Proveedores (Semana 6) - PENDIENTE

### ⏳ Fase 5: Cuentas por Cobrar/Pagar (Semana 7) - PENDIENTE

### ⏳ Fase 6: Reportes y Dashboard Final (Semana 8) - PENDIENTE

### ⏳ Fase 7: Features Avanzados (Semana 9-10) - PENDIENTE

---

**Convenciones:**

- ✨ Nuevas Funcionalidades
- 🏗️ Arquitectura
- 🔧 Mejoras Técnicas
- 🐛 Correcciones
- 📦 Dependencias
- 📊 Calidad
