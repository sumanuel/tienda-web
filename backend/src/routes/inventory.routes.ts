import { Router } from 'express';
import {
  listMovements,
  createAdjustment,
  getStockReport,
  getLowStock,
  getProductMovements,
} from '../controllers/inventoryController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Movimientos de inventario
router.get('/movements', listMovements);
router.get('/product/:productId/movements', getProductMovements);

// Ajustes de inventario
router.post('/adjustments', createAdjustment);

// Reportes
router.get('/stock-report', getStockReport);
router.get('/low-stock', getLowStock);

export default router;
