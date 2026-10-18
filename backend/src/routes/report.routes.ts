import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getFinancialReport } from '../controllers/reportController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/reports/financial - Estado de resultados mensual en USD
router.get('/financial', getFinancialReport);

export default router;
