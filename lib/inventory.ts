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
  StockAlert,
} from '@/types/inventory';
import { getProductById } from './products';

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
    let movementId: string = '';
    let createdMovement: any = null;

    // ✅ FIX BUG-101: Usar transacción para TODO, incluyendo lectura inicial
    await runTransaction(db, async (transaction) => {
      const productRef = doc(db, 'products', data.productId);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists()) {
        throw new Error('Producto no encontrado');
      }

      const product = productDoc.data() as any;

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

      // Guardar datos para retornar
      createdMovement = {
        id: movementId,
        ...movementData,
        createdAt: new Date(),
      };

      // Guardar datos para verificar alerta después de transacción
      createdMovement.productName = product.name;
      createdMovement.productCode = product.code;
      createdMovement.stockMin = product.stockMin;
    });

    // ✅ FIX BUG-102: Verificar alerta DESPUÉS de transacción, sin bloquear
    try {
      await checkStockAlert(
        storeId,
        data.productId,
        createdMovement.productName,
        createdMovement.productCode,
        createdMovement.stockAfter,
        createdMovement.stockMin
      );
    } catch (alertError: any) {
      // No bloquear operación principal, pero loggear advertencia
      console.warn('⚠️ Movimiento guardado pero alerta falló:', alertError.message);
    }

    return createdMovement as InventoryMovement;
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
    let q;

    if (productId) {
      q = query(
        collection(db, MOVEMENTS_COLLECTION),
        where('storeId', '==', storeId),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, MOVEMENTS_COLLECTION),
        where('storeId', '==', storeId),
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
 * ✅ FIX BUG-103: Eliminar double reverse innecesario
 */
export async function generateKardex(
  storeId: string,
  productId: string
): Promise<KardexEntry[]> {
  try {
    const movements = await getInventoryMovements(storeId, productId);

    const kardex: KardexEntry[] = [];

    // ✅ FIX BUG-103: No mutar array original, usar slice().reverse()
    const movementsChronological = movements.slice().reverse();

    movementsChronological.forEach((movement) => {
      const entry: KardexEntry = {
        date: movement.createdAt,
        // ✅ FIX BUG-109: Mejorar formato de referencia
        reference: movement.reference || `MOV-${movement.id.substring(0, 8).toUpperCase()}`,
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

/**
 * Verificar y crear alerta de stock bajo
 * ✅ FIX BUG-102: Lanza errores en vez de fallar silenciosamente
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
    // ✅ FIX BUG-107: Cambiar <= a < para consistencia
    if (currentStock < minStock) {
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
        console.log(`✅ Alerta creada: ${productCode} (Stock: ${currentStock} < Min: ${minStock})`);
      } else {
        // Actualizar stock en alerta existente
        const alertDoc = existingAlerts.docs[0];
        await updateDoc(doc(db, ALERTS_COLLECTION, alertDoc.id), {
          currentStock,
        });
        console.log(`✅ Alerta actualizada: ${productCode} (Stock: ${currentStock})`);
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
        console.log(`✅ Alerta resuelta: ${productCode} (Stock: ${currentStock})`);
      }
    }
  } catch (error: any) {
    console.error('Error verificando alerta de stock:', error);
    // ✅ FIX BUG-102: Lanzar error para que caller pueda manejarlo
    throw new Error(`Error al gestionar alerta: ${error.message}`);
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
 * ✅ FIX BUG-104: Validar categoría antes de usar como key
 */
export async function calculateInventoryValuation(storeId: string): Promise<{
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

      // ✅ FIX BUG-104: Validar categoría antes de usar como key
      const category = product.category || 'Sin Categoría';

      if (!byCategory[category]) {
        byCategory[category] = 0;
      }
      byCategory[category] += value;
    });

    return { totalValue, totalItems, byCategory };
  } catch (error) {
    console.error('Error calculando valorización:', error);
    throw error;
  }
}
