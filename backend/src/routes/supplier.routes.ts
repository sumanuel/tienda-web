import { Router } from 'express';
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierTransactions,
  createSupplierTransaction,
  getSupplierProducts,
  getUpcomingPayables,
} from '../controllers/supplierController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// CRUD de proveedores
router.get('/', listSuppliers); // GET /api/suppliers?storeId=xxx&search=xxx&page=1&limit=50
router.get('/:id', getSupplier); // GET /api/suppliers/:id
router.post('/', createSupplier); // POST /api/suppliers
router.put('/:id', updateSupplier); // PUT /api/suppliers/:id
router.delete('/:id', deleteSupplier); // DELETE /api/suppliers/:id

// Transacciones de proveedores
router.get('/:id/transactions', getSupplierTransactions); // GET /api/suppliers/:id/transactions?limit=20
router.post('/:id/transactions', createSupplierTransaction); // POST /api/suppliers/:id/transactions

// Productos del proveedor
router.get('/:id/products', getSupplierProducts); // GET /api/suppliers/:id/products

// Cuentas por pagar próximas a vencer
router.get('/upcoming-payables/list', getUpcomingPayables); // GET /api/suppliers/upcoming-payables/list?storeId=xxx&days=7

export default router;
