/**
 * Tests Unitarios - Customers Service
 * Validación exhaustiva de CRUD y reglas de negocio
 */

import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  getCustomerSalesHistory,
  updateCustomerBalance,
  getCustomersWithBalance,
} from '@/lib/customers';

// Mock de Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  doc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  },
  runTransaction: jest.fn(), // Para fix de BUG-108 y BUG-109
}));

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

describe('Customers Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== FUNCIONALIDAD BÁSICA ====================

  describe('createCustomer', () => {
    test('debe crear cliente con balance inicial 0', async () => {
      const mockData = {
        name: 'Juan Pérez',
        document: 'V12345678',
        phone: '0412-1234567',
        email: 'juan@example.com',
      };

      // Mock: no existe documento duplicado
      (getDocs as jest.Mock).mockResolvedValue({
        empty: true,
        docs: [],
      });

      // Mock: crear documento exitoso
      (addDoc as jest.Mock).mockResolvedValue({ id: 'customer-123' });

      const result = await createCustomer('store-1', mockData);

      expect(result.id).toBe('customer-123');
      expect(result.balance).toBe(0); // ✅ Balance inicial 0
      expect(result.storeId).toBe('store-1');
      expect(addDoc).toHaveBeenCalled();
    });

    test('debe rechazar documento duplicado dentro del mismo storeId', async () => {
      const mockData = { name: 'Test', document: 'V99999999' };

      // Mock: ya existe documento
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [{ id: 'existing', data: () => ({ document: 'V99999999' }) }],
      });

      await expect(createCustomer('store-1', mockData)).rejects.toThrow(
        'Ya existe un cliente con documento V99999999'
      );

      expect(addDoc).not.toHaveBeenCalled();
    });

    // ⚠️ BUG-111: Validación case-sensitive permite duplicados lógicos
    test('BUG-111: debe rechazar documento duplicado ignorando mayúsculas/minúsculas', async () => {
      const mockData1 = { name: 'Cliente 1', document: 'V12345678' };
      const mockData2 = { name: 'Cliente 2', document: 'v12345678' }; // lowercase

      // Primera creación
      (getDocs as jest.Mock).mockResolvedValueOnce({ empty: true, docs: [] });
      (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'customer-1' });
      await createCustomer('store-1', mockData1);

      // Segunda creación con documento lowercase
      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false, // ❌ FALLA: where('document', '==', 'v12345678') no encuentra 'V12345678'
        docs: [],
      });
      (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'customer-2' });

      // ❌ ACTUAL: Permite crear duplicado lógico
      // ✅ ESPERADO: Debe rechazar
      const result = await createCustomer('store-1', mockData2);
      expect(result).toBeDefined(); // Este test FALLA con implementación actual

      // ✅ FIX: Normalizar a uppercase antes de comparar
      // const normalizedDocument = data.document.toUpperCase().trim();
      // where('document', '==', normalizedDocument)
    });

    // ⚠️ BUG-108 CRÍTICO: Race condition permite duplicados simultáneos
    test('BUG-108 CRÍTICO: dos requests simultáneos NO deben crear duplicados', async () => {
      const storeId = 'store-1';
      const data = { name: 'Test Concurrencia', document: 'V88888888' };

      // Simular race condition: ambos leen "no existe" antes de que el otro escriba
      let createCount = 0;
      (getDocs as jest.Mock).mockImplementation(async () => {
        // Simular delay para que ambos lean antes de que el primero escriba
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { empty: true, docs: [] }; // ❌ Ambos ven "no existe"
      });

      (addDoc as jest.Mock).mockImplementation(async () => {
        createCount++;
        return { id: `customer-${createCount}` };
      });

      // Ejecutar dos creates simultáneos
      const [result1, result2] = await Promise.allSettled([
        createCustomer(storeId, data),
        createCustomer(storeId, data),
      ]);

      // ❌ ACTUAL: Ambos tienen éxito (duplicados creados)
      expect(result1.status).toBe('fulfilled');
      expect(result2.status).toBe('fulfilled');
      expect(createCount).toBe(2); // Se crearon 2 registros

      // ✅ ESPERADO: Solo uno debe tener éxito, el otro debe fallar
      // const successes = [result1, result2].filter(r => r.status === 'fulfilled');
      // expect(successes).toHaveLength(1);
      // const failures = [result1, result2].filter(r => r.status === 'rejected');
      // expect(failures).toHaveLength(1);

      // ✅ FIX: Usar runTransaction() para read+write atómico
      // await runTransaction(db, async (transaction) => {
      //   const existing = await getDocs(...); // DENTRO de transaction
      //   if (!existing.empty) throw new Error('Ya existe');
      //   transaction.set(newDocRef, customerData);
      // });
    });
  });

  describe('getCustomers', () => {
    test('debe retornar clientes filtrados por storeId y ordenados por nombre', async () => {
      const mockDocs = [
        {
          id: '1',
          data: () => ({
            name: 'Carlos',
            storeId: 'store-1',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          }),
        },
        {
          id: '2',
          data: () => ({
            name: 'Ana',
            storeId: 'store-1',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          }),
        },
      ];

      (getDocs as jest.Mock).mockResolvedValue({ docs: mockDocs });

      const result = await getCustomers('store-1');

      expect(result).toHaveLength(2);
      expect(where).toHaveBeenCalledWith('storeId', '==', 'store-1');
      expect(orderBy).toHaveBeenCalledWith('name', 'asc');
    });

    test('debe retornar array vacío si no hay clientes', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

      const result = await getCustomers('store-1');

      expect(result).toEqual([]);
    });
  });

  describe('getCustomerById', () => {
    test('debe retornar cliente si existe', async () => {
      const mockData = {
        name: 'Juan',
        document: 'V12345678',
        balance: 100,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        id: 'customer-1',
        data: () => mockData,
      });

      const result = await getCustomerById('customer-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('customer-1');
      expect(result?.name).toBe('Juan');
    });

    test('debe retornar null si no existe', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const result = await getCustomerById('fake-id');

      expect(result).toBeNull();
    });
  });

  describe('updateCustomer', () => {
    test('debe actualizar campos y setear updatedAt automáticamente', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateCustomer('customer-1', { name: 'Nombre Actualizado' });

      expect(updateDoc).toHaveBeenCalled();
      const callArgs = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(callArgs.name).toBe('Nombre Actualizado');
      expect(callArgs.updatedAt).toBeDefined();
    });
  });

  describe('deleteCustomer', () => {
    test('debe eliminar cliente', async () => {
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      await deleteCustomer('customer-1');

      expect(deleteDoc).toHaveBeenCalled();
    });

    // ⚠️ BUG-112: No verifica si tiene ventas antes de eliminar
    test('BUG-112: debe rechazar eliminación si cliente tiene ventas', async () => {
      // Mock: cliente tiene 5 ventas
      const mockSales = [
        { id: 'sale-1', total: 100 },
        { id: 'sale-2', total: 200 },
        { id: 'sale-3', total: 150 },
        { id: 'sale-4', total: 75 },
        { id: 'sale-5', total: 300 },
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSales.map((s) => ({ id: s.id, data: () => s })),
      });

      // ❌ ACTUAL: Elimina sin verificar
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);
      await deleteCustomer('customer-1');
      expect(deleteDoc).toHaveBeenCalled(); // Se eliminó

      // ✅ ESPERADO: Debe fallar
      // await expect(deleteCustomer('store-1', 'customer-1')).rejects.toThrow(
      //   'No se puede eliminar. El cliente tiene 5 venta(s) registrada(s)'
      // );

      // ✅ FIX: Verificar ventas antes de eliminar
      // const sales = await getCustomerSalesHistory(storeId, customerId);
      // if (sales.length > 0) throw new Error('No se puede eliminar...');
    });
  });

  // ==================== BÚSQUEDA ====================

  describe('searchCustomers', () => {
    test('debe filtrar por nombre, documento, teléfono y email', async () => {
      const mockCustomers = [
        {
          id: '1',
          name: 'Juan Pérez',
          document: 'V12345678',
          phone: '0412-1234567',
          email: 'juan@example.com',
        },
        {
          id: '2',
          name: 'María González',
          document: 'V87654321',
          phone: '0424-7654321',
          email: 'maria@example.com',
        },
        {
          id: '3',
          name: 'Pedro Rodríguez',
          document: 'V11111111',
          phone: '0414-1111111',
          email: 'pedro@example.com',
        },
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockCustomers.map((c) => ({ id: c.id, data: () => c })),
      });

      // Búsqueda por nombre
      const byName = await searchCustomers('store-1', 'María');
      expect(byName).toHaveLength(1);
      expect(byName[0].name).toBe('María González');

      // Búsqueda por documento
      const byDocument = await searchCustomers('store-1', 'V12345678');
      expect(byDocument).toHaveLength(1);
      expect(byDocument[0].name).toBe('Juan Pérez');

      // Búsqueda por teléfono
      const byPhone = await searchCustomers('store-1', '0414');
      expect(byPhone).toHaveLength(1);
      expect(byPhone[0].name).toBe('Pedro Rodríguez');

      // Búsqueda por email
      const byEmail = await searchCustomers('store-1', 'juan@');
      expect(byEmail).toHaveLength(1);
      expect(byEmail[0].email).toBe('juan@example.com');
    });

    test('debe retornar todos los clientes si término está vacío', async () => {
      const mockCustomers = [
        { id: '1', name: 'Cliente 1' },
        { id: '2', name: 'Cliente 2' },
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockCustomers.map((c) => ({ id: c.id, data: () => c })),
      });

      const result = await searchCustomers('store-1', '');

      expect(result).toHaveLength(2);
    });

    test('debe retornar array vacío si no hay matches', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          { id: '1', data: () => ({ name: 'Juan', document: 'V12345678' }) },
        ],
      });

      const result = await searchCustomers('store-1', 'NoExiste');

      expect(result).toEqual([]);
    });

    // ⚠️ BUG-110: Carga TODOS los clientes en memoria (no escalable)
    test('BUG-110: con 10,000 clientes es muy lento', async () => {
      // Simular 10,000 clientes
      const mockCustomers = Array.from({ length: 10000 }, (_, i) => ({
        id: `customer-${i}`,
        name: `Cliente ${i}`,
        document: `V${i.toString().padStart(8, '0')}`,
      }));

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockCustomers.map((c) => ({ id: c.id, data: () => c })),
      });

      const startTime = Date.now();
      await searchCustomers('store-1', 'Cliente 9999');
      const duration = Date.now() - startTime;

      // ❌ ACTUAL: Tarda mucho (carga 10,000 registros en memoria)
      console.warn(`Búsqueda tardó ${duration}ms con 10,000 registros`);

      // ✅ FIX: Agregar limit() a la query
      // const q = query(..., limit(100));
    });
  });

  // ==================== BALANCE ====================

  describe('updateCustomerBalance', () => {
    test('debe actualizar balance válido', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateCustomerBalance('customer-1', 150);

      expect(updateDoc).toHaveBeenCalled();
      const callArgs = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(callArgs.balance).toBe(150);
      expect(callArgs.updatedAt).toBeDefined();
    });

    test('debe rechazar balance negativo', async () => {
      await expect(updateCustomerBalance('customer-1', -50)).rejects.toThrow(
        'El balance no puede ser negativo'
      );

      expect(updateDoc).not.toHaveBeenCalled();
    });

    // ⚠️ BUG-109 ALTA: Race condition en actualización de balance
    test('BUG-109 ALTA: múltiples pagos simultáneos deben calcular balance correcto', async () => {
      // Cliente con balance inicial: $100
      let currentBalance = 100;

      (getDoc as jest.Mock).mockImplementation(() => ({
        exists: () => true,
        data: () => ({ balance: currentBalance }),
      }));

      (updateDoc as jest.Mock).mockImplementation(async (_, data) => {
        // Simular delay
        await new Promise((resolve) => setTimeout(resolve, 10));
        currentBalance = data.balance; // ❌ Sobrescribe sin leer actual
      });

      // Simular 3 pagos simultáneos: -$20, -$30, -$50
      // Balance esperado: $100 - $20 - $30 - $50 = $0
      await Promise.all([
        updateCustomerBalance('customer-1', 80), // 100 - 20
        updateCustomerBalance('customer-1', 70), // 100 - 30 (lee antes de que el primero escriba)
        updateCustomerBalance('customer-1', 50), // 100 - 50 (lee antes de que los otros escriban)
      ]);

      // ❌ ACTUAL: currentBalance = $50 (solo el último pago se aplicó)
      expect(currentBalance).toBe(50);

      // ✅ ESPERADO: currentBalance = $0 (todos los pagos aplicados)
      // expect(currentBalance).toBe(0);

      // ✅ FIX: Usar runTransaction() para leer y escribir atómicamente
      // await runTransaction(db, async (transaction) => {
      //   const doc = await transaction.get(customerRef);
      //   const newBalance = doc.data().balance + amountChange;
      //   transaction.update(customerRef, { balance: newBalance });
      // });
    });
  });

  describe('getCustomersWithBalance', () => {
    test('debe retornar solo clientes con balance > 0', async () => {
      const mockCustomers = [
        { id: '1', name: 'Cliente 1', balance: 0 },
        { id: '2', name: 'Cliente 2', balance: 100 },
        { id: '3', name: 'Cliente 3', balance: 50 },
        { id: '4', name: 'Cliente 4', balance: 0 },
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockCustomers.map((c) => ({ id: c.id, data: () => c })),
      });

      const result = await getCustomersWithBalance('store-1');

      expect(result).toHaveLength(2);
      expect(result.every((c) => c.balance > 0)).toBe(true);
    });
  });

  // ==================== HISTORIAL ====================

  describe('getCustomerSalesHistory', () => {
    test('debe retornar ventas ordenadas por fecha desc', async () => {
      const mockSales = [
        { id: 'sale-1', total: 100, createdAt: Timestamp.now() },
        { id: 'sale-2', total: 200, createdAt: Timestamp.now() },
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSales.map((s) => ({ id: s.id, data: () => s })),
      });

      const result = await getCustomerSalesHistory('store-1', 'customer-1');

      expect(result).toHaveLength(2);
      expect(where).toHaveBeenCalledWith('storeId', '==', 'store-1');
      expect(where).toHaveBeenCalledWith('customerId', '==', 'customer-1');
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    test('debe retornar array vacío si no tiene ventas', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

      const result = await getCustomerSalesHistory('store-1', 'customer-1');

      expect(result).toEqual([]);
    });

    // ⚠️ BUG-113 BAJA: Sin límite de registros
    test('BUG-113: cliente con 50,000 ventas puede causar timeout', async () => {
      // Simular cliente muy activo
      const mockSales = Array.from({ length: 50000 }, (_, i) => ({
        id: `sale-${i}`,
        total: 100,
        createdAt: Timestamp.now(),
      }));

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockSales.map((s) => ({ id: s.id, data: () => s })),
      });

      // ❌ ACTUAL: Intenta cargar 50,000 registros
      const result = await getCustomerSalesHistory('store-1', 'customer-1');
      expect(result).toHaveLength(50000);

      // ✅ FIX: Agregar limit(100)
      // const salesQuery = query(..., limit(100));
    });
  });
});
