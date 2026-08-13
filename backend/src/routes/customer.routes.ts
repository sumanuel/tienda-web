import { Router } from 'express';
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerTransactions,
  createCustomerTransaction,
} from '../controllers/customerController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// CRUD de clientes
router.get('/', listCustomers); // GET /api/customers?storeId=xxx&search=xxx&page=1&limit=50
router.get('/:id', getCustomer); // GET /api/customers/:id
router.post('/', createCustomer); // POST /api/customers
router.put('/:id', updateCustomer); // PUT /api/customers/:id
router.delete('/:id', deleteCustomer); // DELETE /api/customers/:id

// Transacciones de clientes
router.get('/:id/transactions', getCustomerTransactions); // GET /api/customers/:id/transactions?limit=20
router.post('/:id/transactions', createCustomerTransaction); // POST /api/customers/:id/transactions

export default router;
