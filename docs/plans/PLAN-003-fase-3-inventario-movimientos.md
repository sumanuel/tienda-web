# PLAN-003: Fase 3 - Inventario y Movimientos

**Fecha**: 2026-07-31  
**Planificador**: Sistema Planificador  
**Fase**: 3 de 7  
**Dependencias**: Fase 2 (POS y Productos) completada  
**Estimación**: 5 días (40 horas)

---

## 📋 Resumen

Implementar el módulo completo de control de inventario con registro de entradas, salidas, ajustes, historial de movimientos, kardex por producto y alertas de stock bajo.

---

## 🎯 Objetivos de la Fase

1. Registrar entradas de inventario (compras, ajustes positivos)
2. Registrar salidas de inventario (ajustes negativos, mermas)
3. Mantener historial completo de movimientos por producto
4. Mostrar kardex detallado con saldos
5. Sistema de alertas de stock bajo
6. Reportes de valorización de inventario

---

## 🗂️ Arquitectura de Datos

### Colección Firestore: `inventory_movements`

```typescript
interface InventoryMovement {
  id: string;
  storeId: string;
  productId: string;
  productName: string; // Desnormalizado para reportes
  productCode: string; // Desnormalizado para reportes
  type: 'entry' | 'exit' | 'adjustment' | 'sale';
  quantity: number; // Positivo para entradas, negativo para salidas
  stockBefore: number;
  stockAfter: number;
  unitCost?: number; // Costo unitario en el movimiento
  totalCost?: number; // quantity * unitCost
  reference?: string; // ID de venta, compra, etc.
  supplierId?: string; // Para entradas de compras
  supplierName?: string;
  reason?: string; // Razón del ajuste/salida
  notes?: string;
  userId: string; // Usuario que registró el movimiento
  userName: string; // Desnormalizado
  createdAt: Date;
}
```

### Colección Firestore: `stock_alerts`

```typescript
interface StockAlert {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  productCode: string;
  currentStock: number;
  minStock: number;
  status: 'active' | 'resolved';
  resolvedAt?: Date;
  createdAt: Date;
}
```

---

## 📐 Tareas de Implementación

### Tarea 1: Tipos TypeScript

**Archivos**:

- `types/inventory.ts` (crear)

**Contenido**:

```typescript
export type MovementType = 'entry' | 'exit' | 'adjustment' | 'sale';

export interface InventoryMovement {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  productCode: string;
  type: MovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  unitCost?: number;
  totalCost?: number;
  reference?: string;
  supplierId?: string;
  supplierName?: string;
  reason?: string;
  notes?: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface StockAlert {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  productCode: string;
  currentStock: number;
  minStock: number;
  status: 'active' | 'resolved';
  resolvedAt?: Date;
  createdAt: Date;
}

export interface InventoryMovementFormData {
  productId: string;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  supplierId?: string;
  reason?: string;
  notes?: string;
}

export interface KardexEntry {
  date: Date;
  reference: string;
  type: string;
  quantityIn: number;
  quantityOut: number;
  balance: number;
  unitCost?: number;
  totalCost?: number;
}
```

**Tiempo estimado**: 1 hora

---

### Tarea 2: Servicios de Inventario

**Archivos**:

- `lib/inventory.ts` (crear)

**Funciones**:

```typescript
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  runTransaction,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  InventoryMovement,
  InventoryMovementFormData,
  KardexEntry,
} from '@/types/inventory';
import { getProductById, updateProductStock } from './products';

const MOVEMENTS_COLLECTION = 'inventory_movements';
const ALERTS_COLLECTION = 'stock_alerts';

/**
 * Convierte Firestore Timestamp a Date
 */
function convertTimestamps(data: any): any {
  const converted = { ...data };
  if (converted.createdAt instanceof Timestamp) {
    converted.createdAt = converted.createdAt.toDate();
  }
  if (converted.resolvedAt instanceof Timestamp) {
    converted.resolvedAt = converted.resolvedAt.toDate();
  }
  return converted;
}

/**
 * Registrar movimiento de inventario con transacción
 */
export async function registerInventoryMovement(
  storeId: string,
  userId: string,
  userName: string,
  data: InventoryMovementFormData
): Promise<InventoryMovement> {
  try {
    // Obtener producto actual
    const product = await getProductById(data.productId);

    if (!product) {
      throw new Error('Producto no encontrado');
    }

    // Calcular nueva cantidad
    const quantityChange =
      data.type === 'entry' ? data.quantity : -data.quantity;
    const newStock = product.stock + quantityChange;

    if (newStock < 0) {
      throw new Error('Stock insuficiente para la salida');
    }

    // Usar transacción para atomicidad
    const movementId = await runTransaction(db, async (transaction) => {
      const productRef = doc(db, 'products', data.productId);

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
        unitCost: data.unitCost,
        totalCost: data.unitCost
          ? data.unitCost * Math.abs(quantityChange)
          : undefined,
        supplierId: data.supplierId,
        reason: data.reason,
        notes: data.notes,
        userId,
        userName,
        createdAt: Timestamp.now(),
      };

      const movementRef = doc(collection(db, MOVEMENTS_COLLECTION));
      transaction.set(movementRef, movementData);

      return movementRef.id;
    });

    // Verificar alerta de stock bajo
    await checkStockAlert(
      storeId,
      product.id,
      product.name,
      product.code,
      newStock,
      product.stockMin
    );

    // Obtener movimiento creado
    const movements = await getDocs(
      query(collection(db, MOVEMENTS_COLLECTION), where('id', '==', movementId))
    );

    const movementDoc = movements.docs[0];
    return {
      id: movementDoc.id,
      ...convertTimestamps(movementDoc.data()),
    } as InventoryMovement;
  } catch (error: any) {
    console.error('Error registrando movimiento:', error);
    throw new Error(error.message || 'Error al registrar movimiento');
  }
}

/**
 * Obtener movimientos de inventario por tienda
 */
export async function getInventoryMovements(
  storeId: string,
  productId?: string
): Promise<InventoryMovement[]> {
  try {
    let q = query(
      collection(db, MOVEMENTS_COLLECTION),
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    );

    if (productId) {
      q = query(
        collection(db, MOVEMENTS_COLLECTION),
        where('storeId', '==', storeId),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as InventoryMovement[];
  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    throw error;
  }
}

/**
 * Generar Kardex de producto
 */
export async function generateKardex(
  storeId: string,
  productId: string
): Promise<KardexEntry[]> {
  try {
    const movements = await getInventoryMovements(storeId, productId);

    const kardex: KardexEntry[] = [];

    movements.reverse().forEach((movement) => {
      const entry: KardexEntry = {
        date: movement.createdAt,
        reference: movement.reference || movement.id,
        type: movement.type,
        quantityIn: movement.quantity > 0 ? movement.quantity : 0,
        quantityOut: movement.quantity < 0 ? Math.abs(movement.quantity) : 0,
        balance: movement.stockAfter,
        unitCost: movement.unitCost,
        totalCost: movement.totalCost,
      };

      kardex.push(entry);
    });

    return kardex.reverse();
  } catch (error) {
    console.error('Error generando kardex:', error);
    throw error;
  }
}

/**
 * Verificar y crear alerta de stock bajo
 */
async function checkStockAlert(
  storeId: string,
  productId: string,
  productName: string,
  productCode: string,
  currentStock: number,
  minStock: number
): Promise<void> {
  try {
    if (currentStock <= minStock) {
      // Verificar si ya existe alerta activa
      const existingAlerts = await getDocs(
        query(
          collection(db, ALERTS_COLLECTION),
          where('storeId', '==', storeId),
          where('productId', '==', productId),
          where('status', '==', 'active')
        )
      );

      if (existingAlerts.empty) {
        // Crear nueva alerta
        await addDoc(collection(db, ALERTS_COLLECTION), {
          storeId,
          productId,
          productName,
          productCode,
          currentStock,
          minStock,
          status: 'active',
          createdAt: Timestamp.now(),
        });
      } else {
        // Actualizar stock en alerta existente
        const alertDoc = existingAlerts.docs[0];
        await updateDoc(doc(db, ALERTS_COLLECTION, alertDoc.id), {
          currentStock,
        });
      }
    } else {
      // Resolver alertas si stock subió por encima del mínimo
      const activeAlerts = await getDocs(
        query(
          collection(db, ALERTS_COLLECTION),
          where('storeId', '==', storeId),
          where('productId', '==', productId),
          where('status', '==', 'active')
        )
      );

      for (const alertDoc of activeAlerts.docs) {
        await updateDoc(doc(db, ALERTS_COLLECTION, alertDoc.id), {
          status: 'resolved',
          resolvedAt: Timestamp.now(),
        });
      }
    }
  } catch (error) {
    console.error('Error verificando alerta de stock:', error);
  }
}

/**
 * Obtener alertas de stock bajo activas
 */
export async function getStockAlerts(storeId: string): Promise<StockAlert[]> {
  try {
    const q = query(
      collection(db, ALERTS_COLLECTION),
      where('storeId', '==', storeId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as StockAlert[];
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    throw error;
  }
}

/**
 * Calcular valorización de inventario
 */
export async function calculateInventoryValuation(
  storeId: string
): Promise<{
  totalValue: number;
  totalItems: number;
  byCategory: Record<string, number>;
}> {
  try {
    const products = await getDocs(
      query(
        collection(db, 'products'),
        where('storeId', '==', storeId),
        where('trackInventory', '==', true)
      )
    );

    let totalValue = 0;
    let totalItems = 0;
    const byCategory: Record<string, number> = {};

    products.docs.forEach((doc) => {
      const product = doc.data();
      const value = product.stock * product.cost;

      totalValue += value;
      totalItems += product.stock;

      if (!byCategory[product.category]) {
        byCategory[product.category] = 0;
      }
      byCategory[product.category] += value;
    });

    return { totalValue, totalItems, byCategory };
  } catch (error) {
    console.error('Error calculando valorización:', error);
    throw error;
  }
}
```

**Tiempo estimado**: 6 horas

---

### Tarea 3: Store Zustand de Inventario

**Archivos**:

- `store/inventoryStore.ts` (crear)

**Contenido**:

```typescript
import { create } from 'zustand';
import { InventoryMovement, StockAlert } from '@/types/inventory';

interface InventoryState {
  movements: InventoryMovement[];
  alerts: StockAlert[];
  loading: boolean;
  error: string | null;

  // Actions
  setMovements: (movements: InventoryMovement[]) => void;
  addMovement: (movement: InventoryMovement) => void;
  setAlerts: (alerts: StockAlert[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  movements: [],
  alerts: [],
  loading: false,
  error: null,

  setMovements: (movements) => set({ movements }),
  addMovement: (movement) =>
    set((state) => ({ movements: [movement, ...state.movements] })),
  setAlerts: (alerts) => set({ alerts }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      movements: [],
      alerts: [],
      loading: false,
      error: null,
    }),
}));
```

**Tiempo estimado**: 1 hora

---

### Tarea 4: Componente MovementForm

**Archivos**:

- `components/inventory/MovementForm.tsx` (crear)

**Contenido**:

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InventoryMovementFormData, MovementType } from '@/types/inventory';
import { Product } from '@/types/product';

const movementSchema = z.object({
  productId: z.string().min(1, 'Producto es requerido'),
  type: z.enum(['entry', 'exit', 'adjustment']),
  quantity: z.number().min(1, 'Cantidad debe ser mayor a 0'),
  unitCost: z.number().min(0).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type MovementFormValues = z.infer<typeof movementSchema>;

interface MovementFormProps {
  products: Product[];
  onSubmit: (data: InventoryMovementFormData) => Promise<void>;
  onCancel: () => void;
}

export default function MovementForm({
  products,
  onSubmit,
  onCancel,
}: MovementFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: 'entry',
      quantity: 1,
    },
  });

  const movementType = watch('type');
  const productId = watch('productId');

  // Actualizar producto seleccionado
  React.useEffect(() => {
    if (productId) {
      const product = products.find((p) => p.id === productId);
      setSelectedProduct(product || null);
    }
  }, [productId, products]);

  const handleFormSubmit = async (data: MovementFormValues) => {
    setLoading(true);
    try {
      await onSubmit(data as InventoryMovementFormData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Tipo de Movimiento */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Tipo de Movimiento *
        </label>
        <select
          {...register('type')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="entry">Entrada (Compra/Ajuste Positivo)</option>
          <option value="exit">Salida (Merma/Ajuste Negativo)</option>
          <option value="adjustment">Ajuste General</option>
        </select>
      </div>

      {/* Producto */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Producto *
        </label>
        <select
          {...register('productId')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Seleccionar producto</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.code} - {product.name} (Stock actual: {product.stock})
            </option>
          ))}
        </select>
        {errors.productId && (
          <p className="mt-1 text-sm text-red-600">{errors.productId.message}</p>
        )}
      </div>

      {/* Info del Producto Seleccionado */}
      {selectedProduct && (
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-gray-700">
            <strong>Stock Actual:</strong> {selectedProduct.stock} unidades
          </p>
          <p className="text-sm text-gray-700">
            <strong>Stock Mínimo:</strong> {selectedProduct.stockMin} unidades
          </p>
          <p className="text-sm text-gray-700">
            <strong>Costo Unitario:</strong> ${selectedProduct.cost.toFixed(2)}
          </p>
        </div>
      )}

      {/* Cantidad */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Cantidad *
        </label>
        <input
          {...register('quantity', { valueAsNumber: true })}
          type="number"
          min="1"
          step="1"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.quantity && (
          <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
        )}
      </div>

      {/* Costo Unitario (solo para entradas) */}
      {movementType === 'entry' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Costo Unitario (opcional)
          </label>
          <input
            {...register('unitCost', { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            placeholder={selectedProduct ? `${selectedProduct.cost}` : '0.00'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Razón */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Razón
        </label>
        <input
          {...register('reason')}
          type="text"
          placeholder="Ej: Compra a proveedor, Producto dañado, Ajuste de inventario"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Notas */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Notas
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Registrando...' : 'Registrar Movimiento'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
```

**Tiempo estimado**: 3 horas

---

### Tarea 5: Componente MovementsTable

**Archivos**:

- `components/inventory/MovementsTable.tsx` (crear)

**Contenido**: Tabla TanStack con columnas para fecha, tipo, producto, cantidad, stock antes/después, razón, usuario.

**Tiempo estimado**: 2 horas

---

### Tarea 6: Componente KardexView

**Archivos**:

- `components/inventory/KardexView.tsx` (crear)

**Contenido**: Vista de kardex con entrada/salida/saldo por movimiento.

**Tiempo estimado**: 2 horas

---

### Tarea 7: Componente StockAlertsCard

**Archivos**:

- `components/inventory/StockAlertsCard.tsx` (crear)

**Contenido**: Tarjeta con lista de productos con stock bajo, enlace a detalle.

**Tiempo estimado**: 2 horas

---

### Tarea 8: Página de Movimientos de Inventario

**Archivos**:

- `app/dashboard/inventory/movements/page.tsx` (crear)

**Contenido**: Lista de movimientos con botón "Nuevo Movimiento", filtros por tipo y producto.

**Tiempo estimado**: 3 horas

---

### Tarea 9: Página de Kardex

**Archivos**:

- `app/dashboard/inventory/kardex/page.tsx` (crear)

**Contenido**: Selector de producto, vista de kardex completo, exportar a Excel.

**Tiempo estimado**: 3 horas

---

### Tarea 10: Página de Valorización

**Archivos**:

- `app/dashboard/inventory/valuation/page.tsx` (crear)

**Contenido**: Resumen de valorización total, por categoría, exportar reporte.

**Tiempo estimado**: 2 horas

---

### Tarea 11: Actualizar Sidebar

**Archivos**:

- `components/layout/Sidebar.tsx` (modificar)

**Cambios**: Agregar submenu "Inventario" con links a Movimientos, Kardex, Valorización, Alertas.

**Tiempo estimado**: 1 hora

---

### Tarea 12: Actualizar Dashboard con Alertas

**Archivos**:

- `app/dashboard/page.tsx` (modificar)

**Cambios**: Mostrar widget de alertas de stock bajo en dashboard principal.

**Tiempo estimado**: 2 horas

---

## 🧪 Criterios de Validación

### Funcionales

- [ ] Usuario puede registrar entrada de inventario con cantidad y costo
- [ ] Usuario puede registrar salida de inventario con razón
- [ ] Usuario puede ver lista de movimientos ordenados por fecha
- [ ] Usuario puede filtrar movimientos por producto
- [ ] Usuario puede ver kardex completo de un producto
- [ ] Sistema crea alerta cuando stock <= stock mínimo
- [ ] Sistema resuelve alerta cuando stock > stock mínimo
- [ ] Usuario puede ver valorización total de inventario
- [ ] Movimientos actualizan stock del producto atómicamente
- [ ] Widget de alertas aparece en dashboard

### Técnicos

- [ ] Transacciones Firestore para atomicidad
- [ ] Desnormalización de datos (nombre producto, etc.) para reportes
- [ ] Índices Firestore para queries eficientes
- [ ] Validación de stock insuficiente en salidas
- [ ] Cálculo correcto de valorización
- [ ] Kardex ordenado cronológicamente
- [ ] Exportación a Excel funcional

---

## 📊 Estimación de Tiempo

| Tarea                      | Horas   | Prioridad |
| -------------------------- | ------- | --------- |
| 1. Tipos TypeScript        | 1       | ALTA      |
| 2. Servicios de Inventario | 6       | CRÍTICA   |
| 3. Store Zustand           | 1       | ALTA      |
| 4. MovementForm            | 3       | CRÍTICA   |
| 5. MovementsTable          | 2       | ALTA      |
| 6. KardexView              | 2       | MEDIA     |
| 7. StockAlertsCard         | 2       | ALTA      |
| 8. Página Movimientos      | 3       | CRÍTICA   |
| 9. Página Kardex           | 3       | MEDIA     |
| 10. Página Valorización    | 2       | MEDIA     |
| 11. Actualizar Sidebar     | 1       | BAJA      |
| 12. Actualizar Dashboard   | 2       | ALTA      |
| **Buffer (20%)**           | 6       | -         |
| **TOTAL**                  | **34h** | -         |

**Estimación final**: 5 días hábiles (34 horas efectivas + 6 horas buffer)

---

## 🚨 Riesgos Identificados

### Riesgo 1: Performance con Miles de Movimientos

**Probabilidad**: Alta  
**Impacto**: Medio  
**Mitigación**:

- Paginación en lista de movimientos
- Índices Firestore optimizados
- Limit de resultados en queries (default 100)

### Riesgo 2: Race Conditions en Stock

**Probabilidad**: Media  
**Impacto**: Crítico  
**Mitigación**:

- Usar `runTransaction` en TODOS los movimientos
- Validar stock disponible ANTES de commit

### Riesgo 3: Alertas Duplicadas

**Probabilidad**: Media  
**Impacto**: Bajo  
**Mitigación**:

- Query de alertas activas antes de crear nueva
- Actualizar alerta existente si ya hay una

---

## 📝 Notas de Implementación

### Índices Firestore Requeridos

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "inventory_movements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "storeId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "inventory_movements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "storeId", "order": "ASCENDING" },
        { "fieldPath": "productId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stock_alerts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "storeId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Firestore Security Rules

```javascript
// Movimientos de inventario
match /inventory_movements/{movementId} {
  allow read: if request.auth != null
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId == resource.data.storeId;

  allow create: if request.auth != null
    && request.resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId
    && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner');

  allow update, delete: if false; // Movimientos son inmutables
}

// Alertas de stock
match /stock_alerts/{alertId} {
  allow read: if request.auth != null
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId == resource.data.storeId;

  allow write: if false; // Solo el sistema crea/actualiza alertas
}
```

---

## ✅ Checklist de Completitud

- [ ] Todos los archivos creados compilan sin errores
- [ ] Build de Next.js exitoso
- [ ] Tests manuales de registro de movimientos
- [ ] Tests manuales de generación de kardex
- [ ] Tests manuales de alertas de stock
- [ ] Validación de transacciones atómicas
- [ ] Verificación de índices Firestore
- [ ] Security Rules implementadas
- [ ] Documentación actualizada

---

**Fin del Plan de Fase 3**

**Preparado por**: Sistema Planificador  
**Fecha**: 2026-07-31  
**Próximo paso**: Implementación por @programador-senior
