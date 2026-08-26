# FEATURE-002: Módulo de Ventas Web

**Proyecto**: tienda-web  
**Referencia**: tienda-app (móvil)  
**Fecha**: 2026-08-25  
**Estado**: En especificación  
**Prioridad**: CRÍTICA

---

## 1. Resumen Ejecutivo

### 1.1 Visión General

Implementar el módulo completo de **Punto de Venta (POS)** para la versión web de tienda-app, aprovechando el espacio adicional de pantalla para mejorar la experiencia del cajero y aumentar la productividad en operaciones de venta.

### 1.2 Diferenciadores Clave vs Versión Móvil

| Aspecto         | Móvil (tienda-app)         | Web (tienda-web)                   |
| --------------- | -------------------------- | ---------------------------------- |
| **Layout**      | Vertical, scrollable       | Split-screen (50/50)               |
| **Carrito**     | Modal full-screen          | Panel lateral fijo (mitad derecha) |
| **Búsqueda**    | Teclado táctil             | Teclado físico + atajos            |
| **Clientes**    | Nombre solamente           | Nombre + Teléfono + Dirección      |
| **Navegación**  | Touch + gestos             | Teclado + mouse                    |
| **Formularios** | Mínimos (espacio limitado) | Completos (aprovechando espacio)   |

### 1.3 Objetivos del Feature

1. **Velocidad**: Reducir tiempo promedio de venta de 90s a 45s
2. **Precisión**: Eliminar errores de selección de producto/cliente
3. **Trazabilidad**: Registro completo de cada transacción
4. **Multi-moneda**: Soporte nativo para VES/USD/EUR con tasas actualizadas
5. **Cuentas por cobrar**: Generación automática al elegir método "Por Cobrar"

---

## 2. Análisis del Código Base (tienda-app)

### 2.1 Componentes Principales Identificados

#### POSScreen.js (~2733 líneas)

**Responsabilidades**:

- Búsqueda y listado de productos
- Gestión del carrito de compra
- Modal de carrito con resumen
- Selección de método de pago
- Validación de cliente
- Creación rápida de clientes durante venta
- Finalización de venta con actualización de stock
- Generación automática de cuenta por cobrar

**Estados clave**:

```javascript
- cart: Array de items { id, name, price, localPrice, referencePrice, quantity, subtotal, iva, product }
- customerDocument: string (cédula del cliente, "1" = genérico)
- paymentMethod: "cash" | "card" | "transfer" | "pago_movil" | "por_cobrar"
- referenceNumber: string (referencia de pago bancario)
- exchangeRate: number (tasa USD/VES activa)
- localCurrency: "VES" | "USD" | "EUR"
- referenceCurrency: "VES" | "USD" | "EUR"
```

**Cálculos**:

```javascript
subtotalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
taxAmount = applyIvaOnSales
  ? cart.reduce((sum, item) => sum + item.subtotal * (item.iva / 100), 0)
  : 0;
total = subtotalAmount + taxAmount;
totalReference = (total / exchangeRate).toFixed(2); // Si rateEnabled
```

#### SalesScreen.js

**Responsabilidades**:

- Listado de ventas con filtros de fecha
- Visualización de totales del día/período
- Navegación a detalle de venta
- Cancelación de ventas

#### SaleDetailScreen.js (inferido)

**Responsabilidades**:

- Detalle completo de venta
- Items vendidos con cantidades y precios
- Información del cliente
- Método de pago y referencia
- Estado de la venta (completed, cancelled)

### 2.2 Servicios de Base de Datos

#### sales.js

**Funciones principales**:

```javascript
getAllSales(limit = 100): Sale[]
getSaleById(saleId): Sale
insertSale(saleData, saleItems): { id, saleNumber }
getTodaySales(): { count, total }
cancelSale(saleId): void
```

**Estructura de Sale**:

```javascript
{
  id: number,
  customerId: number,
  subtotal: number,
  tax: number,
  discount: number,
  total: number,
  currency: "VES" | "USD" | "EUR",
  localCurrency: string,
  referenceCurrency: string,
  exchangeRate: number,
  paymentMethod: string,
  paid: number,
  change: number,
  status: "completed" | "cancelled",
  notes: string,
  createdAt: timestamp,
  saleNumber: string  // Formato: "VTA-000001"
}
```

**Estructura de SaleItem**:

```javascript
{
  saleId: number,
  productId: number,
  productName: string,
  quantity: number,
  price: number,
  localPrice: number,
  referencePrice: number,
  referenceAmount: number,
  subtotal: number,
  subtotalLocal: number,
  subtotalReference: number,
  priceSnapshot: JSON  // { localCurrency, referenceCurrency, localAmount, referenceAmount, exchangeRate }
}
```

### 2.3 Flujo de Venta Identificado

```mermaid
graph TD
    A[Inicio POS] --> B{¿Productos en stock?}
    B -- No --> C[Mostrar empty state]
    B -- Sí --> D[Mostrar catálogo de productos]

    D --> E[Cajero busca/selecciona producto]
    E --> F[Agregar al carrito]
    F --> G{¿Más productos?}
    G -- Sí --> E
    G -- No --> H[Abrir carrito]

    H --> I[Revisar items y totales]
    I --> J[Ingresar cédula de cliente]
    J --> K{¿Cliente existe?}

    K -- "1" --> L[Cliente genérico OK]
    K -- Existe --> M[Cargar datos de cliente]
    K -- No existe --> N[Modal: Crear cliente rápido]

    N --> O[Ingresar nombre + teléfono + dirección]
    O --> P[Guardar cliente nuevo]
    P --> M

    L --> Q[Seleccionar método de pago]
    M --> Q

    Q --> R{¿Método = "Por Cobrar"?}
    R -- Sí --> S{¿Es cliente genérico?}
    S -- Sí --> T[ERROR: No permitido]
    S -- No --> U[Continuar]

    R -- No --> U
    T --> Q

    U --> V[Ingresar referencia si aplica]
    V --> W[Confirmar venta]

    W --> X[Guardar venta en DB]
    X --> Y[Actualizar stock de productos]
    Y --> Z{¿Método = "Por Cobrar"?}

    Z -- Sí --> AA[Crear cuenta por cobrar automática]
    Z -- No --> AB[Fin exitoso]
    AA --> AB

    AB --> AC[Limpiar carrito]
    AC --> AD[Mostrar confirmación]
    AD --> A
```

---

## 3. Requerimientos Funcionales

### RF-001: Pantalla Principal POS (Split-Screen)

**Prioridad**: CRÍTICA

**Descripción**:  
Diseñar una vista split-screen donde el lado izquierdo (50%) muestra el catálogo de productos con búsqueda, y el lado derecho (50%) muestra el carrito activo con resumen de venta.

**Criterios de Aceptación**:

- ✅ Layout responsivo 50/50 en desktop (>1024px)
- ✅ En tablet/móvil, mantener comportamiento modal del carrito
- ✅ Barra de búsqueda fija en la parte superior izquierda
- ✅ Catálogo de productos scrollable a la izquierda
- ✅ Carrito fijo a la derecha con scroll independiente
- ✅ Totales siempre visibles en footer del carrito (sticky)

**Wireframe Textual**:

```
┌─────────────────────────────────────────────────────────────┐
│ PUNTO DE VENTA                                     [Usuario] │
├────────────────────────────────┬────────────────────────────┤
│ CATÁLOGO                       │ CARRITO (3 items)          │
│                                │                            │
│ [🔍 Buscar producto...]  [📷]  │ Cliente: [____________] 🔍 │
│                                │ Cédula: 12345678           │
│ ┌───────────────────────────┐  │ Nombre: Juan Pérez         │
│ │ ACEITE MOBIL 1 5W30       │  │ Teléfono: 0414-1234567    │
│ │ Código: PROD-001          │  │                            │
│ │ Precio: 15.00 USD         │  │ ───────────────────────    │
│ │ Stock: 25 unds            │  │ [Aceite Mobil] x2  30 USD  │
│ │         [+ Agregar]       │  │ [Filtro de aire] x1 5 USD  │
│ └───────────────────────────┘  │ [Bujías NGK] x4    20 USD  │
│                                │                            │
│ ┌───────────────────────────┐  │ ───────────────────────    │
│ │ FILTRO DE AIRE K&N        │  │ Subtotal:       55.00 USD  │
│ │ Código: PROD-002          │  │ IVA (16%):       8.80 USD  │
│ │ Precio: 5.00 USD          │  │ ═════════════════════════  │
│ │ Stock: 10 unds            │  │ TOTAL:          63.80 USD  │
│ │         [+ Agregar]       │  │ (2,932.70 VES)            │
│ └───────────────────────────┘  │                            │
│                                │ Método de Pago:            │
│ [Ver más productos...]         │ ○ Efectivo  ○ Transferencia│
│                                │ ○ Pago Móvil ⦿ Por Cobrar  │
│                                │                            │
│                                │ Referencia: [_________]    │
│                                │                            │
│                                │ [Limpiar]  [🛒 Completar]  │
└────────────────────────────────┴────────────────────────────┘
```

---

### RF-002: Búsqueda de Productos

**Prioridad**: ALTA

**Descripción**:  
Permitir búsqueda rápida de productos por nombre, código de barras o categoría, con filtros adicionales y soporte para escáner de códigos de barras.

**Criterios de Aceptación**:

- ✅ Input de búsqueda con debounce de 300ms
- ✅ Búsqueda por nombre (case-insensitive, sin tildes)
- ✅ Búsqueda por código de barras exacto
- ✅ Filtro por categoría (dropdown)
- ✅ Mostrar solo productos con stock > 0 (configurable)
- ✅ Destacar productos sin stock visualmente (disabled)
- ✅ Botón para abrir cámara/escáner QR (modal)
- ✅ Atajo de teclado: Ctrl+F para enfocar búsqueda

**Validaciones**:

- Si búsqueda no retorna resultados, mostrar mensaje "No se encontraron productos"
- Si búsqueda por código exacto encuentra 1 solo producto, agregar automáticamente al carrito

---

### RF-003: Catálogo de Productos

**Prioridad**: CRÍTICA

**Descripción**:  
Listar productos disponibles con información de precio, stock, categoría y acción rápida para agregar al carrito.

**Criterios de Aceptación**:

- ✅ Grid de productos (2 columnas en desktop, 1 en móvil)
- ✅ Cada card muestra: Nombre, Código, Precio (VES/USD/EUR según tasa), Stock
- ✅ Indicador visual de stock bajo (stock < 5: ⚠️ amarillo)
- ✅ Productos sin stock (stock = 0) deshabilitados y grises
- ✅ Click en card agrega 1 unidad al carrito
- ✅ Botón "+ Agregar" explícito en cada card
- ✅ Ordenamiento por código de barras ascendente (PROD-001, PROD-002...)
- ✅ Paginación si hay > 50 productos

**Cálculo de Precios**:

```javascript
// Si tasa de cambio está activa:
priceVES = product.localPrice  // Precio en moneda local configurada
priceUSD = product.referencePrice  // Precio de referencia (USD normalmente)
priceEUR = priceUSD * (usdToEur)  // Conversión si aplica

// Si tasa de cambio NO está activa:
Mostrar solo priceVES
```

---

### RF-004: Carrito de Compra (Panel Derecho)

**Prioridad**: CRÍTICA

**Descripción**:  
Panel fijo en la mitad derecha de la pantalla que muestra los items agregados, permite modificar cantidades, remover items, y ver el resumen de venta en tiempo real.

**Criterios de Aceptación**:

- ✅ Lista scrollable de items agregados
- ✅ Cada item muestra: Nombre, Cantidad (editable), Precio unitario, Subtotal
- ✅ Input numérico para cantidad (min: 0.001, max: 9999, decimales permitidos)
- ✅ Botón "🗑️" para remover item
- ✅ Cambio de cantidad recalcula subtotal instantáneamente
- ✅ Si cantidad = 0, remover item automáticamente
- ✅ Sección de totales fija en el footer (sticky):
  - Subtotal (suma de subtotales de items)
  - IVA (si `applyIvaOnSales` = true, calcular por item según su `iva`)
  - TOTAL (subtotal + IVA)
  - TOTAL en moneda de referencia (si tasa activa)
- ✅ Botón "Limpiar" que vacía el carrito con confirmación
- ✅ Botón "🛒 Completar Venta" habilitado solo si cart.length > 0

**Cálculo de Totales**:

```javascript
subtotalAmount = cart.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);

taxAmount = pricingSettings.applyIvaOnSales
  ? cart.reduce(
      (sum, item) => sum + item.price * item.quantity * (item.iva / 100),
      0
    )
  : 0;

total = subtotalAmount + taxAmount;

totalReference =
  exchangeRate > 0 && rateEnabled ? (total / exchangeRate).toFixed(2) : null;
```

---

### RF-005: Gestión de Cliente en Venta

**Prioridad**: CRÍTICA

**Descripción**:  
Permitir al cajero seleccionar un cliente existente, crear uno nuevo rápidamente, o usar el cliente genérico para ventas rápidas.

**Criterios de Aceptación**:

- ✅ Input de cédula con placeholder "Cédula del cliente (1 = genérico)"
- ✅ Si cédula = "1", mostrar badge "Cliente Genérico" y deshabilitar método "Por Cobrar"
- ✅ Si cédula != "1", buscar cliente en DB:
  - Si existe: Cargar automáticamente Nombre, Teléfono, Dirección
  - Si no existe: Mostrar mensaje "Cliente no encontrado. [Crear Nuevo]"
- ✅ Botón "🔍" al lado del input de cédula para abrir modal de búsqueda
- ✅ Modal de búsqueda muestra lista de todos los clientes con filtro por nombre/cédula
- ✅ Click en cliente de la lista auto-completa los datos
- ✅ Validación antes de finalizar venta: customerDocument debe estar especificado

**Modal de Creación Rápida de Cliente**:

- Campo: Cédula (readonly, viene pre-llenado)
- Campo: Nombre (required)
- Campo: Teléfono (optional, formato: +58 414-1234567)
- Campo: Dirección (optional, textarea)
- Botón: "Cancelar" (cierra modal sin crear)
- Botón: "Crear y Vender" (crea cliente, cierra modal, completa venta)

**Validaciones**:

- Nombre mínimo 3 caracteres
- Cédula única (no duplicados)
- Teléfono formato válido si se especifica

---

### RF-006: Métodos de Pago

**Prioridad**: CRÍTICA

**Descripción**:  
Permitir seleccionar el método de pago utilizado en la venta, con validaciones específicas según el método.

**Opciones Disponibles**:

1. **Efectivo** (`cash`)
   - Icono: 💵
   - No requiere referencia

2. **Tarjeta** (`card`)
   - Icono: 💳
   - Requiere referencia (número de transacción)

3. **Transferencia** (`transfer`)
   - Icono: 🏦
   - Requiere referencia (número de referencia bancaria)

4. **Pago Móvil** (`pago_movil`)
   - Icono: 📱
   - Requiere referencia (número de referencia)

5. **Por Cobrar** (`por_cobrar`)
   - Icono: ⏱️
   - NO requiere referencia
   - NO disponible para cliente genérico (cédula = "1")
   - Genera automáticamente cuenta por cobrar

**Criterios de Aceptación**:

- ✅ Radio buttons para selección única
- ✅ Método por defecto: "Efectivo"
- ✅ Si método requiere referencia, mostrar input de referencia (obligatorio)
- ✅ Si cliente = genérico y método = "Por Cobrar", mostrar error y bloquear
- ✅ Guardar método seleccionado en registro de venta
- ✅ Tooltip explicativo en "Por Cobrar": "Se creará automáticamente una cuenta por cobrar para este cliente"

**Validaciones**:

```javascript
if (paymentMethod === 'por_cobrar' && customerDocument === '1') {
  ERROR: 'El cliente genérico no puede tener cuentas por cobrar';
}

if (
  ['card', 'transfer', 'pago_movil'].includes(paymentMethod) &&
  !referenceNumber.trim()
) {
  ERROR: 'Debe especificar el número de referencia';
}
```

---

### RF-007: Finalización de Venta

**Prioridad**: CRÍTICA

**Descripción**:  
Proceso de confirmación y registro de la venta con todas sus implicaciones: actualización de stock, generación de consecutivo, creación de cuenta por cobrar si aplica.

**Flujo Detallado**:

1. **Pre-validaciones**:

```javascript
✅ cart.length > 0
✅ customerDocument.trim() !== ""
✅ Si paymentMethod = "por_cobrar" → customerDocument !== "1"
✅ Si método requiere referencia → referenceNumber.trim() !== ""
```

2. **Resolución de Cliente**:

```javascript
if (customerDocument === '1') {
  customerId = await ensureGenericCustomer(); // Crear si no existe
  customerName = 'Cliente Genérico';
} else {
  customer = await getCustomerByDocument(customerDocument);
  if (customer) {
    customerId = customer.id;
    customerName = customer.name;
  } else {
    // Abrir modal de creación rápida
    showNewCustomerModal = true;
    return; // Pausar hasta que se cree el cliente
  }
}
```

3. **Preparación de Datos**:

```javascript
saleData = {
  customerId: customerId,
  subtotal: subtotalAmount,
  tax: taxAmount,
  discount: 0, // Futuro: descuentos
  total: total,
  currency: localCurrency,
  localCurrency: localCurrency,
  referenceCurrency: referenceCurrency,
  exchangeRate: exchangeRate,
  paymentMethod: paymentMethod,
  paid: total, // Asumimos pago completo
  change: 0,
  status: 'completed',
  notes: `Cliente: ${customerName}${referenceNumber ? ` - Ref: ${referenceNumber}` : ''}`,
  createdAt: new Date(),
};

saleItems = cart.map((item) => ({
  productId: item.product.id,
  productName: item.name,
  quantity: item.quantity,
  price: item.localPrice,
  localPrice: item.localPrice,
  referencePrice: item.referencePrice,
  referenceAmount: item.referencePrice,
  subtotal: item.subtotal,
  subtotalLocal: item.subtotal,
  subtotalReference: item.quantity * item.referencePrice,
  priceSnapshot: JSON.stringify({
    localCurrency: localCurrency,
    referenceCurrency: referenceCurrency,
    localAmount: item.localPrice,
    referenceAmount: item.referencePrice,
    exchangeRate: exchangeRate,
    source: 'sale',
  }),
}));
```

4. **Registro en Base de Datos** (Transacción):

```javascript
transaction {
  // 1. Insertar venta
  saleResult = await insertSale(saleData, saleItems)
  saleId = saleResult.id
  saleNumber = saleResult.saleNumber  // Ej: "VTA-000123"

  // 2. Actualizar stock de productos
  for (item of cart) {
    if (item.product.trackInventory === 1) {
      newStock = item.product.stock - item.quantity
      await updateProductStock(item.product.id, newStock)

      await insertInventoryMovement({
        productId: item.product.id,
        type: "exit",
        quantity: item.quantity,
        previousStock: item.product.stock,
        notes: `${saleNumber} - ${customerName} - ${paymentMethod}`
      })
    }
  }

  // 3. Crear cuenta por cobrar si aplica
  if (paymentMethod === "por_cobrar") {
    await addAccountReceivable({
      customerId: customerId,
      customerName: customerName,
      documentNumber: customerDocument,
      amount: total,
      baseCurrency: referenceCurrency,
      referenceAmount: totalReference,
      exchangeRateAtCreation: exchangeRate,
      description: `Venta a crédito - ${cart.length} producto(s)`,
      dueDate: null,  // Sin vencimiento por defecto
      invoiceNumber: saleNumber,
      status: "pending",
      createdAt: new Date()
    })
  }
}
```

5. **Post-Venta**:

```javascript
// Limpiar carrito
setCart([]);
setCustomerDocument('');
setReferenceNumber('');
setPaymentMethod('cash');

// Mostrar confirmación
showAlert({
  title: 'Venta completada',
  message:
    paymentMethod === 'por_cobrar'
      ? `Total: ${formatCurrency(total, localCurrency)}\nCliente: ${customerName}\n\n✅ Cuenta por cobrar creada automáticamente`
      : `Total: ${formatCurrency(total, localCurrency)}\nCliente: ${customerName}\n\n✅ Venta registrada exitosamente`,
  type: 'success',
});

// Opcional: Imprimir ticket
if (userSettings.autoPrintTicket) {
  printSaleTicket(saleId);
}

// Recargar productos para actualizar stock visual
refreshProducts();
```

**Criterios de Aceptación**:

- ✅ Toda la operación es transaccional (rollback si falla algún paso)
- ✅ Consecutivo de venta se genera automáticamente (VTA-XXXXXX)
- ✅ Stock se actualiza en tiempo real
- ✅ Movimiento de inventario se registra con detalle
- ✅ Cuenta por cobrar se genera automáticamente si método = "por_cobrar"
- ✅ Mensaje de confirmación muestra total y método usado
- ✅ Carrito se limpia después de venta exitosa
- ✅ Usuario puede iniciar nueva venta inmediatamente

**Manejo de Errores**:

```javascript
try {
  // Proceso de venta...
} catch (error) {
  if (error.code === 'INSUFFICIENT_STOCK') {
    showAlert('Error: Algunos productos no tienen stock suficiente');
  } else if (error.code === 'DUPLICATE_CUSTOMER') {
    showAlert('Error: Ya existe un cliente con esa cédula');
  } else if (error.code === 'DATABASE_ERROR') {
    showAlert('Error: No se pudo guardar la venta. Intente nuevamente.');
  } else {
    showAlert('Error inesperado. Contacte al administrador.');
  }

  // NO limpiar carrito en caso de error
  // Permitir reintentar
}
```

---

### RF-008: Historial de Ventas

**Prioridad**: ALTA

**Descripción**:  
Pantalla separada para visualizar todas las ventas registradas, con filtros por fecha, cliente, método de pago y estado.

**Criterios de Aceptación**:

- ✅ Tabla/Grid con columnas: Número, Fecha/Hora, Cliente, Total, Método, Estado, Acciones
- ✅ Filtro por rango de fechas (desde/hasta)
- ✅ Filtro por cliente (autocompletado)
- ✅ Filtro por método de pago (dropdown)
- ✅ Filtro por estado: Completada, Cancelada
- ✅ Botón "Ver Detalle" en cada fila
- ✅ Botón "Cancelar Venta" (solo si estado = completada, con confirmación)
- ✅ Exportar a Excel/PDF (futuro)
- ✅ Paginación (20 ventas por página)
- ✅ Ordenamiento por fecha descendente (más recientes primero)

**Vista de Detalle de Venta**:
Modal o página separada que muestra:

```
┌─────────────────────────────────────────────────┐
│ VENTA VTA-000123                       [Cerrar] │
├─────────────────────────────────────────────────┤
│ Fecha: 25/08/2026 14:35:22                      │
│ Cliente: Juan Pérez (V-12345678)                │
│ Teléfono: 0414-1234567                          │
│ Dirección: Av. Principal, Caracas               │
│                                                 │
│ Método de Pago: Transferencia                   │
│ Referencia: 1234567890                          │
│ Estado: ✅ Completada                           │
│                                                 │
│ ───────────────────────────────────────────────│
│ ITEMS VENDIDOS:                                 │
│                                                 │
│ 1. Aceite Mobil 1 5W30                          │
│    x2 @ 15.00 USD = 30.00 USD                   │
│                                                 │
│ 2. Filtro de aire K&N                           │
│    x1 @ 5.00 USD = 5.00 USD                     │
│                                                 │
│ 3. Bujías NGK                                   │
│    x4 @ 5.00 USD = 20.00 USD                    │
│                                                 │
│ ───────────────────────────────────────────────│
│ Subtotal:                         55.00 USD     │
│ IVA (16%):                         8.80 USD     │
│ ═══════════════════════════════════════════════│
│ TOTAL PAGADO:                     63.80 USD     │
│ Equivalente:                   2,932.70 VES     │
│ (Tasa: 46.00 VES/USD)                           │
│                                                 │
│ [🖨️ Reimprimir Ticket]  [❌ Cancelar Venta]   │
└─────────────────────────────────────────────────┘
```

**Cancelación de Venta**:

- Mostrar confirmación: "¿Está seguro de cancelar esta venta? Esta acción NO es reversible."
- Al confirmar:
  1. Actualizar `status` de venta a "cancelled"
  2. Revertir stock (agregar cantidades vendidas de vuelta)
  3. Registrar movimiento de inventario: "Reversa de VTA-000123"
  4. Si existe cuenta por cobrar asociada, marcarla como "cancelled"
  5. Mostrar confirmación: "Venta cancelada. Stock restaurado."

---

### RF-009: Integración con Tasas de Cambio

**Prioridad**: CRÍTICA

**Descripción**:  
Usar el sistema de tasas de cambio ya implementado (FEATURE-001) para calcular precios en múltiples monedas en tiempo real.

**Criterios de Aceptación**:

- ✅ Al cargar POS, obtener tasa activa desde `/api/exchange-rates`
- ✅ Si NO hay tasa activa (USD rate = 0), mostrar alerta: "Debe configurar la tasa de cambio USD antes de vender"
- ✅ Bloquear botón "Completar Venta" hasta que se configure tasa
- ✅ Enlace directo a página de tasas de cambio desde alerta
- ✅ Mostrar tasa activa en header del POS: "1 USD = 46.00 VES (actualizada hoy)"
- ✅ Recalcular precios automáticamente al cambiar tasa (polling cada 5 min)
- ✅ Snapshot de tasa en cada venta (guardar en `priceSnapshot`)

**Cálculo de Precios con Tasa**:

```javascript
// Productos vienen con pricing multi-moneda ya calculado
product = {
  priceVES: 690.0, // Calculado en backend con: (cost + additional) * (1 + margin/100) * (1 + iva/100) * exchangeRate
  priceUSD: 15.0, // Precio base de referencia
  priceEUR: 13.5, // Conversión EUR si aplica
  costCurrency: 'USD',
};

// En carrito, usar pricing según moneda activa
if (localCurrency === 'VES') {
  item.localPrice = product.priceVES;
  item.referencePrice = product.priceUSD;
} else if (localCurrency === 'USD') {
  item.localPrice = product.priceUSD;
  item.referencePrice = product.priceUSD;
}

// Guardar snapshot para historial
item.priceSnapshot = {
  localCurrency: 'VES',
  referenceCurrency: 'USD',
  localAmount: 690.0,
  referenceAmount: 15.0,
  exchangeRate: 46.0,
  source: 'sale',
};
```

---

### RF-010: Atajos de Teclado

**Prioridad**: MEDIA

**Descripción**:  
Implementar atajos de teclado para agilizar operaciones comunes del cajero.

**Atajos Disponibles**:

| Atajo           | Acción                                |
| --------------- | ------------------------------------- |
| `Ctrl+F` o `F2` | Enfocar búsqueda de productos         |
| `Ctrl+K` o `F3` | Abrir búsqueda de clientes            |
| `Enter`         | Confirmar venta (si botón habilitado) |
| `Esc`           | Cerrar modales / Limpiar búsqueda     |
| `F4`            | Enfocar input de cédula               |
| `F5`            | Recargar productos                    |
| `Ctrl+L`        | Limpiar carrito (con confirmación)    |
| `Tab`           | Navegar entre campos del formulario   |

**Criterios de Aceptación**:

- ✅ Atajos funcionan en todo momento (excepto cuando modal está abierto)
- ✅ No interferir con atajos nativos del navegador
- ✅ Mostrar tooltip con atajo disponible en hover de botones principales
- ✅ Documentar atajos en página de ayuda o tutorial

---

## 4. Modelo de Datos (Prisma Schema)

### 4.1 Extensión de Esquema Existente

```prisma
// ========================================
// VENTAS (SALES)
// ========================================

model Sale {
  id                   String        @id @default(cuid())
  saleNumber           String        @unique  // Consecutivo: VTA-000001
  storeId              String
  customerId           String?
  userId               String        // Cajero que hizo la venta

  // Montos
  subtotal             Decimal       @db.Decimal(12, 2)
  tax                  Decimal       @db.Decimal(12, 2)
  discount             Decimal       @db.Decimal(12, 2)  @default(0)
  total                Decimal       @db.Decimal(12, 2)

  // Multi-moneda
  currency             String        @default("VES")  // Moneda principal de la venta
  localCurrency        String        @default("VES")
  referenceCurrency    String        @default("USD")
  exchangeRate         Decimal       @db.Decimal(12, 4)  @default(0)

  // Montos en moneda de referencia (calculados)
  totalReference       Decimal?      @db.Decimal(12, 2)

  // Pago
  paymentMethod        String                          // cash, card, transfer, pago_movil, por_cobrar
  referenceNumber      String?                         // Número de referencia de pago (si aplica)
  paid                 Decimal       @db.Decimal(12, 2)  @default(0)
  change               Decimal       @db.Decimal(12, 2)  @default(0)

  // Estado
  status               String        @default("completed")  // completed, cancelled
  notes                String?
  cancelReason         String?
  cancelledAt          DateTime?
  cancelledBy          String?

  // Snapshot monetario (JSON)
  monetarySnapshot     Json?

  // Timestamps
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  // Relaciones
  store                Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)
  customer             Customer?     @relation(fields: [customerId], references: [id], onDelete: SetNull)
  user                 User          @relation(fields: [userId], references: [id], onDelete: Restrict)
  items                SaleItem[]
  receivable           Receivable?   // Relación 1:1 si método = "por_cobrar"

  @@index([storeId, createdAt(sort: Desc)])
  @@index([storeId, customerId])
  @@index([storeId, status])
  @@index([saleNumber])
}

// ========================================
// ITEMS DE VENTA
// ========================================

model SaleItem {
  id                   String        @id @default(cuid())
  saleId               String
  productId            String
  productName          String                          // Snapshot del nombre

  // Cantidades
  quantity             Decimal       @db.Decimal(12, 3)  // Permitir decimales

  // Precios unitarios
  price                Decimal       @db.Decimal(12, 2)  // Precio en moneda local
  localPrice           Decimal       @db.Decimal(12, 2)
  referencePrice       Decimal       @db.Decimal(12, 2)  // Precio en USD

  // Subtotales
  subtotal             Decimal       @db.Decimal(12, 2)  // quantity * price
  subtotalLocal        Decimal       @db.Decimal(12, 2)
  subtotalReference    Decimal       @db.Decimal(12, 2)

  // Snapshot de precios (JSON)
  priceSnapshot        Json?                           // { localCurrency, referenceCurrency, localAmount, referenceAmount, exchangeRate }

  // IVA
  iva                  Decimal       @db.Decimal(5, 2)  @default(0)  // % de IVA aplicado a este item

  // Timestamps
  createdAt            DateTime      @default(now())

  // Relaciones
  sale                 Sale          @relation(fields: [saleId], references: [id], onDelete: Cascade)
  product              Product       @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@index([saleId])
  @@index([productId])
}

// ========================================
// CUENTAS POR COBRAR (RECEIVABLES)
// ========================================

model Receivable {
  id                      String        @id @default(cuid())
  storeId                 String
  saleId                  String?       @unique  // Opcional: vinculada a venta
  customerId              String
  customerName            String                       // Snapshot
  documentNumber          String?                      // Cédula del cliente

  // Montos
  amount                  Decimal       @db.Decimal(12, 2)  // Monto en moneda local
  baseCurrency            String        @default("USD")     // Moneda de referencia
  referenceAmount         Decimal       @db.Decimal(12, 2)  // Monto en USD
  exchangeRateAtCreation  Decimal       @db.Decimal(12, 4)  @default(0)

  // Pagos
  amountPaid              Decimal       @db.Decimal(12, 2)  @default(0)
  balance                 Decimal       @db.Decimal(12, 2)  // Calculado: amount - amountPaid

  // Descripción
  description             String?
  dueDate                 DateTime?                        // Fecha de vencimiento (opcional)
  invoiceNumber           String?                          // Número de factura/venta

  // Estado
  status                  String        @default("pending")  // pending, partial, paid, cancelled, overdue

  // Timestamps
  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt
  paidAt                  DateTime?

  // Relaciones
  store                   Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)
  customer                Customer      @relation(fields: [customerId], references: [id], onDelete: Restrict)
  sale                    Sale?         @relation(fields: [saleId], references: [id], onDelete: SetNull)
  payments                ReceivablePayment[]

  @@index([storeId, status])
  @@index([storeId, customerId])
  @@index([storeId, dueDate])
  @@index([saleId])
}

// ========================================
// PAGOS DE CUENTAS POR COBRAR
// ========================================

model ReceivablePayment {
  id                   String        @id @default(cuid())
  receivableId         String

  // Montos
  amount               Decimal       @db.Decimal(12, 2)
  paymentMethod        String                          // cash, card, transfer, pago_movil
  referenceNumber      String?

  notes                String?
  createdAt            DateTime      @default(now())

  // Relaciones
  receivable           Receivable    @relation(fields: [receivableId], references: [id], onDelete: Cascade)

  @@index([receivableId])
}

// ========================================
// EXTENSIÓN: CUSTOMER (Clientes)
// ========================================

model Customer {
  id                   String        @id @default(cuid())
  storeId              String

  // Datos principales
  documentNumber       String                          // Cédula (único por tienda)
  documentType         String        @default("V")     // V, E, J, G
  name                 String

  // Contacto (NUEVO: expandido para web)
  email                String?
  phone                String?                         // Formato: +58 414-1234567
  address              String?                         // Dirección completa

  // Timestamps
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  // Relaciones
  store                Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)
  sales                Sale[]
  receivables          Receivable[]

  @@unique([storeId, documentNumber])  // Cédula única por tienda
  @@index([storeId, name])
}

// ========================================
// MOVIMIENTOS DE INVENTARIO (ya existe, extensión)
// ========================================

model InventoryMovement {
  id                   String        @id @default(cuid())
  productId            String
  storeId              String

  type                 String                          // entry, exit, adjustment
  quantity             Decimal       @db.Decimal(12, 3)
  previousStock        Decimal       @db.Decimal(12, 3)
  newStock             Decimal       @db.Decimal(12, 3)

  notes                String?                         // Ej: "VTA-000123 - Juan Pérez - transfer"
  createdAt            DateTime      @default(now())

  // Relaciones
  product              Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  store                Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@index([productId, createdAt(sort: Desc)])
  @@index([storeId, type])
}
```

### 4.2 Migraciones Necesarias

```bash
# Crear migración
npx prisma migrate dev --name add_sales_module

# Contenido de la migración SQL (generado por Prisma):
```

```sql
-- CreateTable
CREATE TABLE "Sale" (
  "id" TEXT NOT NULL,
  "saleNumber" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "customerId" TEXT,
  "userId" TEXT NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL,
  "tax" DECIMAL(12,2) NOT NULL,
  "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'VES',
  "localCurrency" TEXT NOT NULL DEFAULT 'VES',
  "referenceCurrency" TEXT NOT NULL DEFAULT 'USD',
  "exchangeRate" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "totalReference" DECIMAL(12,2),
  "paymentMethod" TEXT NOT NULL,
  "referenceNumber" TEXT,
  "paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "change" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "notes" TEXT,
  "cancelReason" TEXT,
  "cancelledAt" TIMESTAMP(3),
  "cancelledBy" TEXT,
  "monetarySnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
  "id" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "quantity" DECIMAL(12,3) NOT NULL,
  "price" DECIMAL(12,2) NOT NULL,
  "localPrice" DECIMAL(12,2) NOT NULL,
  "referencePrice" DECIMAL(12,2) NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL,
  "subtotalLocal" DECIMAL(12,2) NOT NULL,
  "subtotalReference" DECIMAL(12,2) NOT NULL,
  "priceSnapshot" JSONB,
  "iva" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receivable" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "saleId" TEXT,
  "customerId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "documentNumber" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
  "referenceAmount" DECIMAL(12,2) NOT NULL,
  "exchangeRateAtCreation" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "balance" DECIMAL(12,2) NOT NULL,
  "description" TEXT,
  "dueDate" TIMESTAMP(3),
  "invoiceNumber" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),

  CONSTRAINT "Receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivablePayment" (
  "id" TEXT NOT NULL,
  "receivableId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "referenceNumber" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReceivablePayment_pkey" PRIMARY KEY ("id")
);

-- AlterTable Customer
-- Agregar campos: phone, address
ALTER TABLE "Customer" ADD COLUMN "phone" TEXT;
ALTER TABLE "Customer" ADD COLUMN "address" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Sale_saleNumber_key" ON "Sale"("saleNumber");
CREATE INDEX "Sale_storeId_createdAt_idx" ON "Sale"("storeId", "createdAt" DESC);
CREATE INDEX "Sale_storeId_customerId_idx" ON "Sale"("storeId", "customerId");
CREATE INDEX "Sale_storeId_status_idx" ON "Sale"("storeId", "status");
CREATE INDEX "Sale_saleNumber_idx" ON "Sale"("saleNumber");

CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");

CREATE UNIQUE INDEX "Receivable_saleId_key" ON "Receivable"("saleId");
CREATE INDEX "Receivable_storeId_status_idx" ON "Receivable"("storeId", "status");
CREATE INDEX "Receivable_storeId_customerId_idx" ON "Receivable"("storeId", "customerId");
CREATE INDEX "Receivable_storeId_dueDate_idx" ON "Receivable"("storeId", "dueDate");
CREATE INDEX "Receivable_saleId_idx" ON "Receivable"("saleId");

CREATE INDEX "ReceivablePayment_receivableId_idx" ON "ReceivablePayment"("receivableId");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReceivablePayment" ADD CONSTRAINT "ReceivablePayment_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## 5. Endpoints API Necesarios

### 5.1 Ventas

#### POST `/api/sales`

**Descripción**: Crear nueva venta con todos sus items

**Auth**: Requerido (JWT)

**Request Body**:

```typescript
{
  customerId: string,
  subtotal: number,
  tax: number,
  discount: number,
  total: number,
  currency: string,
  localCurrency: string,
  referenceCurrency: string,
  exchangeRate: number,
  paymentMethod: string,
  referenceNumber?: string,
  paid: number,
  change: number,
  notes?: string,
  items: [
    {
      productId: string,
      productName: string,
      quantity: number,
      price: number,
      localPrice: number,
      referencePrice: number,
      subtotal: number,
      subtotalLocal: number,
      subtotalReference: number,
      iva: number,
      priceSnapshot: {
        localCurrency: string,
        referenceCurrency: string,
        localAmount: number,
        referenceAmount: number,
        exchangeRate: number
      }
    }
  ]
}
```

**Response 201**:

```json
{
  "id": "clxxx",
  "saleNumber": "VTA-000123",
  "total": 63.8,
  "createdAt": "2026-08-25T14:35:22Z"
}
```

**Validaciones**:

- ✅ storeId debe existir y user debe tener acceso
- ✅ customerId debe existir o ser null
- ✅ items.length > 0
- ✅ Todos los productId deben existir
- ✅ total = subtotal + tax - discount
- ✅ Si paymentMethod = "por_cobrar", crear Receivable automáticamente

**Efectos Secundarios**:

- Actualizar stock de productos (decrementar)
- Insertar InventoryMovement por cada item
- Crear Receivable si paymentMethod = "por_cobrar"
- Generar saleNumber consecutivo

---

#### GET `/api/sales`

**Descripción**: Listar ventas con filtros

**Auth**: Requerido

**Query Params**:

```
?storeId=xxx
&from=2026-08-01
&to=2026-08-31
&customerId=xxx
&paymentMethod=cash
&status=completed
&limit=20
&offset=0
```

**Response 200**:

```json
{
  "sales": [
    {
      "id": "clxxx",
      "saleNumber": "VTA-000123",
      "customer": {
        "id": "clyyy",
        "name": "Juan Pérez",
        "documentNumber": "12345678"
      },
      "subtotal": 55.0,
      "tax": 8.8,
      "total": 63.8,
      "currency": "USD",
      "paymentMethod": "transfer",
      "status": "completed",
      "createdAt": "2026-08-25T14:35:22Z",
      "itemsCount": 3
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

---

#### GET `/api/sales/:id`

**Descripción**: Obtener detalle completo de una venta

**Auth**: Requerido

**Response 200**:

```json
{
  "id": "clxxx",
  "saleNumber": "VTA-000123",
  "customer": {
    "id": "clyyy",
    "name": "Juan Pérez",
    "documentNumber": "V-12345678",
    "phone": "0414-1234567",
    "address": "Av. Principal, Caracas"
  },
  "subtotal": 55.0,
  "tax": 8.8,
  "discount": 0,
  "total": 63.8,
  "currency": "USD",
  "localCurrency": "VES",
  "referenceCurrency": "USD",
  "exchangeRate": 46.0,
  "totalReference": 63.8,
  "paymentMethod": "transfer",
  "referenceNumber": "1234567890",
  "paid": 63.8,
  "change": 0,
  "status": "completed",
  "notes": "Cliente: Juan Pérez - Ref: 1234567890",
  "createdAt": "2026-08-25T14:35:22Z",
  "items": [
    {
      "id": "clzzz",
      "productId": "clppp1",
      "productName": "Aceite Mobil 1 5W30",
      "quantity": 2,
      "price": 15.0,
      "localPrice": 690.0,
      "referencePrice": 15.0,
      "subtotal": 30.0,
      "subtotalLocal": 1380.0,
      "subtotalReference": 30.0,
      "iva": 16,
      "priceSnapshot": {
        "localCurrency": "VES",
        "referenceCurrency": "USD",
        "localAmount": 690.0,
        "referenceAmount": 15.0,
        "exchangeRate": 46.0
      }
    },
    {
      "id": "claaa",
      "productId": "clppp2",
      "productName": "Filtro de aire K&N",
      "quantity": 1,
      "price": 5.0,
      "localPrice": 230.0,
      "referencePrice": 5.0,
      "subtotal": 5.0,
      "subtotalLocal": 230.0,
      "subtotalReference": 5.0,
      "iva": 16
    }
  ]
}
```

---

#### PUT `/api/sales/:id/cancel`

**Descripción**: Cancelar una venta (reversa de stock)

**Auth**: Requerido

**Request Body**:

```json
{
  "cancelReason": "Cliente solicitó devolución"
}
```

**Response 200**:

```json
{
  "id": "clxxx",
  "status": "cancelled",
  "cancelledAt": "2026-08-25T15:00:00Z",
  "cancelReason": "Cliente solicitó devolución"
}
```

**Validaciones**:

- ✅ Sale debe existir y pertenecer a storeId del user
- ✅ status debe ser "completed" (no se puede cancelar una ya cancelada)
- ✅ Solo admin/owner puede cancelar ventas (middleware de permisos)

**Efectos Secundarios**:

- Actualizar `status` a "cancelled"
- Revertir stock (incrementar cantidades vendidas)
- Insertar InventoryMovement tipo "adjustment" con notes "Reversa de VTA-000123"
- Si existe Receivable vinculada, marcarla como "cancelled"

---

### 5.2 Cuentas por Cobrar

#### GET `/api/receivables`

**Descripción**: Listar cuentas por cobrar

**Auth**: Requerido

**Query Params**:

```
?storeId=xxx
&customerId=xxx
&status=pending
&overdue=true
&limit=20
&offset=0
```

**Response 200**:

```json
{
  "receivables": [
    {
      "id": "clxxx",
      "customer": {
        "id": "clyyy",
        "name": "Juan Pérez",
        "documentNumber": "12345678"
      },
      "amount": 63.8,
      "baseCurrency": "USD",
      "referenceAmount": 63.8,
      "amountPaid": 0,
      "balance": 63.8,
      "description": "Venta a crédito - 3 producto(s)",
      "dueDate": null,
      "invoiceNumber": "VTA-000123",
      "status": "pending",
      "createdAt": "2026-08-25T14:35:22Z",
      "daysPastDue": 0
    }
  ],
  "total": 12,
  "totalBalance": 850.5
}
```

---

#### POST `/api/receivables/:id/payments`

**Descripción**: Registrar pago parcial o total de cuenta por cobrar

**Auth**: Requerido

**Request Body**:

```json
{
  "amount": 30.0,
  "paymentMethod": "cash",
  "referenceNumber": "PAGO-001",
  "notes": "Abono inicial"
}
```

**Response 201**:

```json
{
  "id": "clpay",
  "receivableId": "clxxx",
  "amount": 30.0,
  "paymentMethod": "cash",
  "createdAt": "2026-08-26T10:00:00Z",
  "receivable": {
    "amountPaid": 30.0,
    "balance": 33.8,
    "status": "partial"
  }
}
```

**Validaciones**:

- ✅ Receivable debe existir y pertenecer a storeId del user
- ✅ amount > 0 y <= balance restante
- ✅ paymentMethod válido

**Efectos Secundarios**:

- Incrementar `amountPaid` en Receivable
- Recalcular `balance`
- Si balance = 0, cambiar `status` a "paid" y setear `paidAt`
- Si balance > 0 y amountPaid > 0, cambiar `status` a "partial"

---

### 5.3 Clientes (Extensión)

#### POST `/api/customers`

**Descripción**: Crear cliente nuevo (desde POS durante venta)

**Auth**: Requerido

**Request Body**:

```json
{
  "documentNumber": "12345678",
  "documentType": "V",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "0414-1234567",
  "address": "Av. Principal, Caracas"
}
```

**Response 201**:

```json
{
  "id": "clxxx",
  "documentNumber": "12345678",
  "name": "Juan Pérez",
  "phone": "0414-1234567",
  "address": "Av. Principal, Caracas",
  "createdAt": "2026-08-25T14:30:00Z"
}
```

**Validaciones**:

- ✅ documentNumber único por storeId
- ✅ name mínimo 3 caracteres
- ✅ phone formato válido si se especifica (regex: `^\+?58\s?\d{3}-?\d{7}$`)

---

#### GET `/api/customers?search=xxx`

**Descripción**: Buscar clientes por nombre o cédula

**Auth**: Requerido

**Query Params**:

```
?storeId=xxx
&search=juan
&limit=10
```

**Response 200**:

```json
{
  "customers": [
    {
      "id": "clxxx",
      "documentNumber": "12345678",
      "documentType": "V",
      "name": "Juan Pérez",
      "phone": "0414-1234567",
      "address": "Av. Principal, Caracas",
      "salesCount": 15,
      "totalPurchased": 1250.0
    }
  ]
}
```

---

## 6. Componentes Frontend (Next.js)

### 6.1 Estructura de Carpetas

```
tienda-web/
  app/
    dashboard/
      pos/
        page.tsx                    # Pantalla principal POS
      sales/
        page.tsx                    # Listado de ventas
        [id]/
          page.tsx                  # Detalle de venta
      receivables/
        page.tsx                    # Cuentas por cobrar (futuro)

  components/
    pos/
      POSLayout.tsx                 # Layout split-screen
      ProductCatalog.tsx            # Catálogo de productos (izquierda)
      ProductCard.tsx               # Card de producto
      ProductSearchBar.tsx          # Barra de búsqueda
      Cart.tsx                      # Carrito (derecha)
      CartItem.tsx                  # Item del carrito
      CartSummary.tsx               # Footer con totales
      PaymentMethodSelector.tsx     # Radio buttons de métodos
      CustomerSelector.tsx          # Selector/búsqueda de cliente
      CustomerQuickCreate.tsx       # Modal de creación rápida
      CompleteSaleButton.tsx        # Botón principal de venta

    sales/
      SalesTable.tsx                # Tabla de ventas
      SalesFilters.tsx              # Filtros de fecha/cliente/método
      SaleDetailModal.tsx           # Modal de detalle completo
      CancelSaleButton.tsx          # Botón de cancelación

    common/
      CurrencyDisplay.tsx           # Formateo de montos multi-moneda
      CustomerBadge.tsx             # Badge con info de cliente
      StatusBadge.tsx               # Badge de estado (completada, cancelada)

  hooks/
    useSales.ts                     # Hook para crear/listar ventas
    useCart.ts                      # Hook para gestión de carrito
    useCustomers.ts                 # Hook para buscar/crear clientes
    useReceivables.ts               # Hook para cuentas por cobrar

  lib/
    pos/
      priceCalculator.ts            # Cálculos de precios multi-moneda
      saleValidator.ts              # Validaciones de venta
      consecutiveGenerator.ts       # Generador de VTA-XXXXXX
```

### 6.2 Componente Principal: POSLayout

```tsx
// app/dashboard/pos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useSales } from '@/hooks/useSales';
import ProductCatalog from '@/components/pos/ProductCatalog';
import Cart from '@/components/pos/Cart';
import ExchangeRateAlert from '@/components/pos/ExchangeRateAlert';

export default function POSPage() {
  const { profile } = useAuth();
  const { activeRate, loading: ratesLoading } = useExchangeRates(
    profile?.storeId || ''
  );
  const { products, loading: productsLoading } = useProducts(
    profile?.storeId || ''
  );
  const { cart, addToCart, updateQuantity, removeItem, clearCart } = useCart();
  const { createSale, loading: saleLoading } = useSales();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Validar que haya tasa de cambio configurada
  if (!ratesLoading && (!activeRate || activeRate.usdToVes === 0)) {
    return <ExchangeRateAlert />;
  }

  if (productsLoading || ratesLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-screen">
      {/* Lado izquierdo: Catálogo de productos */}
      <div className="w-1/2 overflow-hidden border-r border-gray-200">
        <ProductCatalog
          products={products}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onAddToCart={addToCart}
          exchangeRate={activeRate}
        />
      </div>

      {/* Lado derecho: Carrito */}
      <div className="w-1/2 overflow-hidden">
        <Cart
          items={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearCart={clearCart}
          onCompleteSale={handleCompleteSale}
          exchangeRate={activeRate}
          saleLoading={saleLoading}
        />
      </div>
    </div>
  );

  async function handleCompleteSale(saleData) {
    const result = await createSale(saleData);
    if (result.success) {
      clearCart();
      showSuccessToast(`Venta ${result.saleNumber} completada`);
    }
  }
}
```

---

## 7. Casos de Uso Detallados

### Caso de Uso 1: Venta Rápida con Cliente Genérico

**Actor**: Cajero  
**Precondición**: Tasa de cambio configurada, productos en stock

**Flujo**:

1. Cajero abre pantalla POS
2. Busca "aceite mobil" en barra de búsqueda
3. Click en card "Aceite Mobil 1 5W30" → Agrega 1 unidad al carrito
4. Carrito muestra: 1x Aceite Mobil 1 @ 15.00 USD = 15.00 USD
5. Cajero cambia cantidad a "2" en el input del carrito
6. Carrito recalcula: 2x Aceite Mobil 1 @ 15.00 USD = 30.00 USD
7. Cajero ingresa "1" en campo de cédula (cliente genérico)
8. Badge "Cliente Genérico" aparece
9. Método de pago: Selecciona "Efectivo" (por defecto)
10. Click "🛒 Completar Venta"
11. Sistema:
    - Guarda venta con customerId del cliente genérico
    - Actualiza stock de "Aceite Mobil 1": 25 → 23
    - Registra movimiento de inventario
    - Genera consecutivo "VTA-000124"
12. Muestra toast: "Venta VTA-000124 completada"
13. Carrito se limpia automáticamente
14. Cajero puede iniciar nueva venta

**Tiempo estimado**: 30 segundos

---

### Caso de Uso 2: Venta con Cliente Nuevo (Creación Rápida)

**Actor**: Cajero  
**Precondición**: Cliente no existe en sistema

**Flujo**:

1. Cajero agrega productos al carrito (Subtotal: 63.80 USD)
2. Ingresa cédula "25123456" en campo de cliente
3. Sistema busca en DB → No encontrado
4. Muestra mensaje: "Cliente no encontrado. [Crear Nuevo]"
5. Cajero click en "Crear Nuevo"
6. **Modal de Creación Rápida se abre**:
   - Cédula: "25123456" (readonly, pre-llenado)
   - Nombre: [____________________] (focus automático)
   - Teléfono: [_________________]
   - Dirección: [________________]
7. Cajero ingresa:
   - Nombre: "María González"
   - Teléfono: "0424-5551234"
   - Dirección: "Calle 5, Maracaibo"
8. Click "Crear y Vender"
9. Sistema:
   - Valida nombre (min 3 chars) ✅
   - Valida cédula única ✅
   - Valida teléfono formato ✅
   - Crea cliente en DB
   - Cierra modal
   - Completa venta usando nuevo customerId
   - Actualiza stock
   - NO crea cuenta por cobrar (método = efectivo)
10. Toast: "Cliente creado. Venta VTA-000125 completada"

**Tiempo estimado**: 60 segundos (incluye creación de cliente)

---

### Caso de Uso 3: Venta a Crédito (Genera Cuenta por Cobrar)

**Actor**: Cajero  
**Precondición**: Cliente registrado con cédula != "1"

**Flujo**:

1. Cajero agrega productos al carrito (Total: 120.00 USD)
2. Ingresa cédula "12345678"
3. Sistema encuentra cliente "Juan Pérez" y autocompleta:
   - Nombre: Juan Pérez
   - Teléfono: 0414-1234567
   - Dirección: Av. Principal, Caracas
4. Método de pago: Selecciona **"Por Cobrar"** ⏱️
5. Tooltip muestra: "Se creará automáticamente una cuenta por cobrar"
6. Click "🛒 Completar Venta"
7. Sistema:
   - Guarda venta con paymentMethod = "por_cobrar"
   - Actualiza stock
   - **Crea Receivable**:
     ```javascript
     {
       customerId: "clyyy",
       amount: 120.00,
       referenceAmount: 120.00,
       baseCurrency: "USD",
       exchangeRateAtCreation: 46.00,
       description: "Venta a crédito - 5 producto(s)",
       invoiceNumber: "VTA-000126",
       status: "pending",
       balance: 120.00,
       amountPaid: 0
     }
     ```
8. Toast: "Venta VTA-000126 completada. ✅ Cuenta por cobrar creada automáticamente"
9. Carrito se limpia

**Tiempo estimado**: 45 segundos

---

### Caso de Uso 4: Cliente Genérico Intenta Usar "Por Cobrar"

**Actor**: Cajero  
**Precondición**: Ninguna

**Flujo**:

1. Cajero agrega productos al carrito
2. Ingresa cédula "1" (cliente genérico)
3. Método de pago: Intenta seleccionar **"Por Cobrar"**
4. **Sistema bloquea y muestra error**:
   > "❌ Método de Pago No Permitido
   >
   > El cliente genérico es solo para ventas rápidas. No se permite el método de pago 'Por Cobrar' para este cliente.
   >
   > Debe seleccionar un cliente registrado o crear uno nuevo."
5. Botón "🛒 Completar Venta" permanece deshabilitado
6. Cajero debe:
   - Cambiar a otro método de pago (Efectivo, Tarjeta, etc.), O
   - Cambiar cédula a un cliente real

**Tiempo estimado**: 15 segundos (error + corrección)

---

### Caso de Uso 5: Cancelación de Venta (Reversa de Stock)

**Actor**: Administrador  
**Precondición**: Venta completada, permisos de admin

**Flujo**:

1. Admin abre "Historial de Ventas"
2. Busca venta "VTA-000125" (120.00 USD, Juan Pérez)
3. Click "Ver Detalle"
4. **Modal de Detalle se abre**:
   - Muestra: Items vendidos, Totales, Cliente, Método de pago
   - Botón "❌ Cancelar Venta" visible
5. Admin click "❌ Cancelar Venta"
6. **Confirmación**:
   > "¿Está seguro de cancelar esta venta? Esta acción NO es reversible.
   >
   > El stock será restaurado automáticamente."
7. Admin ingresa razón: "Cliente solicitó devolución"
8. Click "Confirmar Cancelación"
9. Sistema (transacción):
   - Actualiza Sale.status = "cancelled"
   - Sale.cancelReason = "Cliente solicitó devolución"
   - Sale.cancelledAt = now()
   - Para cada SaleItem:
     - Incrementa stock de producto: `stock += quantity`
     - Inserta InventoryMovement: type="adjustment", notes="Reversa de VTA-000125"
   - Si existe Receivable vinculada:
     - Actualiza Receivable.status = "cancelled"
10. Toast: "Venta VTA-000125 cancelada. Stock restaurado."
11. Modal se cierra, tabla se recarga

**Tiempo estimado**: 30 segundos

---

## 8. Validaciones y Reglas de Negocio

### 8.1 Validaciones de Venta

| Regla                             | Condición                                                                             | Acción                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Carrito vacío**                 | cart.length === 0                                                                     | Deshabilitar botón "Completar Venta"                      |
| **Sin cliente**                   | customerDocument.trim() === ""                                                        | Mostrar error: "Debe especificar la cédula del cliente"   |
| **Cliente genérico + Por Cobrar** | customerDocument === "1" && paymentMethod === "por_cobrar"                            | Bloquear selección, mostrar modal de error                |
| **Método requiere referencia**    | ["card", "transfer", "pago_movil"].includes(paymentMethod) && !referenceNumber.trim() | Mostrar error: "Debe especificar el número de referencia" |
| **Sin tasa de cambio**            | !activeRate \|\| activeRate.usdToVes === 0                                            | Bloquear POS completo, mostrar alerta con enlace a config |
| **Stock insuficiente**            | item.quantity > product.stock && product.trackInventory === 1                         | Mostrar warning, permitir venta (configuración futura)    |
| **Producto sin stock**            | product.stock === 0                                                                   | Deshabilitar card de producto, mostrar badge "Sin Stock"  |

### 8.2 Reglas de Cálculo

#### Subtotal de Item

```javascript
item.subtotal = item.price * item.quantity;
```

#### IVA de Item

```javascript
item.tax = pricingSettings.applyIvaOnSales
  ? item.subtotal * (item.iva / 100)
  : 0;
```

#### Total de Venta

```javascript
subtotalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
taxAmount = cart.reduce(
  (sum, item) => sum + item.subtotal * (item.iva / 100),
  0
);
total = subtotalAmount + taxAmount - discount;
```

#### Conversión a Moneda de Referencia

```javascript
totalReference =
  exchangeRate > 0 && rateEnabled ? (total / exchangeRate).toFixed(2) : null;
```

### 8.3 Reglas de Cliente Genérico

```javascript
GENERIC_CUSTOMER = {
  documentNumber: '1',
  name: 'Cliente Genérico',
  documentType: 'V',
  isGeneric: true,
};

// Crear cliente genérico si no existe
async function ensureGenericCustomer(storeId) {
  const existing = await prisma.customer.findFirst({
    where: { storeId, documentNumber: '1' },
  });

  if (existing) return existing.id;

  const created = await prisma.customer.create({
    data: {
      storeId,
      documentNumber: '1',
      name: 'Cliente Genérico',
      documentType: 'V',
    },
  });

  return created.id;
}
```

### 8.4 Reglas de Cuenta por Cobrar

```javascript
// Solo crear si paymentMethod = "por_cobrar"
if (paymentMethod === 'por_cobrar') {
  // Validar que NO sea cliente genérico
  if (customerDocument === '1') {
    throw new Error("No se permite 'Por Cobrar' para cliente genérico");
  }

  // Calcular monto de referencia
  const referenceAmount = cart.reduce(
    (sum, item) => sum + item.referencePrice * item.quantity,
    0
  );

  // Crear receivable
  await prisma.receivable.create({
    data: {
      storeId,
      saleId: sale.id,
      customerId,
      customerName,
      documentNumber: customerDocument,
      amount: total,
      baseCurrency: referenceCurrency,
      referenceAmount,
      exchangeRateAtCreation: exchangeRate,
      description: `Venta a crédito - ${cart.length} producto(s)`,
      invoiceNumber: saleNumber,
      status: 'pending',
      balance: total,
      amountPaid: 0,
    },
  });
}
```

---

## 9. Integración con Sistema de Tasas de Cambio

### 9.1 Dependencia Crítica

El módulo de ventas **DEPENDE COMPLETAMENTE** del sistema de tasas de cambio implementado en FEATURE-001.

**Flujo de Verificación**:

```javascript
// En POSPage.tsx
const { activeRate, loading: ratesLoading } = useExchangeRates(
  profile?.storeId || ''
);

if (!ratesLoading && (!activeRate || activeRate.usdToVes === 0)) {
  return (
    <div className="flex h-screen items-center justify-center bg-red-50">
      <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Tasa de Cambio No Configurada
          </h2>
        </div>
        <p className="mb-4 text-gray-700">
          Debe configurar la tasa de cambio USD antes de poder realizar ventas.
        </p>
        <p className="mb-6 text-sm text-gray-600">
          El sistema necesita conocer el valor del dólar para calcular
          correctamente los precios de venta en Bolívares.
        </p>
        <Link
          href="/dashboard/exchange-rates"
          className="block w-full rounded-lg bg-green-600 px-4 py-2 text-center text-white hover:bg-green-700"
        >
          Configurar Tasa de Cambio Ahora
        </Link>
      </div>
    </div>
  );
}
```

### 9.2 Uso de Tasas en Cálculos

```javascript
// Calcular precio en moneda local
const priceVES = product.priceUSD * activeRate.usdToVes;

// Agregar al carrito con snapshot
const cartItem = {
  id: product.id,
  name: product.name,
  price: priceVES, // Moneda local (VES)
  localPrice: priceVES,
  referencePrice: product.priceUSD, // Moneda de referencia (USD)
  quantity: 1,
  subtotal: priceVES,
  iva: product.iva || 0,
  priceSnapshot: {
    localCurrency: 'VES',
    referenceCurrency: 'USD',
    localAmount: priceVES,
    referenceAmount: product.priceUSD,
    exchangeRate: activeRate.usdToVes,
    source: 'sale',
  },
};
```

### 9.3 Actualización en Tiempo Real

```javascript
// Polling cada 5 minutos para detectar cambios de tasa
useEffect(() => {
  const interval = setInterval(
    () => {
      refetchExchangeRates();
    },
    5 * 60 * 1000
  ); // 5 minutos

  return () => clearInterval(interval);
}, []);

// Si la tasa cambia durante una venta en progreso
useEffect(() => {
  if (cart.length > 0 && exchangeRateChanged) {
    showWarningToast(
      'La tasa de cambio se actualizó. Los precios en el carrito reflejan la tasa anterior. ' +
        'Si desea usar la nueva tasa, vacíe el carrito y vuelva a agregar los productos.'
    );
  }
}, [activeRate]);
```

---

## 10. Criterios de Aceptación Globales

### 10.1 Funcionales

- ✅ **POS-001**: Cajero puede crear venta completa en < 60 segundos
- ✅ **POS-002**: Cliente genérico (cédula "1") funciona para ventas rápidas
- ✅ **POS-003**: Cliente nuevo se puede crear durante la venta sin salir del POS
- ✅ **POS-004**: Método "Por Cobrar" genera automáticamente cuenta por cobrar
- ✅ **POS-005**: Stock se actualiza inmediatamente después de venta
- ✅ **POS-006**: Movimientos de inventario se registran con detalle completo
- ✅ **POS-007**: Consecutivo de venta se genera automáticamente (VTA-XXXXXX)
- ✅ **POS-008**: Snapshot de precios y tasas se guarda en cada venta
- ✅ **POS-009**: Cancelación de venta revierte stock correctamente
- ✅ **POS-010**: Historial de ventas muestra filtros funcionales

### 10.2 No Funcionales

- ✅ **POS-NFR-001**: Tiempo de respuesta < 500ms para agregar producto al carrito
- ✅ **POS-NFR-002**: Búsqueda de productos con debounce de 300ms
- ✅ **POS-NFR-003**: Transacciones de venta son atómicas (rollback automático en error)
- ✅ **POS-NFR-004**: Sistema funciona offline (futuro: PWA con sync)
- ✅ **POS-NFR-005**: UI responsive para desktop, tablet y móvil
- ✅ **POS-NFR-006**: Atajos de teclado documentados y funcionales
- ✅ **POS-NFR-007**: Accesibilidad WCAG 2.1 AA compliant
- ✅ **POS-NFR-008**: Soporte para lectores de códigos de barras USB

### 10.3 Seguridad

- ✅ **POS-SEC-001**: Solo usuarios autenticados pueden acceder al POS
- ✅ **POS-SEC-002**: Cada venta registra el userId del cajero
- ✅ **POS-SEC-003**: Solo admin puede cancelar ventas
- ✅ **POS-SEC-004**: Validación de permisos a nivel de API y UI
- ✅ **POS-SEC-005**: Auditoría completa de cambios en ventas (log de cancelaciones)

---

## 11. Estimación de Esfuerzo

### 11.1 Desglose por Fase

| Fase                     | Tareas                                    | Esfuerzo Estimado |
| ------------------------ | ----------------------------------------- | ----------------- |
| **Backend**              | Prisma schema, migraciones, endpoints API | 16 horas          |
| **Frontend - POS**       | Layout, catálogo, carrito, formularios    | 24 horas          |
| **Frontend - Historial** | Listado, filtros, detalle, cancelación    | 12 horas          |
| **Lógica de Negocio**    | Validaciones, cálculos, integraciones     | 12 horas          |
| **Testing**              | Unit + Integration tests                  | 16 horas          |
| **Documentación**        | Docs de API, guía de usuario              | 4 horas           |
| **Review y QA**          | Code review, testing manual               | 8 horas           |

**TOTAL ESTIMADO**: **92 horas** (~11.5 días de desarrollo a 8h/día)

### 11.2 Priorización (MoSCoW)

#### Must Have (MVP)

- ✅ Pantalla POS split-screen
- ✅ Búsqueda y selección de productos
- ✅ Carrito con cálculos multi-moneda
- ✅ Selección de cliente (genérico + búsqueda)
- ✅ Métodos de pago básicos (efectivo, transferencia)
- ✅ Finalización de venta con actualización de stock
- ✅ Historial de ventas (listado simple)
- ✅ Detalle de venta

#### Should Have (Post-MVP)

- ⚠️ Creación rápida de clientes (modal durante venta)
- ⚠️ Método "Por Cobrar" con generación de cuenta por cobrar
- ⚠️ Cancelación de ventas con reversa de stock
- ⚠️ Filtros avanzados en historial
- ⚠️ Atajos de teclado

#### Could Have (Futuro)

- ⏳ Descuentos en venta
- ⏳ Múltiples métodos de pago en una sola venta
- ⏳ Impresión de tickets
- ⏳ Exportar ventas a Excel/PDF
- ⏳ Dashboard de ventas (métricas, gráficos)

#### Won't Have (No incluido)

- ❌ Facturación electrónica
- ❌ Integración con pasarelas de pago
- ❌ Devoluciones (refunds)
- ❌ Punto de venta offline (PWA)

---

## 12. Riesgos y Mitigaciones

| Riesgo                                    | Probabilidad | Impacto | Mitigación                                                                   |
| ----------------------------------------- | ------------ | ------- | ---------------------------------------------------------------------------- |
| **Sincronización de tasas falla**         | Media        | Alto    | Cachear última tasa activa en localStorage, permitir venta con tasa cacheada |
| **Stock negativo en ventas concurrentes** | Alta         | Medio   | Validación de stock en transacción DB, mostrar warning pero permitir venta   |
| **Cliente genérico duplicado**            | Baja         | Bajo    | Usar `upsert` en lugar de `create` para cliente con cédula "1"               |
| **Performance con > 1000 productos**      | Media        | Medio   | Implementar paginación, virtualización de lista, índices DB                  |
| **Error en cálculo de IVA**               | Baja         | Alto    | Unit tests exhaustivos, validación cruzada frontend/backend                  |
| **Venta sin actualizar stock**            | Baja         | Crítico | Transacción atómica, rollback automático si falla stock update               |

---

## 13. Próximos Pasos

1. **Revisión de Especificación**: Equipo valida y aprueba este documento ✅
2. **Planificación Técnica**: Crear PLAN-002-modulo-ventas-web.md con detalle de implementación
3. **Setup de Backend**: Prisma migration, seeders de datos de prueba
4. **Desarrollo Backend**: Endpoints API + validaciones
5. **Desarrollo Frontend**: Componentes UI + hooks + integración
6. **Testing**: Unit tests + Integration tests + E2E
7. **QA**: Validación manual, corrección de bugs
8. **Documentación**: Actualizar README, crear guía de usuario
9. **Deploy**: Staging → Production

---

## 14. Apéndices

### Apéndice A: Formato de Consecutivo de Venta

```javascript
// Formato: VTA-XXXXXX (6 dígitos)
// Ejemplos:
VTA - 000001;
VTA - 000125;
VTA - 999999;

// Generación:
function generateSaleNumber(sequence) {
  return `VTA-${String(sequence).padStart(6, '0')}`;
}

// Almacenamiento de secuencia:
// Tabla: Consecutive
// { storeId, entity: 'sales', currentValue: 125 }
```

### Apéndice B: Estructura JSON de priceSnapshot

```json
{
  "localCurrency": "VES",
  "referenceCurrency": "USD",
  "localAmount": 690.0,
  "referenceAmount": 15.0,
  "exchangeRate": 46.0,
  "source": "sale"
}
```

### Apéndice C: Estados de Venta y Cuenta por Cobrar

**Sale.status**:

- `completed`: Venta finalizada exitosamente
- `cancelled`: Venta cancelada (stock revertido)

**Receivable.status**:

- `pending`: Sin pagos registrados
- `partial`: Pagos parciales (amountPaid > 0 && balance > 0)
- `paid`: Totalmente pagada (balance = 0)
- `cancelled`: Cuenta cancelada (venta revertida)
- `overdue`: Vencida (dueDate < today && balance > 0)

---

**FIN DE ESPECIFICACIÓN**

---

**Metadata**:

- Total de secciones: 14
- Total de requerimientos funcionales: 10
- Total de endpoints API: 8
- Total de componentes frontend: 15+
- Páginas: ~40 páginas
- Palabras: ~12,000 palabras

**Revisiones**:

- v1.0 - 2026-08-25 - Versión inicial completa basada en análisis de tienda-app
