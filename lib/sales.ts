import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { Sale, SaleItem } from '@/types/sale';
import { createCustomerCharge } from './customerTransactions';

const SALES_COLLECTION = 'sales';

/**
 * Convertir Firestore Timestamp a Date
 */
function convertTimestamps(data: any): any {
  const converted = { ...data };
  if (converted.createdAt instanceof Timestamp) {
    converted.createdAt = converted.createdAt.toDate();
  }
  if (converted.cancelledAt instanceof Timestamp) {
    converted.cancelledAt = converted.cancelledAt.toDate();
  }
  return converted;
}

/**
 * Generar número de venta correlativo
 */
async function generateSaleNumber(storeId: string): Promise<string> {
  const salesRef = collection(db, SALES_COLLECTION);
  const q = query(
    salesRef,
    where('storeId', '==', storeId),
    orderBy('saleNumber', 'desc')
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return '000001';
  }

  const lastNumber = snapshot.docs[0].data().saleNumber as string;
  const nextNumber = parseInt(lastNumber, 10) + 1;

  return nextNumber.toString().padStart(6, '0');
}

/**
 * Procesar venta (con actualización de inventario)
 */
export async function processSale(
  storeId: string,
  cashierId: string,
  cashierName: string,
  items: SaleItem[],
  currency: string,
  paymentMethod: 'cash' | 'card' | 'transfer' | 'credit',
  amountReceived?: number,
  customerId?: string,
  customerName?: string,
  creditDueDate?: Date // NUEVO - Fase 5
): Promise<Sale> {
  try {
    // Validar venta a crédito
    if (paymentMethod === 'credit') {
      if (!customerId) {
        throw new Error('Debe seleccionar un cliente para ventas a crédito');
      }
      if (!creditDueDate) {
        throw new Error(
          'Debe especificar fecha de vencimiento para ventas a crédito'
        );
      }
    }

    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = items.reduce((sum, item) => {
      const itemDiscount = item.quantity * item.price * (item.discount / 100);
      return sum + itemDiscount;
    }, 0);
    const tax = subtotal * 0.16; // IVA 16% (ajustar según país)
    const total = subtotal + tax;

    // Calcular cambio si es efectivo
    const change =
      paymentMethod === 'cash' && amountReceived ? amountReceived - total : 0;

    // Generar número de venta
    const saleNumber = await generateSaleNumber(storeId);

    // Determinar paymentStatus
    const paymentStatus = paymentMethod === 'credit' ? 'credit' : 'paid';

    // Crear venta
    const saleData = {
      storeId,
      saleNumber,
      customerId: customerId || null,
      customerName: customerName || null,
      cashierId,
      cashierName,
      items,
      subtotal,
      discount,
      tax,
      total,
      currency,
      exchangeRateSnapshot: {},
      paymentMethod,
      paymentStatus,
      amountReceived:
        amountReceived || (paymentMethod === 'credit' ? 0 : total),
      change,
      creditDueDate: creditDueDate ? Timestamp.fromDate(creditDueDate) : null,
      amountDue: paymentMethod === 'credit' ? total : 0,
      status: 'completed' as const,
      createdAt: serverTimestamp(),
    };

    // Usar transacción para asegurar consistencia
    const saleId = await runTransaction(db, async (transaction) => {
      // 1. Crear venta
      const saleRef = doc(collection(db, SALES_COLLECTION));
      transaction.set(saleRef, saleData);

      // 2. Actualizar stock de productos
      for (const item of items) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await transaction.get(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          const newStock = productData.stock - item.quantity;

          if (newStock < 0) {
            throw new Error(
              `Stock insuficiente para producto: ${item.productName}`
            );
          }

          transaction.update(productRef, {
            stock: newStock,
            updatedAt: serverTimestamp(),
          });
        }
      }

      return saleRef.id;
    });

    // 3. Si es venta a crédito, crear cargo en customer_transactions
    if (paymentMethod === 'credit' && customerId && creditDueDate) {
      await createCustomerCharge(
        storeId,
        customerId,
        saleId,
        total,
        creditDueDate,
        cashierId
      );
    }

    // Devolver venta creada
    const newSale: Sale = {
      id: saleId,
      ...saleData,
      createdAt: new Date(),
      creditDueDate: creditDueDate || undefined,
    } as Sale;

    return newSale;
  } catch (error) {
    console.error('Error processing sale:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Error al procesar venta'
    );
  }
}

/**
 * Obtener ventas de una tienda
 */
export async function getSales(storeId: string): Promise<Sale[]> {
  try {
    const salesRef = collection(db, SALES_COLLECTION);
    const q = query(
      salesRef,
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestamps(data),
      } as Sale;
    });
  } catch (error) {
    console.error('Error getting sales:', error);
    throw new Error('Error al obtener ventas');
  }
}

/**
 * Obtener venta por ID
 */
export async function getSaleById(saleId: string): Promise<Sale | null> {
  try {
    const docRef = doc(db, SALES_COLLECTION, saleId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...convertTimestamps(data),
    } as Sale;
  } catch (error) {
    console.error('Error getting sale:', error);
    throw new Error('Error al obtener venta');
  }
}

/**
 * Anular venta (solo admin/owner)
 */
export async function cancelSale(
  saleId: string,
  userId: string,
  reason: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const saleRef = doc(db, SALES_COLLECTION, saleId);
      const saleSnap = await transaction.get(saleRef);

      if (!saleSnap.exists()) {
        throw new Error('Venta no encontrada');
      }

      const saleData = saleSnap.data() as Sale;

      // Revertir stock de productos
      for (const item of saleData.items) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await transaction.get(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          const newStock = productData.stock + item.quantity;

          transaction.update(productRef, {
            stock: newStock,
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Marcar venta como cancelada
      transaction.update(saleRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: userId,
        cancelReason: reason,
      });
    });
  } catch (error) {
    console.error('Error cancelling sale:', error);
    throw new Error('Error al anular venta');
  }
}
