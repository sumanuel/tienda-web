import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listSales,
  getSale,
  createSale,
  cancelSale,
  getSalesStats,
} from '../controllers/saleController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/sales/stats/summary - Estadísticas de ventas
router.get('/stats/summary', getSalesStats);

// GET /api/sales - Listar ventas (con filtros opcionales)
router.get('/', listSales);

// GET /api/sales/:id - Obtener una venta específica
router.get('/:id', getSale);

// POST /api/sales - Crear nueva venta
router.post('/', createSale);

// DELETE /api/sales/:id - Cancelar venta
router.delete('/:id', cancelSale);

export default router;
