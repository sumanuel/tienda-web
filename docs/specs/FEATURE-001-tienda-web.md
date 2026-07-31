# FEATURE-001: tienda-web - Sistema POS Web Completo

**Fecha**: 2026-07-31  
**Analista**: analista-requerimientos agent  
**Proyecto Base**: tienda-app (React Native/Expo)  
**Proyecto Destino**: tienda-web (Web Application)

---

## 📋 Resumen Ejecutivo

Crear una versión web completa del sistema POS tienda-app, manteniendo toda la funcionalidad del sistema móvil pero optimizada para navegadores web y uso en desktop. La aplicación web debe compartir la misma lógica de negocio y, opcionalmente, la misma base de datos Firebase para sincronización multi-plataforma.

---

## 🎯 Objetivos del Proyecto

### Objetivos Principales

1. **Paridad Funcional**: Replicar el 100% de la funcionalidad de tienda-app en web
2. **Experiencia Desktop-First**: UI optimizada para pantallas grandes y mouse/teclado
3. **Multi-plataforma**: Mismo negocio accesible desde móvil (tienda-app) y web (tienda-web)
4. **Sincronización**: Datos compartidos entre móvil y web vía Firebase
5. **Rendimiento**: Carga inicial < 3s, operaciones < 500ms

### Objetivos Secundarios

1. Atajos de teclado para operaciones frecuentes
2. Impresión nativa de recibos y reportes
3. Exportación de datos a Excel/PDF
4. Dashboard con gráficos interactivos avanzados
5. Modo oscuro/claro

---

## 👥 Usuarios y Casos de Uso

### Usuarios Objetivo

Los mismos roles que tienda-app:

1. **Propietario (Owner)**: Acceso total, configuración, reportes financieros
2. **Administrador (Admin)**: Gestión de inventario, ventas, clientes, proveedores
3. **Cajero (Cashier)**: Solo procesamiento de ventas

### Casos de Uso Principales

#### CU-001: Procesamiento Rápido de Venta (POS Web)

**Actor**: Cajero  
**Precondiciones**: Usuario autenticado, productos en inventario  
**Flujo**:

1. Cajero accede a pantalla POS
2. Busca producto por nombre, código o escanea barcode
3. Agrega producto al carrito (cantidad, descuento opcional)
4. Repite para múltiples productos
5. Selecciona método de pago (efectivo, tarjeta, transferencia)
6. Procesa venta
7. Imprime/envía recibo por email o WhatsApp

**Postcondiciones**: Venta registrada, inventario actualizado, recibo generado

#### CU-002: Gestión Completa de Inventario

**Actor**: Administrador  
**Precondiciones**: Usuario autenticado con permisos de admin  
**Flujo**:

1. Accede a módulo de productos
2. Visualiza lista completa con filtros (categoría, stock, proveedor)
3. Puede crear/editar/eliminar productos
4. Registra entradas de inventario (compras a proveedores)
5. Registra salidas de inventario (ajustes, mermas)
6. Visualiza historial de movimientos por producto
7. Recibe alertas de stock bajo

**Postcondiciones**: Inventario actualizado, movimientos registrados

#### CU-003: Dashboard Ejecutivo en Tiempo Real

**Actor**: Propietario  
**Precondiciones**: Usuario autenticado con rol owner  
**Flujo**:

1. Accede a dashboard principal
2. Visualiza KPIs del día/semana/mes
3. Revisa gráficos de ventas por período
4. Consulta productos más vendidos
5. Revisa estado de cuentas por cobrar/pagar
6. Exporta reportes a Excel/PDF

**Postcondiciones**: Información actualizada consultada

#### CU-004: Sincronización Multi-dispositivo

**Actor**: Sistema  
**Precondiciones**: Conexión a internet, Firebase configurado  
**Flujo**:

1. Usuario realiza venta en móvil (tienda-app)
2. Cambio se sincroniza a Firebase
3. Usuario en web (tienda-web) recibe actualización en tiempo real
4. Dashboard muestra venta inmediatamente
5. Inventario se actualiza en ambos dispositivos

**Postcondiciones**: Datos sincronizados en tiempo real

#### CU-005: Gestión de Multi-Moneda

**Actor**: Administrador  
**Precondiciones**: Configuración de monedas activa  
**Flujo**:

1. Sistema obtiene tasas de cambio actualizadas (BCV, APIs)
2. Usuario crea producto con precio en múltiples monedas
3. En POS, usuario selecciona moneda de venta
4. Sistema convierte montos automáticamente
5. Venta se registra con snapshot de tasa del momento
6. Reportes muestran totales en todas las monedas configuradas

**Postcondiciones**: Venta multi-moneda procesada correctamente

---

## 📦 Requerimientos Funcionales

### RF-001: Autenticación y Autorización

**Prioridad**: Crítica  
**Descripción**: Sistema de login con Firebase Auth, roles y permisos

**Criterios de Aceptación**:

- [ ] Login con email/password
- [ ] Login con Google (OAuth)
- [ ] Recuperación de contraseña
- [ ] Roles: Owner, Admin, Cashier
- [ ] Permisos granulares por módulo
- [ ] Sesión persistente (remember me)
- [ ] Logout seguro

### RF-002: Dashboard Ejecutivo

**Prioridad**: Alta  
**Descripción**: Panel principal con KPIs, gráficos y alertas

**Criterios de Aceptación**:

- [ ] Ventas del día/semana/mes/año
- [ ] Ingresos totales por moneda
- [ ] Productos con bajo stock (alerta visual)
- [ ] Top 10 productos más vendidos
- [ ] Top 10 clientes
- [ ] Gráfico de tendencias de ventas
- [ ] Estado de cuentas por cobrar/pagar
- [ ] Actualización automática cada 30 segundos

### RF-003: Punto de Venta (POS Web)

**Prioridad**: Crítica  
**Descripción**: Pantalla principal para procesamiento rápido de ventas

**Criterios de Aceptación**:

- [ ] Búsqueda de productos (nombre, código, barcode)
- [ ] Escaneo de código de barras con cámara
- [ ] Carrito de compra con cantidades/descuentos
- [ ] Cálculo automático de totales
- [ ] Métodos de pago múltiples
- [ ] Selección de cliente (opcional)
- [ ] Impresión de recibo (PDF)
- [ ] Envío de recibo por email/WhatsApp
- [ ] Atajos de teclado (F2=buscar, F4=pagar, ESC=cancelar)
- [ ] Venta pausada/recuperada

### RF-004: Gestión de Productos

**Prioridad**: Crítica  
**Descripción**: CRUD completo de productos con control de inventario

**Criterios de Aceptación**:

- [ ] Crear/editar/eliminar productos
- [ ] Campos: nombre, código, precio, costo, stock, categoría, proveedor, etc.
- [ ] Soporte multi-moneda en precios
- [ ] Trackeo de inventario (inventariable/no inventariable)
- [ ] Carga masiva de productos (CSV/Excel)
- [ ] Generación de códigos de barras automática
- [ ] Imágenes de productos (almacenadas en Firebase Storage)
- [ ] Historial de cambios de precio

### RF-005: Gestión de Inventario

**Prioridad**: Alta  
**Descripción**: Control de entradas, salidas y movimientos de inventario

**Criterios de Aceptación**:

- [ ] Registro de entradas (compras a proveedores)
- [ ] Registro de salidas (ajustes, mermas, devoluciones)
- [ ] Historial de movimientos por producto
- [ ] Kardex completo
- [ ] Alertas de stock mínimo
- [ ] Reporte de valorización de inventario

### RF-006: Gestión de Ventas

**Prioridad**: Alta  
**Descripción**: Visualización y gestión de todas las ventas

**Criterios de Aceptación**:

- [ ] Lista de ventas con filtros (fecha, cliente, monto, estado)
- [ ] Detalle completo de venta
- [ ] Reimprimir recibo
- [ ] Anular venta (solo admin/owner)
- [ ] Reporte de ventas por período
- [ ] Exportar a Excel/PDF

### RF-007: Gestión de Clientes

**Prioridad**: Media  
**Descripción**: CRUD de clientes con historial de compras

**Criterios de Aceptación**:

- [ ] Crear/editar/eliminar clientes
- [ ] Campos: nombre, documento, teléfono, email, dirección
- [ ] Historial de compras por cliente
- [ ] Cuentas por cobrar por cliente
- [ ] Envío de estados de cuenta por email

### RF-008: Gestión de Proveedores

**Prioridad**: Media  
**Descripción**: CRUD de proveedores con control de compras

**Criterios de Aceptación**:

- [ ] Crear/editar/eliminar proveedores
- [ ] Campos: nombre, RIF/NIT, teléfono, email, contacto
- [ ] Historial de compras a proveedor
- [ ] Cuentas por pagar por proveedor
- [ ] Productos asociados a proveedor

### RF-009: Cuentas por Cobrar

**Prioridad**: Alta  
**Descripción**: Gestión de créditos a clientes

**Criterios de Aceptación**:

- [ ] Registro de ventas a crédito
- [ ] Registro de abonos parciales
- [ ] Cálculo automático de saldo
- [ ] Alertas de cuentas vencidas
- [ ] Reporte de cartera por cliente
- [ ] Estados de cuenta imprimibles

### RF-010: Cuentas por Pagar

**Prioridad**: Alta  
**Descripción**: Gestión de deudas con proveedores

**Criterios de Aceptación**:

- [ ] Registro de compras a crédito
- [ ] Registro de pagos parciales
- [ ] Cálculo automático de saldo
- [ ] Alertas de cuentas por vencer
- [ ] Reporte de deudas por proveedor

### RF-011: Capital y Reportes Financieros

**Prioridad**: Alta  
**Descripción**: Control de flujo de caja y reportes

**Criterios de Aceptación**:

- [ ] Registro de ingresos/egresos
- [ ] Flujo de caja diario/mensual
- [ ] Reporte de utilidades
- [ ] Reporte de rentabilidad por producto
- [ ] Exportación de reportes contables

### RF-012: Tasas de Cambio

**Prioridad**: Alta  
**Descripción**: Gestión automática de tasas de cambio

**Criterios de Aceptación**:

- [ ] Actualización automática desde APIs (BCV, DolarToday)
- [ ] Registro manual de tasas
- [ ] Historial de tasas por fecha
- [ ] Conversión automática en ventas
- [ ] Snapshot de tasa en ventas (histórico confiable)

### RF-013: Configuración de Tienda

**Prioridad**: Media  
**Descripción**: Configuración general del negocio

**Criterios de Aceptación**:

- [ ] Datos de la tienda (nombre, RIF, dirección, logo)
- [ ] Configuración de monedas activas
- [ ] Configuración de impuestos (IVA)
- [ ] Configuración de recibos (encabezado, pie)
- [ ] Configuración de notificaciones
- [ ] Configuración de permisos por rol

### RF-014: Sincronización Multi-dispositivo

**Prioridad**: Crítica  
**Descripción**: Sincronización en tiempo real con tienda-app

**Criterios de Aceptación**:

- [ ] Sincronización bidireccional con Firebase
- [ ] Actualización en tiempo real (WebSockets)
- [ ] Resolución de conflictos
- [ ] Modo offline con queue de sincronización
- [ ] Indicador de estado de sincronización

### RF-015: Impresión y Exportación

**Prioridad**: Media  
**Descripción**: Generación de documentos imprimibles

**Criterios de Aceptación**:

- [ ] Recibos de venta (PDF)
- [ ] Reportes de inventario (Excel, PDF)
- [ ] Estados de cuenta (PDF)
- [ ] Etiquetas de productos (PDF con códigos de barras)
- [ ] Facturas (si aplica)

---

## 📐 Requerimientos No Funcionales

### RNF-001: Rendimiento

- Carga inicial de la aplicación: < 3 segundos
- Procesamiento de venta: < 500ms
- Búsqueda de productos: < 200ms
- Actualización de dashboard: < 1s
- Soporte para 10,000+ productos sin degradación

### RNF-002: Disponibilidad

- Disponibilidad: 99.5% (permite mantenimiento planificado)
- Modo offline funcional (con SQLite local o IndexedDB)
- Sincronización automática al recuperar conexión

### RNF-003: Seguridad

- Autenticación con Firebase Auth
- Comunicación HTTPS obligatoria
- Tokens JWT con expiración
- Validación de permisos en cada operación
- Logs de auditoría para operaciones críticas
- No almacenar contraseñas en localStorage

### RNF-004: Usabilidad

- Interfaz intuitiva, sin capacitación requerida
- Atajos de teclado para operaciones frecuentes
- Responsive design (desktop, tablet)
- Tiempo de aprendizaje < 30 minutos para cajeros
- Mensajes de error claros y accionables

### RNF-005: Compatibilidad

- Navegadores: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Resoluciones: desde 1366x768 hasta 4K
- Sincronización con tienda-app (React Native)

### RNF-006: Escalabilidad

- Soportar hasta 100 usuarios concurrentes
- Base de datos con 100,000+ registros de ventas
- 10,000+ productos
- 5,000+ clientes

### RNF-007: Mantenibilidad

- Código documentado
- Arquitectura modular
- Tests unitarios (cobertura > 70%)
- Tests E2E para flujos críticos

---

## 🛠️ Stack Tecnológico Propuesto

### Frontend

**Opción Recomendada**: Next.js 14+ (App Router)

- **Framework**: Next.js 14+ con React 18+
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado Global**: Zustand o Jotai
- **Formularios**: React Hook Form + Zod
- **Tablas**: TanStack Table (React Table v8)
- **Gráficos**: Recharts o Chart.js
- **Notificaciones**: React Hot Toast
- **Modales**: Radix UI
- **Iconos**: Lucide React

### Backend/Persistencia

**Opción 1 (Recomendada)**: Firebase (paridad con tienda-app)

- **Auth**: Firebase Auth
- **Base de datos**: Firestore (sincronización real-time)
- **Storage**: Firebase Storage (imágenes)
- **Hosting**: Vercel o Firebase Hosting

**Opción 2**: Backend propio

- **API**: Next.js API Routes o Express.js
- **Base de datos**: PostgreSQL + Prisma
- **Cache**: Redis
- **Storage**: AWS S3 o Cloudinary

### Herramientas

- **Gestión de estado**: Zustand (simple y performante)
- **Validación**: Zod (schemas compartidos con backend)
- **HTTP**: Axios o fetch nativo
- **Fechas**: date-fns
- **PDF**: jsPDF o react-pdf
- **Excel**: xlsx
- **Códigos de barras**: react-barcode
- **Cámara (barcode)**: html5-qrcode

---

## 📊 Modelo de Datos

El modelo de datos debe ser compatible con tienda-app para permitir sincronización.

### Entidades Principales

```typescript
// Usuario
interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'cashier';
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tienda
interface Store {
  id: string;
  name: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  currencies: string[]; // ['VES', 'USD', 'EUR']
  defaultCurrency: string;
  taxRate: number; // IVA
  createdAt: Date;
  updatedAt: Date;
}

// Producto
interface Product {
  id: string;
  storeId: string;
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  category: string;

  // Precios multi-moneda
  prices: {
    VES?: number;
    USD?: number;
    EUR?: number;
  };

  cost: number;
  costCurrency: string;

  stock: number;
  stockMin: number;
  trackInventory: boolean;

  supplierId?: string;
  imageUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Venta
interface Sale {
  id: string;
  storeId: string;
  saleNumber: string; // Autoincremental por tienda

  customerId?: string;
  cashierId: string;

  items: SaleItem[];

  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  currency: string;
  exchangeRateSnapshot: {
    [currency: string]: number;
  };

  paymentMethod: 'cash' | 'card' | 'transfer' | 'credit';
  paymentStatus: 'paid' | 'pending' | 'partial';

  status: 'completed' | 'cancelled';

  createdAt: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancelReason?: string;
}

interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

// Cliente
interface Customer {
  id: string;
  storeId: string;
  name: string;
  document: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
  balance: number; // Por cobrar
  createdAt: Date;
  updatedAt: Date;
}

// Proveedor
interface Supplier {
  id: string;
  storeId: string;
  name: string;
  rif: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  balance: number; // Por pagar
  createdAt: Date;
  updatedAt: Date;
}

// Movimiento de Inventario
interface InventoryMovement {
  id: string;
  storeId: string;
  productId: string;
  type: 'entry' | 'exit' | 'adjustment' | 'sale';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reference?: string; // ID de venta, compra, etc.
  notes?: string;
  userId: string;
  createdAt: Date;
}

// Tasa de Cambio
interface ExchangeRate {
  id: string;
  currency: string;
  rate: number; // Tasa con respecto a moneda base
  source: 'manual' | 'bcv' | 'api';
  createdAt: Date;
}
```

---

## 🎨 Especificaciones de UI/UX

### Principios de Diseño

1. **Claridad**: Información clara y visible
2. **Eficiencia**: Mínimos clics para tareas frecuentes
3. **Consistencia**: Patrones visuales uniformes
4. **Feedback**: Respuesta inmediata a acciones
5. **Accesibilidad**: Contraste adecuado, navegación por teclado

### Paleta de Colores

```
Primario: #3b82f6 (blue-500)
Secundario: #8b5cf6 (violet-500)
Éxito: #10b981 (green-500)
Advertencia: #f59e0b (amber-500)
Error: #ef4444 (red-500)
Neutral: #64748b (slate-500)
```

### Layout Principal

```
┌─────────────────────────────────────────────────────┐
│  Logo   [Dashboard] [POS] [Productos] ...   User   │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │          Main Content Area              │
│          │                                          │
│ - Inicio │                                          │
│ - POS    │                                          │
│ - Ventas │                                          │
│ - Produc │                                          │
│ - Client │                                          │
│ - Prov   │                                          │
│ - Invent │                                          │
│ - Report │                                          │
│ - Config │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### Pantallas Principales

#### 1. Dashboard

- KPIs en cards (ventas, ingresos, stock bajo, clientes)
- Gráfico de ventas (líneas, últimos 30 días)
- Top productos (tabla)
- Alertas (cuentas vencidas, stock bajo)

#### 2. POS

- Split screen: Búsqueda/Catálogo | Carrito
- Búsqueda con autocompletado
- Grid de productos populares
- Carrito con totales en tiempo real
- Panel de pago con métodos

#### 3. Productos

- Tabla con filtros, búsqueda, ordenamiento
- Columnas: Código, Nombre, Categoría, Precio, Stock, Acciones
- Modal de crear/editar producto
- Importación CSV

#### 4. Ventas

- Tabla de ventas con filtros por fecha, cliente, estado
- Columnas: #, Fecha, Cliente, Total, Estado, Acciones
- Detalle de venta en modal
- Reimprimir recibo

---

## 🔄 Flujos de Usuario Detallados

### Flujo 1: Primera Configuración (Onboarding)

```
1. Usuario se registra (email/password o Google)
2. Sistema crea usuario en Firebase Auth
3. Se muestra wizard de configuración:
   a. Datos de la tienda
   b. Monedas a usar
   c. Crear primer producto (opcional)
4. Sistema crea Store en Firestore
5. Redirecciona a Dashboard
```

### Flujo 2: Venta Rápida en POS

```
1. Cajero accede a POS
2. Busca producto "Laptop" (escribe en búsqueda)
3. Selecciona "Laptop HP 15" de resultados
4. Producto se agrega al carrito (cantidad: 1)
5. Cajero modifica cantidad a 2
6. Busca otro producto "Mouse"
7. Agrega "Mouse Logitech" al carrito
8. Total se calcula automáticamente
9. Cajero presiona "Procesar Venta" (o F4)
10. Selecciona método de pago: Efectivo
11. Ingresa monto recibido
12. Sistema calcula cambio
13. Cajero confirma
14. Sistema:
    - Registra venta en Firestore
    - Actualiza stock de ambos productos
    - Registra movimientos de inventario
    - Genera PDF de recibo
15. Muestra recibo en pantalla
16. Opciones: Imprimir, Enviar por email, Enviar por WhatsApp, Nueva venta
```

### Flujo 3: Gestión de Inventario

```
1. Admin accede a "Inventario"
2. Ve lista de movimientos con filtros
3. Presiona "Nueva Entrada"
4. Modal se abre
5. Selecciona tipo: "Compra a Proveedor"
6. Selecciona proveedor de lista
7. Agrega productos:
   - Laptop HP 15: 10 unidades a $400 c/u
   - Mouse Logitech: 50 unidades a $20 c/u
8. Total calculado: $8000
9. Confirma entrada
10. Sistema:
    - Actualiza stock de productos
    - Registra movimientos de inventario
    - Actualiza cuenta por pagar al proveedor
11. Muestra confirmación
```

---

## 🔗 Integraciones

### Integración 1: Firebase

- **Propósito**: Auth, sincronización, storage
- **Endpoints**: Firebase SDK
- **Datos**: Users, Stores, Products, Sales, Customers, etc.

### Integración 2: API de Tasas de Cambio

- **Propósito**: Obtener tasas actualizadas
- **Opciones**:
  - BCV (Banco Central de Venezuela)
  - DolarToday
  - ExchangeRate-API.com
- **Frecuencia**: 1 vez al día (6:00 AM)

### Integración 3: WhatsApp Business API

- **Propósito**: Envío de recibos por WhatsApp
- **Implementación**: Twilio o WhatsApp Cloud API
- **Formato**: Link a recibo PDF

### Integración 4: Email (Opcional)

- **Propósito**: Envío de recibos y estados de cuenta
- **Servicio**: SendGrid o Resend
- **Formato**: PDF adjunto

---

## 🚀 Plan de Fases

### Fase 1: Fundación (Semana 1-2)

**Objetivos**: Setup del proyecto, autenticación, layout base

**Entregables**:

- [ ] Proyecto Next.js configurado con TypeScript
- [ ] Tailwind CSS + shadcn/ui instalado
- [ ] Firebase configurado (Auth + Firestore)
- [ ] Layout principal (sidebar, header, content)
- [ ] Sistema de autenticación (login, registro, logout)
- [ ] Protección de rutas por rol
- [ ] Dashboard básico (sin datos reales aún)

**Stack Decisión**:

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Firebase (Auth + Firestore)
- Zustand (estado global)

### Fase 2: Módulo POS y Productos (Semana 3-4)

**Objetivos**: Funcionalidad core de venta

**Entregables**:

- [ ] CRUD de productos completo
- [ ] Pantalla POS funcional
- [ ] Carrito de compra
- [ ] Procesamiento de ventas
- [ ] Actualización de inventario
- [ ] Generación de recibos (PDF)

### Fase 3: Inventario y Movimientos (Semana 5)

**Objetivos**: Control de inventario

**Entregables**:

- [ ] Registro de entradas de inventario
- [ ] Registro de salidas de inventario
- [ ] Historial de movimientos
- [ ] Alertas de stock bajo
- [ ] Kardex por producto

### Fase 4: Clientes y Proveedores (Semana 6)

**Objetivos**: Gestión de relaciones

**Entregables**:

- [ ] CRUD de clientes
- [ ] CRUD de proveedores
- [ ] Historial de compras por cliente
- [ ] Historial de compras a proveedor

### Fase 5: Cuentas por Cobrar/Pagar (Semana 7)

**Objetivos**: Control financiero

**Entregables**:

- [ ] Gestión de créditos a clientes
- [ ] Registro de abonos
- [ ] Gestión de deudas con proveedores
- [ ] Registro de pagos
- [ ] Reportes de cartera

### Fase 6: Reportes y Dashboard Final (Semana 8)

**Objetivos**: Analytics e insights

**Entregables**:

- [ ] Dashboard completo con KPIs reales
- [ ] Gráficos de ventas
- [ ] Reportes de inventario
- [ ] Reportes financieros
- [ ] Exportación a Excel/PDF

### Fase 7: Features Avanzados (Semana 9-10)

**Objetivos**: Funcionalidades premium

**Entregables**:

- [ ] Multi-moneda completo
- [ ] Tasas de cambio automáticas
- [ ] Impresión nativa
- [ ] Atajos de teclado
- [ ] Modo oscuro
- [ ] PWA (offline support)

---

## ✅ Criterios de Aceptación Globales

### Funcionales

- [ ] Usuario puede registrarse y autenticarse
- [ ] Usuario puede procesar ventas completas
- [ ] Usuario puede gestionar productos (CRUD)
- [ ] Usuario puede gestionar inventario (entradas/salidas)
- [ ] Usuario puede gestionar clientes y proveedores
- [ ] Usuario puede ver dashboard con datos reales
- [ ] Sistema actualiza inventario automáticamente en ventas
- [ ] Sistema sincroniza con tienda-app vía Firebase

### No Funcionales

- [ ] Carga inicial < 3s
- [ ] Procesamiento de venta < 500ms
- [ ] Sin errores críticos en consola
- [ ] Responsive en desktop (1366x768+)
- [ ] Tests E2E de flujos críticos (login, venta)
- [ ] Código TypeScript sin `any`
- [ ] Documentación de componentes principales

---

## 📝 Notas y Consideraciones

### Decisiones Técnicas

1. **¿Por qué Next.js sobre Vite/CRA?**
   - SEO mejorado (aunque es app privada)
   - Server Components para reducir bundle
   - API Routes integradas
   - Mejor DX y ecosistema

2. **¿Por qué Firebase sobre backend propio?**
   - Paridad con tienda-app
   - Real-time sync sin WebSockets manuales
   - Auth out-of-the-box
   - Menor tiempo de desarrollo Fase 1

3. **¿Por qué Zustand sobre Redux?**
   - Más simple y menos boilerplate
   - Mejor performance
   - TypeScript de primera clase

### Riesgos Identificados

1. **Sincronización bidireccional compleja**
   - Mitigación: Usar timestamps y resolución de conflictos "last write wins"

2. **Offline support en web es limitado**
   - Mitigación: IndexedDB + service workers (PWA)

3. **Compatibilidad de datos entre SQLite (móvil) y Firestore (web)**
   - Mitigación: Estructura de datos idéntica, Firebase como fuente de verdad

4. **Rendimiento con 10,000+ productos**
   - Mitigación: Paginación, virtualización de listas, índices en Firestore

---

## 🎯 Próximos Pasos

1. **Planificador** debe crear plan detallado de Fase 1
2. **Programador Senior** debe implementar Fase 1
3. Reunión de revisión post-Fase 1
4. Ajustes y continuar con Fase 2

---

**Fin de Especificación**

**Aprobado por**: analista-requerimientos agent  
**Fecha**: 2026-07-31  
**Versión**: 1.0
