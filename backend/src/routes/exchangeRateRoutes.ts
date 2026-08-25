import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getExchangeRates,
  updateExchangeRate,
  getExchangeRatesHistory,
} from '../controllers/exchangeRateController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/exchange-rates - Obtener tasas activas
router.get('/', getExchangeRates);

// GET /api/exchange-rates/history - Obtener historial completo
router.get('/history', getExchangeRatesHistory);

// POST /api/exchange-rates - Crear/actualizar tasa
router.post('/', updateExchangeRate);

export default router;
