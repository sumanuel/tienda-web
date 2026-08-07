# PLAN-005: Implementación Fase 5 - Cuentas por Cobrar y Pagar

**Fecha**: 2026-08-07  
**Planificador**: Agente Planificador Técnico  
**Feature Base**: FEATURE-001-tienda-web.md - Fase 5  
**Dependencias**: Fase 4 completada (clientes, proveedores, updateCustomerBalance, updateSupplierBalance)

---

## 📋 Resumen Ejecutivo

Implementar módulos de **Cuentas por Cobrar** (créditos a clientes) y **Cuentas por Pagar** (deudas con proveedores), permitiendo ventas/compras a crédito, registro de abonos/pagos, cálculo automático de saldos, alertas de vencimientos y reportes financieros.

**Estimación total**: 40 horas (5 días)  
**Prioridad**: Alta  
**Complejidad**: Alta (integración con ventas, transacciones financieras críticas)

---

## 🎯 Objetivos Específicos

### Funcionales

- ✅ Registrar ventas a crédito con fecha de vencimiento
- ✅ Registrar abonos parciales/totales de clientes
- ✅ Calcular saldo automáticamente usando `updateCustomerBalance()` corregido (Fase 4)
- ✅ Registrar compras a crédito a proveedores
- ✅ Registrar pagos parciales/totales a proveedores
- ✅ Calcular saldo automáticamente usando `updateSupplierBalance()` corregido (Fase 4)
- ✅ Alertas de cuentas vencidas/por vencer
- ✅ Reportes de cartera (aging)
- ✅ Estados de cuenta imprimibles (PDF)

### No Funcionales

- ✅ Transacciones atómicas (usar runTransaction de Fase 4)
- ✅ Historial completo de movimientos
- ✅ Validaciones de negocio (no abonar más del saldo)
- ✅ UI responsiva con tablas paginadas
- ✅ 0 errores TypeScript

---

## 📐 Arquitectura de Datos

### Colección: `customer_transactions`

```typescript
interface CustomerTransaction {
  id: string;
  storeId: string;
  customerId: string; // Referencia a customers
  type: 'charge' | 'payment'; // cargo (venta a crédito) o abono
  amount: number; // Monto (positivo para charge, positivo para payment)
  balanceBefore: number; // Balance antes de la transacción
  balanceAfter: number; // Balance después de la transacción
  paymentMethod?: string; // 'cash' | 'card' | 'transfer' (solo para payments)
  saleId?: string; // ID de venta (si type = 'charge')
  dueDate?: Date; // Fecha de vencimiento (si type = 'charge')
  notes?: string; // Notas adicionales
  createdBy: string; // UID del usuario
  createdAt: Date;
}
```

**Índices necesarios** (Firestore):

- `storeId + customerId + createdAt DESC`
- `storeId + type + dueDate ASC` (para alertas de vencimiento)

---

### Colección: `supplier_transactions`

```typescript
interface SupplierTransaction {
  id: string;
  storeId: string;
  supplierId: string; // Referencia a suppliers
  type: 'charge' | 'payment'; // cargo (compra a crédito) o pago
  amount: number; // Monto (positivo para charge, positivo para payment)
  balanceBefore: number; // Balance antes de la transacción
  balanceAfter: number; // Balance después de la transacción
  paymentMethod?: string; // 'cash' | 'card' | 'transfer' (solo para payments)
  purchaseOrderId?: string; // ID de orden de compra (futuro)
  dueDate?: Date; // Fecha de vencimiento (si type = 'charge')
  notes?: string; // Notas adicionales
  createdBy: string; // UID del usuario
  createdAt: Date;
}
```

**Índices necesarios** (Firestore):

- `storeId + supplierId + createdAt DESC`
- `storeId + type + dueDate ASC` (para alertas de vencimiento)

---

### Modificación: Colección `sales`

Agregar campos para soportar ventas a crédito:

```typescript
interface Sale {
  // ... campos existentes
  paymentStatus: 'paid' | 'credit' | 'partial'; // NUEVO
  creditDueDate?: Date; // NUEVO (si paymentStatus = 'credit')
  amountPaid?: number; // NUEVO (para partial)
  amountDue?: number; // NUEVO (para partial/credit)
}
```

**Migración**: No requiere migración de datos existentes (campos opcionales).

---

## 🗂️ Estructura de Archivos

### Archivos a Crear (14 archivos)

```
tienda-web/
├── types/
│   └── transaction.ts                              # 1. Interfaces TypeScript
│
├── lib/
│   ├── customerTransactions.ts                     # 2. CRUD transacciones de clientes
│   ├── supplierTransactions.ts                     # 3. CRUD transacciones de proveedores
│   └── accountsReceivable.ts                       # 4. Lógica de negocio (aging, vencidas)
│
├── store/
│   ├── customerTransactionsStore.ts                # 5. Zustand store
│   └── supplierTransactionsStore.ts                # 6. Zustand store
│
├── components/
│   └── transactions/
│       ├── CustomerPaymentForm.tsx                 # 7. Formulario abono cliente
│       ├── CustomerTransactionsList.tsx            # 8. Historial transacciones cliente
│       ├── SupplierPaymentForm.tsx                 # 9. Formulario pago proveedor
│       ├── SupplierTransactionsList.tsx            # 10. Historial transacciones proveedor
│       └── AccountStatusPDF.tsx                    # 11. Generador PDF estado de cuenta
│
└── app/
    └── dashboard/
        ├── accounts-receivable/
        │   └── page.tsx                            # 12. Página cuentas por cobrar
        └── accounts-payable/
            └── page.tsx                            # 13. Página cuentas por pagar
```

### Archivos a Modificar (4 archivos)

```
tienda-web/
├── types/
│   └── sale.ts                                     # Agregar paymentStatus, creditDueDate
│
├── lib/
│   └── sales.ts                                    # createSale() con soporte crédito
│
├── app/
│   └── dashboard/
│       ├── pos/
│       │   └── page.tsx                            # Agregar opción "Venta a Crédito"
│       └── layout.tsx                              # Agregar links "Cuentas x Cobrar/Pagar"
```

---

## 📝 Plan de Implementación Detallado

### FASE 5.1: Tipos y Servicios Base (8h)

#### Tarea 1.1: Crear tipos TypeScript (1h)

**Archivo**: `types/transaction.ts`

```typescript
export type TransactionType = 'charge' | 'payment';
export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface CustomerTransaction {
  id: string;
  storeId: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentMethod?: PaymentMethod;
  saleId?: string;
  dueDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface CustomerTransactionFormData {
  type: TransactionType;
  amount: number;
  paymentMethod?: PaymentMethod;
  saleId?: string;
  dueDate?: Date;
  notes?: string;
}

export interface SupplierTransaction {
  id: string;
  storeId: string;
  supplierId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentMethod?: PaymentMethod;
  purchaseOrderId?: string;
  dueDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface SupplierTransactionFormData {
  type: TransactionType;
  amount: number;
  paymentMethod?: PaymentMethod;
  purchaseOrderId?: string;
  dueDate?: Date;
  notes?: string;
}

export interface AccountStatus {
  customerId?: string;
  supplierId?: string;
  name: string;
  document?: string;
  currentBalance: number;
  transactions: (CustomerTransaction | SupplierTransaction)[];
  totalCharges: number;
  totalPayments: number;
  overdueAmount: number; // Monto vencido
  overdueCount: number; // Cantidad de cargos vencidos
}
```

---

#### Tarea 1.2: Servicio de transacciones de clientes (3h)

**Archivo**: `lib/customerTransactions.ts`

**Funciones principales**:

```typescript
// Crear abono de cliente (disminuye balance)
async function createCustomerPayment(
  storeId: string,
  customerId: string,
  data: CustomerTransactionFormData,
  userId: string
): Promise<CustomerTransaction>;

// Crear cargo de cliente (aumenta balance, asociado a venta a crédito)
async function createCustomerCharge(
  storeId: string,
  customerId: string,
  saleId: string,
  amount: number,
  dueDate: Date,
  userId: string
): Promise<CustomerTransaction>;

// Obtener transacciones de un cliente
async function getCustomerTransactions(
  customerId: string
): Promise<CustomerTransaction[]>;

// Obtener estado de cuenta de un cliente
async function getCustomerAccountStatus(
  customerId: string
): Promise<AccountStatus>;

// Obtener clientes con saldo vencido
async function getOverdueCustomers(storeId: string): Promise<AccountStatus[]>;
```

**Lógica crítica**:

```typescript
// createCustomerPayment() debe usar runTransaction()
await runTransaction(db, async (transaction) => {
  // 1. Obtener cliente actual
  const customerDoc = await transaction.get(customerRef);
  const currentBalance = customerDoc.data().balance;

  // 2. Validar que amount <= currentBalance
  if (data.amount > currentBalance) {
    throw new Error(
      `El abono ($${data.amount}) no puede ser mayor al saldo ($${currentBalance})`
    );
  }

  // 3. Calcular nuevo balance
  const newBalance = await updateCustomerBalance(customerId, -data.amount);

  // 4. Crear registro de transacción
  const transactionData = {
    storeId,
    customerId,
    type: 'payment',
    amount: data.amount,
    balanceBefore: currentBalance,
    balanceAfter: newBalance,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
    createdBy: userId,
    createdAt: Timestamp.now(),
  };

  const newDocRef = doc(collection(db, 'customer_transactions'));
  transaction.set(newDocRef, transactionData);

  return newDocRef.id;
});
```

---

#### Tarea 1.3: Servicio de transacciones de proveedores (3h)

**Archivo**: `lib/supplierTransactions.ts`

**Funciones principales**:

```typescript
// Crear pago a proveedor (disminuye balance)
async function createSupplierPayment(
  storeId: string,
  supplierId: string,
  data: SupplierTransactionFormData,
  userId: string
): Promise<SupplierTransaction>;

// Crear cargo de proveedor (aumenta balance, compra a crédito)
async function createSupplierCharge(
  storeId: string,
  supplierId: string,
  amount: number,
  dueDate: Date,
  userId: string
): Promise<SupplierTransaction>;

// Obtener transacciones de un proveedor
async function getSupplierTransactions(
  supplierId: string
): Promise<SupplierTransaction[]>;

// Obtener estado de cuenta de un proveedor
async function getSupplierAccountStatus(
  supplierId: string
): Promise<AccountStatus>;

// Obtener proveedores con saldo por vencer (próximos 7 días)
async function getUpcomingPayables(storeId: string): Promise<AccountStatus[]>;
```

**Lógica similar a customerTransactions** usando `updateSupplierBalance()`.

---

#### Tarea 1.4: Servicio de lógica de negocio (1h)

**Archivo**: `lib/accountsReceivable.ts`

```typescript
// Calcular aging de cartera (0-30, 31-60, 61-90, 90+ días)
export function calculateAging(transactions: CustomerTransaction[]): {
  current: number; // 0-30 días
  days30: number; // 31-60 días
  days60: number; // 61-90 días
  days90: number; // 90+ días
};

// Obtener resumen de cuentas por cobrar
export async function getReceivablesSummary(storeId: string): Promise<{
  totalReceivable: number;
  overdueAmount: number;
  currentAmount: number;
  customersWithBalance: number;
  agingData: ReturnType<typeof calculateAging>;
}>;

// Similar para cuentas por pagar
export async function getPayablesSummary(storeId: string): Promise<{
  totalPayable: number;
  overdueAmount: number;
  upcomingAmount: number;
  suppliersWithBalance: number;
}>;
```

---

### FASE 5.2: Zustand Stores (2h)

#### Tarea 2.1: Store de transacciones de clientes (1h)

**Archivo**: `store/customerTransactionsStore.ts`

```typescript
interface CustomerTransactionsState {
  transactions: CustomerTransaction[];
  loading: boolean;
  error: string | null;

  // Actions
  setTransactions: (transactions: CustomerTransaction[]) => void;
  addTransaction: (transaction: CustomerTransaction) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useCustomerTransactionsStore = create<CustomerTransactionsState>(
  (set) => ({
    transactions: [],
    loading: false,
    error: null,

    setTransactions: (transactions) => set({ transactions }),
    addTransaction: (transaction) =>
      set((state) => ({
        transactions: [transaction, ...state.transactions],
      })),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    reset: () => set({ transactions: [], loading: false, error: null }),
  })
);
```

---

#### Tarea 2.2: Store de transacciones de proveedores (1h)

**Archivo**: `store/supplierTransactionsStore.ts`

Similar estructura a `customerTransactionsStore.ts`.

---

### FASE 5.3: Componentes UI (12h)

#### Tarea 3.1: Formulario de abono de cliente (2h)

**Archivo**: `components/transactions/CustomerPaymentForm.tsx`

**Props**:

```typescript
interface CustomerPaymentFormProps {
  customer: Customer; // Cliente con balance actual
  onSuccess: () => void;
  onCancel: () => void;
}
```

**Campos**:

- Monto (number, validar <= customer.balance)
- Método de pago (select: cash, card, transfer)
- Notas (textarea, opcional)

**Validación Zod**:

```typescript
const schema = z.object({
  amount: z
    .number()
    .positive('El monto debe ser positivo')
    .max(
      customer.balance,
      `No puede exceder el saldo actual ($${customer.balance})`
    ),
  paymentMethod: z.enum(['cash', 'card', 'transfer']),
  notes: z.string().optional(),
});
```

**Al enviar**:

1. Validar formulario
2. Llamar `createCustomerPayment()`
3. Actualizar `customersStore` (nuevo balance)
4. Actualizar `customerTransactionsStore`
5. Mostrar toast de éxito
6. Llamar `onSuccess()`

---

#### Tarea 3.2: Lista de transacciones de cliente (2h)

**Archivo**: `components/transactions/CustomerTransactionsList.tsx`

**Props**:

```typescript
interface CustomerTransactionsListProps {
  customerId: string;
}
```

**Funcionalidad**:

- TanStack Table con columnas: Fecha, Tipo (Cargo/Abono), Monto, Método, Balance Después, Notas
- Ordenamiento por fecha (DESC por defecto)
- Paginación (10 items/página)
- Filtro por tipo (charge/payment)
- Indicador visual de cargos vencidos (texto rojo)

**Carga de datos**:

```typescript
useEffect(() => {
  const loadTransactions = async () => {
    const transactions = await getCustomerTransactions(customerId);
    setTransactions(transactions);
  };
  loadTransactions();
}, [customerId]);
```

---

#### Tarea 3.3: Formulario de pago a proveedor (2h)

**Archivo**: `components/transactions/SupplierPaymentForm.tsx`

Similar a `CustomerPaymentForm.tsx` pero con `supplier` y `createSupplierPayment()`.

---

#### Tarea 3.4: Lista de transacciones de proveedor (2h)

**Archivo**: `components/transactions/SupplierTransactionsList.tsx`

Similar a `CustomerTransactionsList.tsx`.

---

#### Tarea 3.5: Generador de PDF de estado de cuenta (4h)

**Archivo**: `components/transactions/AccountStatusPDF.tsx`

**Props**:

```typescript
interface AccountStatusPDFProps {
  accountStatus: AccountStatus;
  type: 'customer' | 'supplier';
}
```

**Funcionalidad**:

- Botón "Descargar Estado de Cuenta"
- Genera PDF con jsPDF + jspdf-autotable
- Incluye:
  - Logo/nombre de la tienda
  - Datos del cliente/proveedor
  - Balance actual
  - Tabla de transacciones (fecha, tipo, monto, balance)
  - Total cargos, total abonos, saldo final
  - Aging (si es customer)

**Código ejemplo**:

```typescript
const generatePDF = () => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.text('Estado de Cuenta', 14, 20);

  doc.setFontSize(12);
  doc.text(`Cliente: ${accountStatus.name}`, 14, 30);
  doc.text(`Documento: ${accountStatus.document}`, 14, 37);
  doc.text(`Saldo Actual: $${accountStatus.currentBalance.toFixed(2)}`, 14, 44);

  // Tabla de transacciones
  autoTable(doc, {
    startY: 55,
    head: [['Fecha', 'Tipo', 'Monto', 'Balance']],
    body: accountStatus.transactions.map((t) => [
      format(t.createdAt, 'dd/MM/yyyy'),
      t.type === 'charge' ? 'Cargo' : 'Abono',
      `$${t.amount.toFixed(2)}`,
      `$${t.balanceAfter.toFixed(2)}`,
    ]),
  });

  doc.save(`estado-cuenta-${accountStatus.name}.pdf`);
};
```

---

### FASE 5.4: Páginas de Dashboard (10h)

#### Tarea 4.1: Página Cuentas por Cobrar (5h)

**Archivo**: `app/dashboard/accounts-receivable/page.tsx`

**Estructura**:

```tsx
export default function AccountsReceivablePage() {
  // KPIs en la parte superior (3 cards)
  // - Total por Cobrar
  // - Saldo Vencido
  // - Clientes con Saldo

  // Tabs:
  // - Tab 1: "Clientes con Saldo" (tabla de clientes filtrados por balance > 0)
  // - Tab 2: "Cuentas Vencidas" (solo clientes con cargos vencidos)
  // - Tab 3: "Aging de Cartera" (gráfico de barras 0-30, 31-60, 61-90, 90+)

  return (
    <div>
      <h1>Cuentas por Cobrar</h1>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>Total por Cobrar</CardHeader>
          <CardContent>${totalReceivable}</CardContent>
        </Card>
        <Card>
          <CardHeader>Saldo Vencido</CardHeader>
          <CardContent className="text-red-600">${overdueAmount}</CardContent>
        </Card>
        <Card>
          <CardHeader>Clientes con Saldo</CardHeader>
          <CardContent>{customersWithBalance}</CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Clientes con Saldo</TabsTrigger>
          <TabsTrigger value="overdue">Vencidas</TabsTrigger>
          <TabsTrigger value="aging">Aging</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <CustomersWithBalanceTable />
        </TabsContent>

        <TabsContent value="overdue">
          <OverdueCustomersTable />
        </TabsContent>

        <TabsContent value="aging">
          <AgingChart data={agingData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Tabla de Clientes con Saldo**:

- Columnas: Nombre, Documento, Balance, Último Movimiento, Acciones
- Acción: "Ver Estado de Cuenta" → Dialog con `CustomerTransactionsList` + botón PDF
- Acción: "Registrar Abono" → Dialog con `CustomerPaymentForm`
- Ordenamiento por balance DESC por defecto
- Búsqueda por nombre/documento

**Tabla de Vencidas**:

- Similar pero filtrada por `overdueAmount > 0`
- Columna adicional: "Días Vencidos" (color rojo si > 30 días)

**Gráfico Aging**:

- Recharts BarChart con 4 barras (0-30, 31-60, 61-90, 90+)
- Eje Y: Monto en USD
- Eje X: Rangos de días

---

#### Tarea 4.2: Página Cuentas por Pagar (5h)

**Archivo**: `app/dashboard/accounts-payable/page.tsx`

**Estructura similar a Accounts Receivable**:

```tsx
export default function AccountsPayablePage() {
  // KPIs:
  // - Total por Pagar
  // - Por Vencer (próximos 7 días)
  // - Proveedores con Saldo

  // Tabs:
  // - Tab 1: "Proveedores con Saldo"
  // - Tab 2: "Por Vencer" (próximos 7 días)

  return (
    <div>
      <h1>Cuentas por Pagar</h1>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>Total por Pagar</CardHeader>
          <CardContent>${totalPayable}</CardContent>
        </Card>
        <Card>
          <CardHeader>Por Vencer (7 días)</CardHeader>
          <CardContent className="text-yellow-600">
            ${upcomingAmount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Proveedores con Saldo</CardHeader>
          <CardContent>{suppliersWithBalance}</CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Proveedores con Saldo</TabsTrigger>
          <TabsTrigger value="upcoming">Por Vencer</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <SuppliersWithBalanceTable />
        </TabsContent>

        <TabsContent value="upcoming">
          <UpcomingSuppliersTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Tabla de Proveedores con Saldo**:

- Columnas: Nombre, RIF, Balance, Último Movimiento, Acciones
- Acción: "Ver Estado de Cuenta" → Dialog con `SupplierTransactionsList` + botón PDF
- Acción: "Registrar Pago" → Dialog con `SupplierPaymentForm`

**Tabla Por Vencer**:

- Filtrada por cargos con `dueDate <= hoy + 7 días AND balance > 0`
- Columna adicional: "Vence en" (días restantes, color amarillo si < 3 días)

---

### FASE 5.5: Integración con POS (Ventas a Crédito) (6h)

#### Tarea 5.1: Modificar tipo Sale (30min)

**Archivo**: `types/sale.ts`

```typescript
export interface Sale {
  // ... campos existentes
  paymentStatus: 'paid' | 'credit' | 'partial';
  creditDueDate?: Date; // Requerido si paymentStatus = 'credit'
  amountPaid?: number; // Usado en paymentStatus = 'partial'
  amountDue?: number; // Usado en paymentStatus = 'credit' o 'partial'
}

export interface SaleFormData {
  // ... campos existentes
  paymentStatus: 'paid' | 'credit';
  creditDueDate?: Date;
  customerId?: string; // Requerido si paymentStatus = 'credit'
}
```

---

#### Tarea 5.2: Modificar servicio de ventas (2h)

**Archivo**: `lib/sales.ts`

**Modificar `createSale()`**:

```typescript
export async function createSale(
  storeId: string,
  data: SaleFormData,
  userId: string
): Promise<Sale> {
  // Validar que si paymentStatus = 'credit', debe tener customerId y creditDueDate
  if (data.paymentStatus === 'credit') {
    if (!data.customerId) {
      throw new Error('Debe seleccionar un cliente para ventas a crédito');
    }
    if (!data.creditDueDate) {
      throw new Error('Debe especificar fecha de vencimiento');
    }
  }

  return await runTransaction(db, async (transaction) => {
    // 1. Crear venta (igual que antes)
    const saleData = {
      storeId,
      ...data,
      paymentStatus: data.paymentStatus,
      creditDueDate: data.creditDueDate,
      amountDue: data.paymentStatus === 'credit' ? data.total : 0,
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const saleRef = doc(collection(db, 'sales'));
    transaction.set(saleRef, saleData);

    // 2. Actualizar inventario (igual que antes)
    for (const item of data.items) {
      // ...reducir stock
    }

    // 3. Si es venta a crédito, crear cargo en customer_transactions
    if (data.paymentStatus === 'credit' && data.customerId) {
      // Crear cargo
      await createCustomerCharge(
        storeId,
        data.customerId,
        saleRef.id,
        data.total,
        data.creditDueDate,
        userId
      );

      // Actualizar balance del cliente
      await updateCustomerBalance(data.customerId, +data.total);
    }

    return saleRef.id;
  });
}
```

---

#### Tarea 5.3: Modificar UI del POS (3.5h)

**Archivo**: `app/dashboard/pos/page.tsx`

**Cambios**:

1. Agregar toggle "Venta a Crédito" en la sección de pago
2. Si "Venta a Crédito" está activado:
   - Mostrar campo "Cliente" (select con clientes del store)
   - Mostrar campo "Fecha de Vencimiento" (date picker)
   - Ocultar campos de método de pago (no aplica para crédito)
3. Al procesar venta:
   - Si crédito: Llamar `createSale()` con `paymentStatus: 'credit'`
   - Si contado: Llamar `createSale()` con `paymentStatus: 'paid'`

**Código ejemplo**:

```tsx
const [isCreditSale, setIsCreditSale] = useState(false);
const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
const [creditDueDate, setCreditDueDate] = useState<Date | null>(null);

// En el UI de pago
<div className="payment-section">
  <Label>
    <input
      type="checkbox"
      checked={isCreditSale}
      onChange={(e) => setIsCreditSale(e.target.checked)}
    />
    Venta a Crédito
  </Label>

  {isCreditSale && (
    <>
      <Select
        value={selectedCustomer}
        onValueChange={setSelectedCustomer}
      >
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar cliente" />
        </SelectTrigger>
        <SelectContent>
          {customers.map(c => (
            <SelectItem key={c.id} value={c.id}>
              {c.name} ({c.document})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={creditDueDate ? format(creditDueDate, 'yyyy-MM-dd') : ''}
        onChange={(e) => setCreditDueDate(new Date(e.target.value))}
        placeholder="Fecha de vencimiento"
      />
    </>
  )}

  {!isCreditSale && (
    // Campos de método de pago existentes
  )}
</div>
```

---

### FASE 5.6: Navegación y Layout (1h)

#### Tarea 6.1: Agregar links al sidebar (1h)

**Archivo**: `app/dashboard/layout.tsx`

Agregar 2 nuevos enlaces en el sidebar:

```tsx
<nav>
  {/* ... enlaces existentes */}
  <Link href="/dashboard/customers">Clientes</Link>
  <Link href="/dashboard/suppliers">Proveedores</Link>

  {/* NUEVOS */}
  <Link href="/dashboard/accounts-receivable">
    <ReceiptIcon /> Cuentas x Cobrar
  </Link>
  <Link href="/dashboard/accounts-payable">
    <FileTextIcon /> Cuentas x Pagar
  </Link>
</nav>
```

---

### FASE 5.7: Documentación y Testing (1h)

#### Tarea 7.1: Actualizar CHANGELOG.md

Agregar sección `[0.5.0] - 2026-08-XX - Fase 5: Cuentas por Cobrar/Pagar`.

#### Tarea 7.2: Crear FASE-5-IMPLEMENTATION.md

Similar a `FASE-4-IMPLEMENTATION.md`.

---

## ⚠️ Riesgos y Mitigaciones

### Riesgo 1: Inconsistencias en Balances

**Descripción**: Si `updateCustomerBalance()` falla pero la transacción se guarda, los balances quedan inconsistentes.

**Probabilidad**: Media  
**Impacto**: Crítico

**Mitigación**:

- ✅ Usar `runTransaction()` para agrupar:
  1. Crear registro en `customer_transactions`
  2. Llamar `updateCustomerBalance()`
  3. Si cualquiera falla, ambos hacen rollback
- ✅ Ya implementado en Fase 4 (BUG-108, BUG-109 corregidos)

---

### Riesgo 2: Abono Mayor que Saldo

**Descripción**: Usuario intenta abonar más del saldo actual.

**Probabilidad**: Media  
**Impacto**: Medio

**Mitigación**:

- ✅ Validación en `createCustomerPayment()`: `if (amount > currentBalance) throw Error`
- ✅ Validación en formulario Zod: `max(customer.balance)`
- ✅ UI muestra saldo actual en tiempo real

---

### Riesgo 3: Ventas a Crédito sin Cliente

**Descripción**: Usuario intenta hacer venta a crédito sin seleccionar cliente.

**Probabilidad**: Alta  
**Impacto**: Medio

**Mitigación**:

- ✅ Validación en `createSale()`: Requiere `customerId` si `paymentStatus = 'credit'`
- ✅ UI deshabilita botón "Procesar Venta" si falta cliente o fecha

---

### Riesgo 4: Performance con Muchos Clientes

**Descripción**: Cargar todos los clientes en el select del POS puede ser lento si hay 10,000+ clientes.

**Probabilidad**: Baja (mayoría de tiendas < 1000 clientes)  
**Impacto**: Bajo

**Mitigación**:

- ⏳ Implementar búsqueda con `limit(50)` en lugar de cargar todos
- ⏳ Usar Combobox con búsqueda en lugar de Select
- ⏳ **Decisión**: Dejar para backlog, solo aplicar si el cliente reporta lentitud

---

## ✅ Criterios de Aceptación

### Funcionales

- [ ] Usuario puede procesar venta a crédito seleccionando cliente y fecha de vencimiento
- [ ] Sistema actualiza balance del cliente automáticamente al crear venta a crédito
- [ ] Usuario puede registrar abono de cliente desde "Cuentas por Cobrar"
- [ ] Sistema actualiza balance del cliente automáticamente al registrar abono
- [ ] Usuario puede ver estado de cuenta de un cliente con historial de transacciones
- [ ] Usuario puede descargar estado de cuenta en PDF
- [ ] Sistema muestra alertas de cuentas vencidas en "Cuentas por Cobrar"
- [ ] Usuario puede registrar pago a proveedor desde "Cuentas por Pagar"
- [ ] Sistema actualiza balance del proveedor automáticamente al registrar pago
- [ ] Sistema muestra aging de cartera (0-30, 31-60, 61-90, 90+ días)
- [ ] KPIs de "Cuentas por Cobrar" y "Cuentas por Pagar" son precisos

### Técnicos

- [ ] Todas las transacciones usan `runTransaction()` para atomicidad
- [ ] 0 errores TypeScript
- [ ] Build exitoso
- [ ] Índices Firestore creados para queries eficientes
- [ ] Validaciones de negocio funcionan (abono <= saldo, venta a crédito requiere cliente)

---

## 📊 Métricas de Éxito

- **Tiempo real vs estimado**: 40h estimadas
- **Archivos creados**: 14 archivos nuevos
- **Archivos modificados**: 4 archivos
- **Colecciones Firestore**: 2 nuevas (`customer_transactions`, `supplier_transactions`)
- **Índices Firestore**: 4 nuevos
- **Rutas nuevas**: 2 (`/dashboard/accounts-receivable`, `/dashboard/accounts-payable`)
- **Funciones críticas con `runTransaction()`**: 4 (createCustomerPayment, createCustomerCharge, createSupplierPayment, createSupplierCharge)

---

## 🚀 Siguiente Fase

Después de Fase 5, continuar con:

**Fase 6: Reportes y Dashboard Final**

- Gráficos de ventas con Recharts
- Reportes de inventario con filtros
- Reportes financieros completos
- Exportación a Excel
- Dashboard interactivo con datos reales

---

**Plan creado por**: @planificador  
**Fecha**: 2026-08-07  
**Estado**: ✅ LISTO PARA IMPLEMENTACIÓN
