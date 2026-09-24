import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listPurchaseReturns,
  getPurchaseReturn,
  createPurchaseReturn,
} from '../controllers/purchaseReturnController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/purchase-returns - Listar devoluciones de compra
router.get('/', listPurchaseReturns);

// GET /api/purchase-returns/:id - Obtener una devolución específica
router.get('/:id', getPurchaseReturn);

// POST /api/purchase-returns - Crear nueva devolución de compra
router.post('/', createPurchaseReturn);

export default router;
