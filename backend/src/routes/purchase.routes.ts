import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listPurchases,
  getPurchase,
  createPurchase,
  cancelPurchase,
  getPurchaseStats,
} from '../controllers/purchaseController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/purchases/stats/summary - Estadísticas de compras
router.get('/stats/summary', getPurchaseStats);

// GET /api/purchases - Listar compras (con filtros opcionales)
router.get('/', listPurchases);

// GET /api/purchases/:id - Obtener una compra específica
router.get('/:id', getPurchase);

// POST /api/purchases - Crear nueva compra
router.post('/', createPurchase);

// DELETE /api/purchases/:id - Cancelar compra
router.delete('/:id', cancelPurchase);

export default router;
