import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getFinancialReport,
  getSalesReport,
} from '../controllers/reportController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/reports/financial - Estado de resultados mensual en USD
router.get('/financial', getFinancialReport);

// GET /api/reports/sales - Reporte de ventas del período en USD
router.get('/sales', getSalesReport);

export default router;
